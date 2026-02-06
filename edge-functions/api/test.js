export async function onRequestGet(context) {
  try {
    const kv = context.env.DANMAKU_KV;
    
    // 测试 KV 是否可访问
    let kvTest = 'not tested';
    if (kv) {
      try {
        await kv.put('test', JSON.stringify({ time: Date.now() }));
        const val = await kv.get('test');
        kvTest = val ? 'working' : 'read failed';
      } catch (e) {
        kvTest = 'error: ' + e.message;
      }
    } else {
      kvTest = 'not bound';
    }
    
    return Response.json({
      status: 'ok',
      kv: kvTest,
      env: Object.keys(context.env || {}),
      timestamp: Date.now(),
    });
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
