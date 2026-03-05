import { addCorsHeaders } from '../../auth.js';
import { checkRateLimit, createRateLimitResponse } from '../../rate-limit.js';

// 获取访客地理位置
function getLocationFromIP(ip, request) {
  // EdgeOne 自动注入的地理位置信息
  const cf = {
    country: request.headers.get('CF-IPCountry') || 'Unknown',
    city: request.headers.get('CF-IPCity') || 'Unknown',
    latitude: request.headers.get('CF-IPLatitude'),
    longitude: request.headers.get('CF-IPLongitude'),
  };
  
  if (cf.country !== 'Unknown') {
    return cf;
  }
  
  // 备用：从IP判断
  return { country: 'Unknown', city: 'Unknown' };
}

// 解析 User-Agent
function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  
  const ua_lower = ua.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';
  
  // Browser detection
  if (ua_lower.includes('edg/')) browser = 'Edge';
  else if (ua_lower.includes('firefox')) browser = 'Firefox';
  else if (ua_lower.includes('chrome')) browser = 'Chrome';
  else if (ua_lower.includes('safari')) browser = 'Safari';
  
  // OS detection
  if (ua_lower.includes('windows')) os = 'Windows';
  else if (ua_lower.includes('mac')) os = 'macOS';
  else if (ua_lower.includes('linux')) os = 'Linux';
  else if (ua_lower.includes('android')) { os = 'Android'; device = 'Mobile'; }
  else if (ua_lower.includes('iphone') || ua_lower.includes('ipad')) { os = 'iOS'; device = 'Mobile'; }
  
  return { browser, os, device };
}

// 记录访问数据
async function trackVisit(request, env) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // 获取客户端信息
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For')?.split(',')[0] || 
               'unknown';
    const ua = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    
    const { browser, os, device } = parseUserAgent(ua);
    const location = getLocationFromIP(ip, request);
    
    // 生成唯一会话ID (每天每个IP一个)
    const sessionId = `${ip}_${date}`;
    
    // 存储访问记录
    const visitData = {
      timestamp,
      pathname,
      browser,
      os,
      device,
      country: location.country,
      city: location.city,
      referer: referer.slice(0, 100), // 限制长度
      sessionId,
    };
    
    // 获取现有数据
    const visitsKey = `visits:${date}`;
    const existing = await ANALYTICS_KV.get(visitsKey);
    const visits = existing ? JSON.parse(existing) : [];
    
    // 添加新记录 (限制存储数量)
    visits.push(visitData);
    if (visits.length > 1000) {
      visits.shift(); // 移除最早的
    }
    
    await ANALYTICS_KV.put(visitsKey, JSON.stringify(visits));
    
    // 更新统计计数器
    await updateStats(date, hour, pathname, browser, os, country, device);
    
    return true;
  } catch (e) {
    console.error('Analytics error:', e);
    return false;
  }
}

// 更新统计数据
async function updateStats(date, hour, pathname, browser, os, country, device) {
  try {
    // 获取现有统计
    const statsKey = `stats:${date}`;
    const existing = await ANALYTICS_KV.get(statsKey);
    const stats = existing ? JSON.parse(existing) : {
      totalVisits: 0,
      uniqueSessions: new Set(),
      hourly: Array(24).fill(0),
      pages: {},
      browsers: {},
      os: {},
      countries: {},
      devices: {},
    };
    
    // 更新统计
    stats.totalVisits++;
    stats.uniqueSessions.add(sessionId);
    stats.hourly[hour]++;
    
    stats.pages[pathname] = (stats.pages[pathname] || 0) + 1;
    stats.browsers[browser] = (stats.browsers[browser] || 0) + 1;
    stats.os[os] = (stats.os[os] || 0) + 1;
    stats.countries[country] = (stats.countries[country] || 0) + 1;
    stats.devices[device] = (stats.devices[device] || 0) + 1;
    
    await ANALYTICS_KV.put(statsKey, JSON.stringify(stats));
  } catch (e) {
    console.error('Stats error:', e);
  }
}

// 获取统计数据
async function getStats(days = 7) {
  try {
    const results = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const stats = await ANALYTICS_KV.get(`stats:${dateStr}`);
      if (stats) {
        const data = JSON.parse(stats);
        results.push({
          date: dateStr,
          totalVisits: data.totalVisits,
          uniqueVisitors: data.uniqueSessions?.size || 0,
          hourly: data.hourly,
          topPages: Object.entries(data.pages || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10),
          browsers: data.browsers,
          os: data.os,
          countries: data.countries,
        });
      }
    }
    
    return results;
  } catch (e) {
    console.error('Get stats error:', e);
    return [];
  }
}

// 实时数据 (最近1小时)
async function getRealtimeData() {
  try {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const date = new Date().toISOString().split('T')[0];
    
    const visitsKey = `visits:${date}`;
    const visitsData = await ANALYTICS_KV.get(visitsKey);
    
    if (!visitsData) return { active: 0, recent: [] };
    
    const visits = JSON.parse(visitsData);
    const recent = visits.filter(v => v.timestamp > oneHourAgo);
    
    // 统计活跃会话
    const activeSessions = new Set(recent.map(v => v.sessionId));
    
    return {
      active: activeSessions.size,
      recent: recent.slice(-20).reverse(), // 最近20条
    };
  } catch (e) {
    return { active: 0, recent: [] };
  }
}

export async function onRequestGet(context) {
  try {
    const rateLimitResult = await checkRateLimit(context.request);
    if (!rateLimitResult.allowed) {
      return addCorsHeaders(createRateLimitResponse(rateLimitResult));
    }
    
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') || 'stats';
    
    if (type === 'realtime') {
      const data = await getRealtimeData();
      return addCorsHeaders(new Response(
        JSON.stringify({ success: true, data }),
        { headers: { 'Content-Type': 'application/json' } }
      ));
    }
    
    if (type === 'stats') {
      const days = parseInt(url.searchParams.get('days') || '7');
      const data = await getStats(days);
      return addCorsHeaders(new Response(
        JSON.stringify({ success: true, data }),
        { headers: { 'Content-Type': 'application/json' } }
      ));
    }
    
    return addCorsHeaders(new Response(
      JSON.stringify({ error: 'Invalid type' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    ));
  } catch (err) {
    return addCorsHeaders(new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    ));
  }
}

export async function onRequestPost(context) {
  // 记录访问
  await trackVisit(context.request, context.env);
  
  return addCorsHeaders(new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } }
  ));
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
