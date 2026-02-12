import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRIENDS_FILE = path.join(__dirname, '../public/data/friends.json');

const TIMEOUT = 15000;
const MAX_RETRIES = 3;

// 是否允许不安全 HTTPS（自签名证书）
const ALLOW_UNSAFE_HTTPS = process.env.ALLOW_UNSAFE_HTTPS === 'true';

// 创建自定义的 HTTPS agent，可选跳过证书验证
function createHttpsAgent() {
  return new https.Agent({
    rejectUnauthorized: !ALLOW_UNSAFE_HTTPS,
    // 允许过期的证书
    secureOptions: ALLOW_UNSAFE_HTTPS ? require('crypto').constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION : undefined,
  });
}

// 随机 User-Agent 池
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

// 随机获取 User-Agent
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// 随机延迟（带抖动）
function getRandomDelay(min = 800, max = 3000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 指数退避延迟
function getBackoffDelay(attempt, baseDelay = 1000) {
  const jitter = Math.random() * 1000;
  return Math.min(baseDelay * Math.pow(2, attempt) + jitter, 10000);
}

function getBuildTimestamp() {
  const now = new Date();
  return now.toISOString();
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDateBefore(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1 < d2;
}

// 构建真实的浏览器请求头
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

  // 浏览器特定的 headers
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

// 解析代理配置（支持 HTTP_PROXY/HTTPS_PROXY 环境变量）
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

// 检查是否需要降级到 HTTP
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
      // 跟随重定向
      followRedirect: true,
      maxRedirects: 5,
    };

    // HTTPS 特殊处理：允许不安全证书
    if (isHttps) {
      options.agent = createHttpsAgent();
    }

    // 添加代理支持
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
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        req.destroy();
        const redirectUrl = new URL(res.headers.location, url).toString();
        // 递归检查重定向 URL，增加尝试次数限制
        if (attempt < 3) {
          checkUrl(redirectUrl, attempt + 1, isFallback).then(resolve);
          return;
        }
      }

      req.destroy();

      // 更宽松的成功判定（包括 429  too many requests 视为需要重试）
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      const needRetry = res.statusCode === 429 || res.statusCode === 503 || res.statusCode === 502;
      
      resolve({
        success: isSuccess,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        needRetry: needRetry,
        headers: res.headers,
        usedHttpFallback: isFallback,
      });
    });

    req.on('error', (error) => {
      req.destroy();
      
      // SSL 证书错误，尝试降级到 HTTP
      if (isHttps && !isFallback) {
        const httpUrl = getHttpAlternative(url);
        if (httpUrl) {
          // 延迟 500ms 后尝试 HTTP
          setTimeout(() => {
            checkUrl(httpUrl, 0, true).then(resolve);
          }, 500);
          return;
        }
      }
      
      resolve({
        success: false,
        error: error.message,
        needRetry: !error.message.includes('certificate'), // 证书错误不重试
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

    // 随机初始延迟，模拟真实用户行为
    setTimeout(() => {
      req.end();
    }, Math.random() * 200);
  });
}

// 尝试 GET 请求作为备选（某些服务器会拒绝 HEAD 请求）
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
      // 只读取部分数据后中断
      res.on('data', () => {
        // 收到数据即认为成功，中断连接
        req.destroy();
        resolve({
          success: true,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
        });
      });
      
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
        });
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
  const lastError = null;
  let usedHttpFallback = false;
  
  for (let i = 0; i <= retries; i++) {
    try {
      // 添加随机延迟，避免请求过于规律
      if (i > 0) {
        const delay = getBackoffDelay(i - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      let result = await checkUrl(url);
      
      // 如果 HEAD 请求失败，尝试 GET 请求
      if (!result.success && i === retries - 1) {
        await new Promise(resolve => setTimeout(resolve, getRandomDelay(300, 800)));
        result = await checkUrlWithGet(result.usedHttpFallback ? getHttpAlternative(url) || url : url);
        if (result.usedHttpFallback) {
          usedHttpFallback = true;
        }
      }

      if (result.success) {
        return { 
          success: true, 
          status: 'online',
          statusCode: result.statusCode,
          attempts: i + 1,
          usedHttpFallback,
        };
      }

      // 如果服务器明确拒绝（非 429/503 等临时错误），提前退出
      if (!result.needRetry && result.statusCode >= 400) {
        return {
          success: false,
          status: 'offline',
          statusCode: result.statusCode,
          error: result.statusMessage || 'Blocked',
          attempts: i + 1,
          usedHttpFallback,
        };
      }

      // 最后一次重试失败
      if (i === retries) {
        return {
          success: false,
          status: 'offline',
          statusCode: result.statusCode,
          error: result.error || result.statusMessage || 'Failed after retries',
          attempts: i + 1,
          usedHttpFallback,
        };
      }
    } catch (error) {
      if (i === retries) {
        return {
          success: false,
          status: 'offline',
          error: error.message,
          attempts: i + 1,
          usedHttpFallback,
        };
      }
    }
  }

  return { success: false, status: 'offline', error: lastError, attempts: retries + 1, usedHttpFallback };
}

async function checkFriendsConnectivity() {
  try {
    const content = fs.readFileSync(FRIENDS_FILE, 'utf-8');
    const data = JSON.parse(content);

    if (!data.friends || !Array.isArray(data.friends)) {
      console.error('Invalid friends.json structure');
      return;
    }

    console.log(`Checking connectivity for ${data.friends.length} friends...`);

    const results = [];
    const unidirectionalFriends = [];

    for (let index = 0; index < data.friends.length; index++) {
      const friend = data.friends[index];
      if (!friend.url) {
        console.warn(`Skipping friend ${friend.id}: no URL`);
        continue;
      }

      process.stdout.write(`[${index + 1}/${data.friends.length}] Checking ${friend.id}... `);

      const result = await checkUrlWithRetry(friend.url);

      if (result.success) {
        const fallbackNote = result.usedHttpFallback ? ' [HTTP]' : '';
        console.log(`✓ Online (${result.statusCode})${fallbackNote}`);
        friend.status = 'online';
        if (friend.offlineSince) {
          delete friend.offlineSince;
        }
      } else {
        console.log(`✗ Offline (${result.error || result.statusCode || 'unknown'})`);
        friend.status = 'offline';
        const today = getTodayDate();
        if (!friend.offlineSince) {
          friend.offlineSince = today;
        } else if (isDateBefore(today, friend.offlineSince)) {
          friend.offlineSince = today;
        }
      }

      results.push({
        id: friend.id,
        name: friend.name,
        url: friend.url,
        status: result.success ? 'online' : 'offline',
        attempts: result.attempts,
      });

      if (friend.unidirectional === true) {
        unidirectionalFriends.push(friend);
      }

      // 随机延迟，避免被识别为爬虫
      // 最后一个请求不需要延迟
      if (index < data.friends.length - 1) {
        const delay = getRandomDelay(500, 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const bidirectionalFriends = data.friends.filter(friend => friend.unidirectional !== true);
    data.friends = [...bidirectionalFriends, ...unidirectionalFriends];
    data.lastUpdated = getBuildTimestamp();

    const updatedContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(FRIENDS_FILE, updatedContent);

    console.log('\nConnectivity check completed!');
    console.log(`Updated ${FRIENDS_FILE}`);

    const onlineCount = results.filter(r => r.status === 'online').length;
    const offlineCount = results.filter(r => r.status === 'offline').length;

    console.log(`\nSummary:`);
    console.log(`  Online: ${onlineCount}`);
    console.log(`  Offline: ${offlineCount}`);
    console.log(`  Total: ${results.length}`);

  } catch (error) {
    console.error('Failed to check friends connectivity:', error);
    process.exit(1);
  }
}

checkFriendsConnectivity();
