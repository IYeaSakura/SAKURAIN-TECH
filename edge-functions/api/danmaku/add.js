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
    if (!text || text.length > 15) {
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

    // 获取弹幕列表
    let danmakus = [];
    const data = await kv.get('danmakus');
    if (data) {
      try {
        danmakus = JSON.parse(data);
      } catch (e) {
        danmakus = [];
      }
    }

    // 处理 markdown 内容
    let markdown = '';
    if (body.markdown) {
      const md = String(body.markdown).trim();
      if (md && md.length <= 300) {
        markdown = md;
      }
    }

    // 使用前端发送的 id 或生成新的
    const danmakuId = body.id || ('d' + Date.now());
    
    const newDanmaku = {
      id: danmakuId,
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
      // 升交点赤经 RAAN，用于确定轨道平面方向
      raan: body.raan != null ? body.raan : Math.random() * Math.PI * 2,
      // Markdown 内容，默认为空
      markdown: markdown,
    };

    danmakus.push(newDanmaku);
    if (danmakus.length > 200) {
      // 如果超过200条，删除最早的弹幕
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
