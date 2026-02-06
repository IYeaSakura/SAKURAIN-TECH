export async function onRequestGet(context) {
  try {
    const kv = context.env.DANMAKU_KV;
    if (!kv) {
      return Response.json({ error: 'KV not bound' }, { status: 500 });
    }

    const data = await kv.get('danmakus');
    if (!data) return Response.json([]);

    let danmakus = [];
    try {
      danmakus = JSON.parse(data);
      if (!Array.isArray(danmakus)) danmakus = [];
    } catch {
      danmakus = [];
    }

    return Response.json(danmakus);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
