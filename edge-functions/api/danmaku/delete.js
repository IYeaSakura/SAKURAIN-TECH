export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    if (!body.id) {
      return new Response(JSON.stringify({ error: 'Missing danmaku id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let danmakus = JSON.parse(await context.env.DANMAKU_KV.get('danmakus') || '[]');
    danmakus = danmakus.filter(d => d.id !== body.id);

    await context.env.DANMAKU_KV.put('danmakus', JSON.stringify(danmakus));

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete danmaku' }), {
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
