export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    if (!body.id) {
      return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    const kv = context.env.DANMAKU_KV;
    if (!kv) {
      return Response.json({ error: 'KV not bound' }, { status: 500 });
    }

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

    const filtered = danmakus.filter(d => d.id !== body.id);
    await kv.put('danmakus', JSON.stringify(filtered));

    return Response.json({ success: true });
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
