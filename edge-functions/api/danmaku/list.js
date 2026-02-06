export async function onRequestGet(context) {
  try {
    const kv = context.env.DANMAKU_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await kv.get('danmakus');
    let danmakus = [];
    if (data) {
      try {
        danmakus = JSON.parse(data);
      } catch (e) {
        danmakus = [];
      }
    }

    return new Response(JSON.stringify(danmakus), {
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
