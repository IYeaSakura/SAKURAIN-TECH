export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    if (!body.text || !body.userId || !body.color) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const danmakus = JSON.parse(await context.env.DANMAKU_KV.get('danmakus') || '[]');

    const newDanmaku = {
      id: body.id || `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: body.text.trim(),
      userId: body.userId,
      timestamp: Date.now(),
      angle: Math.random() * Math.PI * 2,
      speed: 0.0001 + Math.random() * 0.0002,
      color: body.color,
    };

    danmakus.push(newDanmaku);

    await context.env.DANMAKU_KV.put('danmakus', JSON.stringify(danmakus));

    return new Response(JSON.stringify({ success: true, danmaku: newDanmaku }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add danmaku' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
