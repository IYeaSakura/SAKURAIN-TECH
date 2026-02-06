// 获取弹幕列表 - Edge Function
// 弹幕持久化存储，只限制总数不限制时间

export async function onRequestGet(context) {
  try {
    let danmakus = [];
    try {
      const existingData = await context.env.DANMAKU_KV.get('danmakus');
      if (existingData) {
        danmakus = JSON.parse(existingData);
      }
    } catch (parseError) {
      console.error('Error parsing danmakus:', parseError);
      danmakus = [];
    }

    // 返回所有弹幕（持久化存储）
    return new Response(JSON.stringify(danmakus), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching danmakus:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch danmakus', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
