export async function onRequestGet(context) {
  try {
    const kv = context.env.DANMAKU_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV not bound' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await kv.get('danmakus');
    if (!data) {
      return new Response(JSON.stringify([]), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    let danmakus = [];
    try {
      danmakus = JSON.parse(data);
      if (!Array.isArray(danmakus)) danmakus = [];
    } catch {
      danmakus = [];
    }

    return new Response(JSON.stringify(danmakus), {
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
