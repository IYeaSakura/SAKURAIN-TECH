// 健康检查 - 测试 Edge Function 是否正常工作

export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: Date.now(),
    env: {
      hasKV: !!context.env.DANMAKU_KV,
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
