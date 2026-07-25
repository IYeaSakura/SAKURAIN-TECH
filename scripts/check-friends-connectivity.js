import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import dns from 'dns';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { isMainThread, parentPort, Worker } from 'worker_threads';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRIENDS_FILE = path.join(__dirname, '../public/data/friends.json');

const TIMEOUT = 15000;
const MAX_RETRIES = 2;
const CONCURRENCY_LIMIT = 10;

const ALLOW_UNSAFE_HTTPS = process.env.ALLOW_UNSAFE_HTTPS === 'true';

function createHttpsAgent() {
  return new https.Agent({
    rejectUnauthorized: !ALLOW_UNSAFE_HTTPS,
    secureOptions: ALLOW_UNSAFE_HTTPS ? crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION : undefined,
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

function getRandomDelay(min = 50, max = 200) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBackoffDelay(attempt, baseDelay = 300) {
  const jitter = Math.random() * 200;
  return Math.min(baseDelay * Math.pow(2, attempt) + jitter, 2000);
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

function generateIdFromUrl(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  return hash.substring(0, 8);
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    let normalized = parsed.hostname.toLowerCase();
    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      normalized += `:${parsed.port}`;
    }
    if (parsed.pathname && parsed.pathname !== '/') {
      normalized += parsed.pathname.replace(/\/$/, '');
    }
    return normalized;
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

function normalizeFriendIds(friends) {
  const idMap = new Map();
  let normalizedCount = 0;
  let addedCount = 0;

  friends.forEach((friend, index) => {
    if (!friend.url) {
      return;
    }

    const normalizedUrl = normalizeUrl(friend.url);
    const baseId = generateIdFromUrl(normalizedUrl);

    let finalId = baseId;
    let suffix = 0;

    while (idMap.has(finalId)) {
      suffix++;
      finalId = `${baseId}${suffix.toString(16).padStart(2, '0')}`;
    }

    const hadId = !!friend.id;
    if (friend.id !== finalId) {
      if (!hadId) {
        addedCount++;
      } else {
        normalizedCount++;
      }
      friend.id = finalId;
    }

    idMap.set(finalId, index);
  });

  return { normalizedCount, addedCount };
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
    'Range': 'bytes=0-8191',
    'Referer': 'https://sakurain.net/friends',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
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

function dnsLookup(hostname, timeout = 3000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ success: false, error: 'DNS timeout' });
    }, timeout);

    dns.lookup(hostname, { all: false }, (error, address) => {
      clearTimeout(timer);
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, address });
      }
    });
  });
}

function hasHtmlStructure(body) {
  if (!body || body.length < 10) return false;
  const lowerBody = body.toLowerCase();
  return lowerBody.includes('<html') && lowerBody.includes('<title');
}

function analyzePageContent(body) {
  const result = {
    isMaintenance: false,
    hasHtmlStructure: false,
    reason: null,
  };

  if (!body || body.length < 10) {
    return result;
  }

  const lowerBody = body.toLowerCase();
  result.hasHtmlStructure = lowerBody.includes('<html') && lowerBody.includes('<title');

  const maintenanceIndicators = [
    'maintenance',
    'under maintenance',
    'site maintenance',
    '网站维护',
    '系统维护',
    '正在维护',
    '维护中',
    '暂时关闭',
    '系统升级',
    '升级中',
    '正在升级',
    'service unavailable',
    '暂时无法访问',
    'be right back',
    'coming soon',
    'we\'ll be back',
    'we will be back',
    'down for maintenance',
    'scheduled maintenance',
    '临时维护',
    '维护模式',
    'maintenance mode',
  ];

  const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].toLowerCase();
    for (const indicator of maintenanceIndicators) {
      if (title.includes(indicator)) {
        result.isMaintenance = true;
        result.reason = `title: ${indicator}`;
        return result;
      }
    }
  }

  const h1Match = body.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    const h1 = h1Match[1].toLowerCase();
    for (const indicator of maintenanceIndicators) {
      if (h1.includes(indicator)) {
        result.isMaintenance = true;
        result.reason = `h1: ${indicator}`;
        return result;
      }
    }
  }

  return result;
}

function checkUrlWithGet(url, timeout = TIMEOUT, isFallback = false, redirectDepth = 0) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;
    const headers = buildHeaders();
    const proxy = getProxyForUrl(url);

    const options = {
      method: 'GET',
      timeout: timeout,
      headers,
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
        if (redirectUrl !== url && redirectDepth < 5) {
          checkUrlWithGet(redirectUrl, timeout, isFallback, redirectDepth + 1).then(resolve);
          return;
        }
      }

      const hasProtection =
        !!res.headers['cf-ray'] ||
        !!res.headers['x-sucuri-id'] ||
        !!res.headers['x-sucuri-cache'] ||
        res.headers.server?.toLowerCase().includes('cloudflare');

      let body = '';
      let bodyLength = 0;
      const maxBodyLength = 8192;

      res.on('data', (chunk) => {
        bodyLength += chunk.length;
        if (bodyLength <= maxBodyLength) {
          body += chunk.toString('utf8');
        }
      });

      res.on('end', () => {
        req.destroy();
        const contentInfo = analyzePageContent(body);

        if (contentInfo.isMaintenance) {
          resolve({
            success: true,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            hasProtection,
            isMaintenance: true,
            maintenanceReason: contentInfo.reason,
            hasContent: bodyLength > 0,
            usedHttpFallback: isFallback,
          });
          return;
        }

        // A site is considered alive if it returns a valid HTML structure,
        // regardless of the HTTP status code (403/404/503 are all acceptable).
        if (contentInfo.hasHtmlStructure) {
          resolve({
            success: true,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            hasProtection,
            hasContent: bodyLength > 0,
            usedHttpFallback: isFallback,
          });
          return;
        }

        resolve({
          success: false,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          error: 'Empty response',
          usedHttpFallback: isFallback,
        });
      });
    });

    req.on('error', (error) => {
      req.destroy();
      resolve({
        success: false,
        error: error.message,
        usedHttpFallback: isFallback,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout',
        usedHttpFallback: isFallback,
      });
    });

    req.end();
  });
}

function curlRequest(url) {
  return new Promise((resolve) => {
    try {
      const output = execSync(
        `curl -sL --max-time ${Math.floor(TIMEOUT / 1000)} ` +
        `-H "User-Agent: ${getRandomUserAgent()}" ` +
        `-H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" ` +
        `-H "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7" ` +
        `-H "Range: bytes=0-8191" ` +
        `-H "Referer: https://sakurain.net/friends" ` +
        `--compressed "${url}"`,
        {
          encoding: 'utf-8',
          timeout: TIMEOUT + 2000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );

      const contentInfo = analyzePageContent(output);
      resolve({
        success: contentInfo.hasHtmlStructure,
        statusCode: contentInfo.hasHtmlStructure ? 200 : null,
        usedCurl: true,
        isMaintenance: contentInfo.isMaintenance,
        maintenanceReason: contentInfo.reason,
        hasContent: output.length > 0,
      });
    } catch (error) {
      resolve({
        success: false,
        error: `curl failed: ${error.message}`,
        usedCurl: true,
      });
    }
  });
}

async function checkUrlWithRetry(url, retries = MAX_RETRIES) {
  const startTime = Date.now();

  // Step 1: DNS precheck
  try {
    const parsed = new URL(url);
    const dnsResult = await dnsLookup(parsed.hostname);
    if (!dnsResult.success) {
      return {
        success: false,
        status: 'offline',
        error: `DNS failed: ${dnsResult.error}`,
        attempts: 1,
        responseTime: Date.now() - startTime,
      };
    }
  } catch {
    // Invalid URL will be caught by HTTP request error.
  }

  // Step 2: Node.js GET with Range header
  for (let i = 0; i <= retries; i++) {
    try {
      if (i > 0) {
        const delay = getBackoffDelay(i - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

      let result = await checkUrlWithGet(url);

      if (!result.success && url.startsWith('https://')) {
        const httpUrl = getHttpAlternative(url);
        if (httpUrl) {
          await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
          const httpResult = await checkUrlWithGet(httpUrl, TIMEOUT, true);
          if (httpResult.success) {
            result = httpResult;
          }
        }
      }

      if (result.success) {
        const responseTime = Date.now() - startTime;
        return {
          success: true,
          status: result.isMaintenance ? 'maintenance' : 'online',
          statusCode: result.statusCode,
          attempts: i + 1,
          responseTime,
          hasProtection: result.hasProtection || false,
          isMaintenance: result.isMaintenance || false,
          maintenanceReason: result.maintenanceReason || null,
          usedHttpFallback: result.usedHttpFallback || false,
          hasContent: result.hasContent || false,
        };
      }

      // On the last Node.js retry, fall through to curl.
      if (i === retries) break;
    } catch (error) {
      if (i === retries) break;
    }
  }

  // Step 3: System curl fallback
  try {
    await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    const curlResult = await curlRequest(url);
    const responseTime = Date.now() - startTime;

    if (curlResult.success) {
      return {
        success: true,
        status: curlResult.isMaintenance ? 'maintenance' : 'online',
        statusCode: curlResult.statusCode,
        attempts: retries + 2,
        responseTime,
        usedCurl: true,
        isMaintenance: curlResult.isMaintenance || false,
        maintenanceReason: curlResult.maintenanceReason || null,
        hasContent: curlResult.hasContent || false,
      };
    }
  } catch {
    // Fall through to offline.
  }

  return {
    success: false,
    status: 'offline',
    error: 'Failed after DNS, Node.js GET and curl fallback',
    attempts: retries + 2,
    responseTime: Date.now() - startTime,
  };
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

    console.log('Normalizing friend IDs...');
    const { normalizedCount, addedCount } = normalizeFriendIds(data.friends);
    if (normalizedCount > 0 || addedCount > 0) {
      console.log(`  Added: ${addedCount}, Normalized: ${normalizedCount}`);
    } else {
      console.log('  All IDs are valid');
    }
    console.log('');

    // Skip the expensive HTTP connectivity checks when building in
    // memory-constrained environments (e.g. EdgeOne Pages builder). The source
    // friends.json already contains statuses and checkInfo.
    const shouldSkipFriendCheck = process.env.SKIP_FRIEND_CHECK === 'true' || process.env.CI === 'true';
    if (shouldSkipFriendCheck) {
      console.log('Skipping HTTP connectivity checks (CI or SKIP_FRIEND_CHECK).');
      const unidirectionalFriends = data.friends.filter(friend => friend.unidirectional === true);
      const bidirectionalFriends = data.friends.filter(friend => friend.unidirectional !== true);
      data.friends = [...bidirectionalFriends, ...unidirectionalFriends];
      data.lastUpdated = getBuildTimestamp();
      fs.writeFileSync(FRIENDS_FILE, JSON.stringify(data, null, 2));
      console.log(`Updated ${FRIENDS_FILE}`);
      return;
    }

    const friendsToCheck = data.friends.filter(friend => friend.url);

    // Deduplicate by normalized URL so the same endpoint is only checked once.
    const urlToFriends = new Map();
    for (const friend of friendsToCheck) {
      const normalized = normalizeUrl(friend.url);
      if (!urlToFriends.has(normalized)) {
        urlToFriends.set(normalized, []);
      }
      urlToFriends.get(normalized).push(friend);
    }
    const uniqueUrls = Array.from(urlToFriends.keys());

    console.log(`Checking connectivity for ${friendsToCheck.length} friends (${uniqueUrls.length} unique URLs, workers: ${Math.min(os.cpus().length, 8)})...`);
    console.log('');

    const startTime = Date.now();
    const resultByUrl = new Map();

    if (uniqueUrls.length === 0) {
      console.log('No URLs to check.');
    } else {
      const workerCount = Math.min(os.cpus().length, 8, uniqueUrls.length);
      const batches = Array.from({ length: workerCount }, () => []);
      uniqueUrls.forEach((url, index) => batches[index % workerCount].push(url));

      const workerPromises = batches.map((batch, index) => {
        return new Promise((resolve, reject) => {
          const worker = new Worker(__filename, { type: 'module' });
          const results = [];
          worker.on('message', (message) => {
            if (message.type === 'batch-complete') {
              results.push(...message.results);
            }
          });
          worker.on('error', reject);
          worker.on('exit', (code) => {
            if (code !== 0) {
              reject(new Error(`Worker ${index} exited with code ${code}`));
            } else {
              resolve(results);
            }
          });
          worker.postMessage({ type: 'check-batch', urls: batch });
        });
      });

      const allResults = (await Promise.all(workerPromises)).flat();
      for (const { url, result } of allResults) {
        resultByUrl.set(url, result);
      }
    }

    // Apply each unique URL result to every friend sharing that URL.
    let completedCount = 0;
    const total = friendsToCheck.length;
    for (const [normalizedUrl, friends] of urlToFriends.entries()) {
      const result = resultByUrl.get(normalizedUrl) || {
        success: false,
        status: 'offline',
        error: 'No result from worker',
        attempts: 0,
        responseTime: null,
      };

      for (const friend of friends) {
        completedCount++;
        const progress = Math.round((completedCount / total) * 100);
        const maintenanceLabel = result.isMaintenance ? ' [维护]' : '';
        const protectionLabel = result.hasProtection ? ' [防护]' : '';
        const httpFallbackLabel = result.usedHttpFallback ? ' [HTTP]' : '';
        const curlLabel = result.usedCurl ? ' [curl]' : '';

        let status;
        if (result.isMaintenance) {
          status = `⚠ Maintenance (${result.statusCode})${maintenanceLabel}`;
        } else if (result.success) {
          status = `✓ Online (${result.statusCode})${httpFallbackLabel}${curlLabel}${protectionLabel}`;
        } else {
          status = `✗ Offline (${result.error || result.statusCode || 'unknown'})`;
        }

        console.log(`[${completedCount}/${total}] ${progress}% - ${friend.name}: ${status}`);

        const checkInfo = {
          lastChecked: getBuildTimestamp(),
          statusCode: result.statusCode || null,
          error: result.error || null,
          attempts: result.attempts,
          usedHttpFallback: result.usedHttpFallback || false,
          usedCurl: result.usedCurl || false,
          responseTime: result.responseTime || null,
          hasProtection: result.hasProtection || false,
          isMaintenance: result.isMaintenance || false,
          maintenanceReason: result.maintenanceReason || null,
          hasContent: result.hasContent || false,
        };

        if (result.isMaintenance) {
          friend.status = 'maintenance';
          friend.checkInfo = checkInfo;
          if (friend.offlineSince) {
            delete friend.offlineSince;
          }
        } else if (result.success) {
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
      }
    }

    const unidirectionalFriends = data.friends.filter(friend => friend.unidirectional === true);
    const bidirectionalFriends = data.friends.filter(friend => friend.unidirectional !== true);
    data.friends = [...bidirectionalFriends, ...unidirectionalFriends];
    data.lastUpdated = getBuildTimestamp();

    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(data, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const onlineCount = friendsToCheck.filter(f => f.status === 'online').length;
    const offlineCount = friendsToCheck.filter(f => f.status === 'offline').length;
    const maintenanceCount = friendsToCheck.filter(f => f.status === 'maintenance').length;

    console.log('');
    console.log('Connectivity check completed!');
    console.log(`Time elapsed: ${elapsed}s`);
    console.log(`Updated ${FRIENDS_FILE}`);
    console.log('');
    console.log('Summary:');
    console.log(`  Online:      ${onlineCount}`);
    console.log(`  Maintenance: ${maintenanceCount}`);
    console.log(`  Offline:     ${offlineCount}`);
    console.log(`  Total:       ${friendsToCheck.length}`);

  } catch (error) {
    console.error('Failed to check friends connectivity:', error);
    process.exit(1);
  }
}

if (isMainThread) {
  checkFriendsConnectivity().catch((error) => {
    console.error('✘ Unexpected error during friends connectivity check:', error.message);
    process.exit(1);
  });
} else {
  parentPort.on('message', async (message) => {
    if (message.type === 'check-batch') {
      const results = [];
      for (const url of message.urls) {
        const result = await checkUrlWithRetry(url);
        results.push({ url, result });
      }
      parentPort.postMessage({ type: 'batch-complete', results });
    }
  });
}
