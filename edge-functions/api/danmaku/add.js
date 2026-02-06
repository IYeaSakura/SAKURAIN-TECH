export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    if (!body.text || !body.userId || !body.color) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const text = body.text.trim();
    if (!text || text.length > 50) {
      return Response.json({ error: 'Invalid text length' }, { status: 400 });
    }

    // 获取 KV
    const kv = context.env.DANMAKU_KV;
    if (!kv) {
      return Response.json({ error: 'KV not bound' }, { status: 500 });
    }

    // 获取现有数据
    let danmakus = [];
    const existing = await kv.get('danmakus');
    if (existing) {
      try {
        danmakus = JSON.parse(existing);
        if (!Array.isArray(danmakus)) danmakus = [];
      } catch {
        danmakus = [];
      }
    }

    // 创建新弹幕
    const id = 'd-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    const newDanmaku = {
      id,
      text,
      userId: body.userId,
      timestamp: Date.now(),
      color: body.color,
      angle: body.angle ?? Math.random() * 6.28,
      inclination: body.inclination ?? ((Math.random() - 0.5) * 2),
      altitude: body.altitude ?? (15000000 + Math.random() * 20000000),
      speed: body.speed ?? (0.5 + Math.random()),
    };

    danmakus.push(newDanmaku);
    
    // 只保留200条
    if (danmakus.length > 200) {
      danmakus = danmakus.slice(-200);
    }

    await kv.put('danmakus', JSON.stringify(danmakus));

    return Response.json({ success: true, danmaku: newDanmaku });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
