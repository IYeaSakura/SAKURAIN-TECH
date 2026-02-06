// 注意：DANMAKU_KV 是通过环境变量绑定的 KV 命名空间
// 在 Edge Functions 中，绑定的 KV 可以直接通过全局变量名访问

export async function onRequestGet(context) {
  try {
    // 尝试通过 context.env 访问
    let kv = context.env.DANMAKU_KV;
    
    // 如果不行，尝试全局变量（某些版本可能直接暴露）
    if (!kv && typeof DANMAKU_KV !== 'undefined') {
      kv = DANMAKU_KV;
    }
    
    // 调试信息
    const debug = {
      fromEnv: !!context.env.DANMAKU_KV,
      fromGlobal: typeof DANMAKU_KV !== 'undefined',
      kvType: typeof kv,
      envKeys: Object.keys(context.env || {})
    };

    if (!kv) {
      return new Response(JSON.stringify({ 
        error: 'KV not bound',
        debug: debug
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 检查 kv 的方法
    const methods = Object.keys(kv || {});
    debug.kvMethods = methods;

    if (typeof kv.get !== 'function') {
      return new Response(JSON.stringify({ 
        error: 'KV.get is not a function',
        debug: debug
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
