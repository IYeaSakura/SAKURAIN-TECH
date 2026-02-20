import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRIENDS_FILE = path.join(__dirname, '../public/data/friends.json');

const TIMEOUT = 15000;
const MAX_RETRIES = 2;
const CONCURRENCY_LIMIT = 5;

const ALLOW_UNSAFE_HTTPS = process.env.ALLOW_UNSAFE_HTTPS === 'true';

function createHttpsAgent() {
  return new https.Agent({
    rejectUnauthorized: !ALLOW_UNSAFE_HTTPS,
    secureOptions: ALLOW_UNSAFE_HTTPS ? require('crypto').constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION : undefined,
  });
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.0 Edg/122.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomDelay(min = 200, max = 800) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBackoffDelay(attempt, baseDelay = 500) {
  const jitter = Math.random() * 300;
  return Math.min(baseDelay * Math.pow(2, attempt) + jitter, 5000);
}

function getBuildTimestamp() {
  return new Date().toISOString();
}

function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isDateBefore(date1, date2) {
  return new Date(date1) < new Date(date2);
}

function buildHeaders() {
  const userAgent = getRandomUserAgent();
  const isChrome = userAgent.includes('Chrome');
  const isFirefox = userAgent.includes('Firefox');
  const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
  
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  };

  if (isChrome || isSafari) {
    headers['sec-ch-ua'] = '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"';
    headers['sec-ch-ua-mobile'] = '?0';
    headers['sec-ch-ua-platform'] = userAgent.includes('Windows') ? '"Windows"' : '"macOS"';
  }

  if (isFirefox) {
    delete headers['sec-ch-ua'];
    delete headers['sec-ch-ua-mobile'];
    delete headers['sec-ch-ua-platform'];
    headers['TE'] = 'trailers';
  }

  return headers;
}

function getProxyForUrl(url) {
  const proxyUrl = url.startsWith('https') 
    ? process.env.HTTPS_PROXY || process.env.https_proxy 
    : process.env.HTTP_PROXY || process.env.http_proxy;
  
  if (!proxyUrl) return null;
  
  try {
    const parsed = new URL(proxyUrl);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80),
      auth: parsed.username ? `${parsed.username}:${parsed.password}` : undefined,
    };
  } catch {
    return null;
  }
}

function getHttpAlternative(url) {
  if (url.startsWith('https://')) {
    return url.replace('https://', 'http://');
  }
  return null;
}

function checkUrl(url, attempt = 0, isFallback = false) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;
    const headers = buildHeaders();
    const proxy = getProxyForUrl(url);

    const options = {
      method: 'HEAD',
      timeout: TIMEOUT,
      headers,
      followRedirect: true,
      maxRedirects: 5,
    };

    if (isHttps) {
      options.agent = createHttpsAgent();
    }

    if (proxy) {
      options.host = proxy.host;
      options.port = proxy.port;
      options.path = url;
      options.headers['Host'] = new URL(url).host;
      if (proxy.auth) {
        options.headers['Proxy-Authorization'] = `Basic ${Buffer.from(proxy.auth).toString('base64')}`;
      }
    }

    const req = protocol.request(proxy ? options : new URL(url), options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        req.destroy();
        const redirectUrl = new URL(res.headers.location, url).toString();
        if (attempt < 3) {
          checkUrl(redirectUrl, attempt + 1, isFallback).then(resolve);
          return;
        }
      }

      req.destroy();

      // Check for anti-bot indicators (403, 429, 404 can all be anti-bot responses)
      const isAntiBot = 
        res.statusCode === 403 ||
        res.statusCode === 429 ||
        res.statusCode === 404 ||
        (res.headers['x-frame-options'] === 'DENY' && res.statusCode === 403);
      
      // Check for CDN protection
      const hasProtection = 
        res.headers['cf-ray'] ||
        res.headers['x-sucuri-id'] ||
        res.headers['x-sucuri-cache'] ||
        res.headers.server?.toLowerCase().includes('cloudflare');

      // 4xx means site is reachable (could be anti-bot, page not found, etc.)
      const isClientError = res.statusCode >= 400 && res.statusCode < 500;

      // Consider online if: 2xx, 3xx, or 4xx
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      const isReachable = isSuccess || isClientError;
      const needRetry = res.statusCode === 429 || res.statusCode === 503 || res.statusCode === 502;
      
      resolve({
        success: isReachable,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        needRetry: needRetry,
        headers: res.headers,
        usedHttpFallback: isFallback,
        isAntiBot,
        hasProtection,
      });
    });

    req.on('error', (error) => {
      req.destroy();
      
      if (isHttps && !isFallback) {
        const httpUrl = getHttpAlternative(url);
        if (httpUrl) {
          setTimeout(() => {
            checkUrl(httpUrl, 0, true).then(resolve);
          }, 300);
          return;
        }
      }
      
      resolve({
        success: false,
        error: error.message,
        needRetry: !error.message.includes('certificate'),
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout',
        needRetry: true,
      });
    });

    setTimeout(() => req.end(), Math.random() * 100);
  });
}

function checkUrlWithGet(url, timeout = TIMEOUT) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;
    const headers = buildHeaders();
    
    const options = {
      method: 'GET',
      timeout: timeout,
      headers,
    };

    if (isHttps) {
      options.agent = createHttpsAgent();
    }

    const req = protocol.request(new URL(url), options, (res) => {
      // Check for anti-bot indicators (403, 429, 404 can all be anti-bot responses)
      const isAntiBot = 
        res.statusCode === 403 ||
        res.statusCode === 429 ||
        res.statusCode === 404 ||
        (res.headers['x-frame-options'] === 'DENY' && res.statusCode === 403);
      
      // Check for Cloudflare or similar protection
      const hasProtection = 
        res.headers['cf-ray'] ||
        res.headers['x-sucuri-id'] ||
        res.headers['x-sucuri-cache'] ||
        res.headers.server?.toLowerCase().includes('cloudflare');

      res.on('data', () => {
        req.destroy();
        resolve({
          success: true,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          isAntiBot,
          hasProtection,
        });
      });
      
      res.on('end', () => {
        // If it's an anti-bot response, still consider it as reachable
        if (isAntiBot || hasProtection) {
          resolve({
            success: true,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            isAntiBot: true,
            hasProtection: !!hasProtection,
          });
        } else if (res.statusCode >= 500) {
          // 5xx server errors - offline
          resolve({
            success: false,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
          });
        } else {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
          });
        }
      });
    });

    req.on('error', (error) => {
      req.destroy();
      resolve({
        success: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout',
      });
    });

    req.end();
  });
}

async function checkUrlWithRetry(url, retries = MAX_RETRIES) {
  let usedHttpFallback = false;
  const startTime = Date.now();
  
  for (let i = 0; i <= retries; i++) {
    try {
      if (i > 0) {
        const delay = getBackoffDelay(i - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      let result = await checkUrl(url);
      
      if (!result.success && i === retries - 1) {
        await new Promise(resolve => setTimeout(resolve, getRandomDelay(100, 300)));
        result = await checkUrlWithGet(result.usedHttpFallback ? getHttpAlternative(url) || url : url);
        if (result.usedHttpFallback) {
          usedHttpFallback = true;
        }
      }

      const responseTime = Date.now() - startTime;

      if (result.success) {
        return { 
          success: true, 
          status: 'online',
          statusCode: result.statusCode,
          attempts: i + 1,
          usedHttpFallback,
          responseTime,
          isAntiBot: result.isAntiBot || false,
          hasProtection: result.hasProtection || false,
        };
      }

      // 5xx server errors - offline
      if (result.statusCode >= 500) {
        return {
          success: false,
          status: 'offline',
          statusCode: result.statusCode,
          error: result.statusMessage || 'Server Error',
          attempts: i + 1,
          usedHttpFallback,
          responseTime,
        };
      }

      if (i === retries) {
        return {
          success: false,
          status: 'offline',
          statusCode: result.statusCode,
          error: result.error || result.statusMessage || 'Failed after retries',
          attempts: i + 1,
          usedHttpFallback,
          responseTime,
        };
      }
    } catch (error) {
      if (i === retries) {
        const responseTime = Date.now() - startTime;
        return {
          success: false,
          status: 'offline',
          error: error.message,
          attempts: i + 1,
          usedHttpFallback,
          responseTime,
        };
      }
    }
  }

  return { success: false, status: 'offline', error: 'Unknown error', attempts: retries + 1, usedHttpFallback };
}

async function runWithConcurrency(tasks, concurrencyLimit) {
  const results = [];
  const executing = new Set();
  const taskQueue = [...tasks];

  while (taskQueue.length > 0 || executing.size > 0) {
    while (taskQueue.length > 0 && executing.size < concurrencyLimit) {
      const task = taskQueue.shift();
      const promise = task().then(result => {
        executing.delete(promise);
        results.push(result);
      });
      executing.add(promise);
    }

    if (executing.size > 0) {
      await Promise.race(executing);
    }
  }

  return results;
}

async function checkFriendsConnectivity() {
  try {
    const content = fs.readFileSync(FRIENDS_FILE, 'utf-8');
    const data = JSON.parse(content);

    if (!data.friends || !Array.isArray(data.friends)) {
      console.error('Invalid friends.json structure');
      return;
    }

    const friendsToCheck = data.friends.filter(friend => friend.url);
    console.log(`Checking connectivity for ${friendsToCheck.length} friends (concurrency: ${CONCURRENCY_LIMIT})...`);
    console.log('');

    const startTime = Date.now();
    const completedCount = { value: 0 };
    const total = friendsToCheck.length;

    const tasks = friendsToCheck.map((friend, index) => async () => {
      const result = await checkUrlWithRetry(friend.url);
      
      completedCount.value++;
      const progress = Math.round((completedCount.value / total) * 100);
      const antiBotLabel = result.isAntiBot ? ' [反爬]' : '';
      const protectionLabel = result.hasProtection ? ' [防护]' : '';
      const httpFallbackLabel = result.usedHttpFallback ? ' [HTTP]' : '';
      const status = result.success 
        ? `✓ Online (${result.statusCode})${httpFallbackLabel}${antiBotLabel}${protectionLabel}`
        : `✗ Offline (${result.error || result.statusCode || 'unknown'})`;
      
      console.log(`[${completedCount.value}/${total}] ${progress}% - ${friend.id}: ${status}`);

      const checkInfo = {
        lastChecked: getBuildTimestamp(),
        statusCode: result.statusCode || null,
        error: result.error || null,
        attempts: result.attempts,
        usedHttpFallback: result.usedHttpFallback || false,
        responseTime: result.responseTime || null,
        isAntiBot: result.isAntiBot || false,
        hasProtection: result.hasProtection || false,
      };

      if (result.success) {
        friend.status = 'online';
        friend.checkInfo = checkInfo;
        if (friend.offlineSince) {
          delete friend.offlineSince;
        }
      } else {
        friend.status = 'offline';
        friend.checkInfo = checkInfo;
        const today = getTodayDate();
        if (!friend.offlineSince) {
          friend.offlineSince = today;
        } else if (isDateBefore(today, friend.offlineSince)) {
          friend.offlineSince = today;
        }
      }

      return {
        id: friend.id,
        name: friend.name,
        url: friend.url,
        status: result.success ? 'online' : 'offline',
        attempts: result.attempts,
        checkInfo,
      };
    });

    const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT);

    const unidirectionalFriends = data.friends.filter(friend => friend.unidirectional === true);
    const bidirectionalFriends = data.friends.filter(friend => friend.unidirectional !== true);
    data.friends = [...bidirectionalFriends, ...unidirectionalFriends];
    data.lastUpdated = getBuildTimestamp();

    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(data, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const onlineCount = results.filter(r => r.status === 'online').length;
    const offlineCount = results.filter(r => r.status === 'offline').length;

    console.log('');
    console.log('Connectivity check completed!');
    console.log(`Time elapsed: ${elapsed}s`);
    console.log(`Updated ${FRIENDS_FILE}`);
    console.log('');
    console.log('Summary:');
    console.log(`  Online:  ${onlineCount}`);
    console.log(`  Offline: ${offlineCount}`);
    console.log(`  Total:   ${results.length}`);

  } catch (error) {
    console.error('Failed to check friends connectivity:', error);
    process.exit(1);
  }
}

checkFriendsConnectivity();
