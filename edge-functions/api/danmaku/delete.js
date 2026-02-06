export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    if (!body.id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const kv = context.env.DANMAKU_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV not bound' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
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
