export async function onRequestGet(context) {
  try {
    // 调试：检查 context.env
    const envKeys = Object.keys(context.env || {});
    
    // 尝试不同的方式获取 KV
    let kv = context.env.DANMAKU_KV;
    
    if (!kv) {
      return new Response(JSON.stringify({ 
        error: 'KV not bound',
        debug: {
          envKeys: envKeys,
          hasEnv: !!context.env,
          kvType: typeof kv
        }
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*' 
        }
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
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ 
      error: String(err),
      stack: err.stack 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      }
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
