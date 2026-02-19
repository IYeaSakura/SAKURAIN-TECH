/**
 * 批量获取友链RSS接口 - 一次性获取所有缓存内容
 *
 * 请求方式: GET
 *
 * 查询参数:
 * - feeds: JSON字符串数组，包含所有需要获取的feed URL和名称
 *   例如: [{"url":"https://example.com/feed","name":"Example Blog"}]
 *
 * 返回:
 * - cached: 已缓存的feed内容数组，包含url, name, content, timestamp, fromCache
 * - missing: 缓存中不存在的feed数组
 * - expired: 已过期的feed数组（超过24小时）
 * - failed: 被标记为失败的feed数组
 */

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时，单位毫秒

// Check if source is marked as failed
async function checkFailedSource(kv, feedUrl) {
  if (!kv) return { failed: false };

  const failedKey = `feed:failed:${feedUrl}`;
  try {
    const failedData = await kv.get(failedKey);
    if (failedData) {
      const data = JSON.parse(failedData);
      return {
        failed: true,
        error: data.error,
        timestamp: data.timestamp,
        attempts: data.attempts || 1
      };
    }
  } catch (e) {
    console.error('KV get failed source error:', e);
  }
  return { failed: false };
}

// Get cached feed data
async function getCachedFeed(kv, feedUrl) {
  if (!kv) return null;

  const cacheKey = `feed:${feedUrl}`;
  try {
    const cached = await kv.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return {
        content: data.content,
        contentType: data.contentType || 'application/xml',
        timestamp: data.timestamp,
        age: Date.now() - data.timestamp,
        isExpired: (Date.now() - data.timestamp) >= CACHE_TTL,
      };
    }
  } catch (e) {
    console.error('KV get error:', e);
  }
  return null;
}

export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const feedsParam = url.searchParams.get('feeds');

    console.log('[Feed Batch Get] Request received');

    // 验证参数
    if (!feedsParam) {
      return new Response(JSON.stringify({ error: 'Missing feeds parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 解析feeds参数
    let feeds;
    try {
      feeds = JSON.parse(feedsParam);
      if (!Array.isArray(feeds)) {
        throw new Error('feeds must be an array');
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid feeds parameter format', message: String(e) }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const kv = FEED_KV;
    const now = Date.now();

    const result = {
      cached: [],
      missing: [],
      expired: [],
      failed: [],
    };

    // 并行获取所有缓存状态
    const feedChecks = feeds.map(async (feed) => {
      const feedUrl = feed.url;
      const feedName = feed.name || 'Unknown';

      // 验证URL格式
      try {
        new URL(feedUrl);
      } catch {
        result.failed.push({
          url: feedUrl,
          name: feedName,
          error: 'Invalid URL format',
        });
        return;
      }

      // 检查是否被标记为失败
      const failedStatus = await checkFailedSource(kv, feedUrl);
      if (failedStatus.failed) {
        result.failed.push({
          url: feedUrl,
          name: feedName,
          error: failedStatus.error,
          timestamp: failedStatus.timestamp,
          attempts: failedStatus.attempts,
        });
        return;
      }

      // 获取缓存
      const cached = await getCachedFeed(kv, feedUrl);

      if (!cached) {
        // 缓存不存在
        result.missing.push({
          url: feedUrl,
          name: feedName,
        });
      } else if (cached.isExpired) {
        // 缓存已过期，返回过期缓存并标记
        result.expired.push({
          url: feedUrl,
          name: feedName,
          timestamp: cached.timestamp,
          age: cached.age,
        });
        // 同时返回过期缓存内容（前端可以选择性使用）
        result.cached.push({
          url: feedUrl,
          name: feedName,
          content: cached.content,
          contentType: cached.contentType,
          timestamp: cached.timestamp,
          fromCache: true,
          isExpired: true,
        });
      } else {
        // 缓存有效
        result.cached.push({
          url: feedUrl,
          name: feedName,
          content: cached.content,
          contentType: cached.contentType,
          timestamp: cached.timestamp,
          fromCache: true,
          isExpired: false,
        });
      }
    });

    await Promise.all(feedChecks);

    console.log(`[Feed Batch Get] Results: ${result.cached.length} cached, ${result.missing.length} missing, ${result.expired.length} expired, ${result.failed.length} failed`);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Batch-Result': `${result.cached.length}/${feeds.length}`,
      },
    });

  } catch (err) {
    console.error('Batch get feed error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
