// EdgeOne Pages 中 KV 可以直接通过绑定的变量名访问
// DANMAKU_KV 是绑定的变量名，应该可以直接使用

export async function onRequestGet(context) {
  try {
    // 尝试直接访问全局变量 DANMAKU_KV
    // 在 EdgeOne Pages 中，绑定的 KV 命名空间会直接作为全局变量暴露
    let kv = DANMAKU_KV;
    
    // 如果全局变量不存在，尝试从 env 获取
    if (!kv && context.env) {
      kv = context.env.DANMAKU_KV;
    }
    
    if (!kv) {
      return new Response(JSON.stringify({ 
        error: 'KV not bound',
        debug: {
          hasGlobal: typeof DANMAKU_KV !== 'undefined',
          globalType: typeof DANMAKU_KV,
          envType: context.env ? typeof context.env.DANMAKU_KV : 'no env'
        }
      }), {
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
    return new Response(JSON.stringify({ error: String(err), stack: err.stack }), {
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
