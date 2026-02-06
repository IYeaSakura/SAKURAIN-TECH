export async function onRequestPost(context) {
  try {
    // 获取请求体
    let body = {};
    try {
      body = await context.request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Bad JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 简单验证
    if (!body.text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 获取 KV
    const kv = context.env.DANMAKU_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 获取现有数据
    let danmakus = [];
    const data = await kv.get('danmakus');
    if (data) {
      try {
        danmakus = JSON.parse(data);
      } catch (e) {
        danmakus = [];
      }
    }

    // 创建新弹幕
    const newDanmaku = {
      id: String(Date.now()),
      text: String(body.text).trim(),
      userId: String(body.userId || 'anon'),
      timestamp: Date.now(),
      color: String(body.color || '#60a5fa'),
      angle: Math.random() * 6.28,
      inclination: 0,
      altitude: 20000000,
      speed: 1
    };

    danmakus.push(newDanmaku);

    // 限制200条
    if (danmakus.length > 200) {
      danmakus.shift();
    }

    // 保存
    await kv.put('danmakus', JSON.stringify(danmakus));

    return new Response(JSON.stringify({ success: true, danmaku: newDanmaku }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
