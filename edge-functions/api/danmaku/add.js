export async function onRequestPost(context) {
  try {
    let body = {};
    try {
      body = await context.request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Bad JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!body.text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const text = String(body.text).trim();
    if (!text || text.length > 50) {
      return new Response(JSON.stringify({ error: 'Invalid text length' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const kv = DANMAKU_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    let danmakus = [];
    const data = await kv.get('danmakus');
    if (data) {
      try {
        danmakus = JSON.parse(data);
      } catch (e) {
        danmakus = [];
      }
    }

    const newDanmaku = {
      id: 'd' + Date.now(),
      text: text,
      userId: String(body.userId || 'anon'),
      timestamp: Date.now(),
      color: String(body.color || '#60a5fa'),
      // 轨道类型
      orbitType: String(body.orbitType || 'medium'),
      // 轨道参数
      angle: body.angle != null ? body.angle : Math.random() * Math.PI * 2,
      inclination: body.inclination != null ? body.inclination : (Math.random() - 0.5) * Math.PI / 1.5,
      altitude: body.altitude != null ? body.altitude : (2000000 + Math.random() * 1000000), // 默认2000-3000km
      speed: body.speed != null ? body.speed : (2 + Math.random()),
    };

    danmakus.push(newDanmaku);
    if (danmakus.length > 200) {
      danmakus.shift();
    }

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
