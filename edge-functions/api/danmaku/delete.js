// 删除弹幕 - Edge Function

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    if (!body.id) {
      return new Response(JSON.stringify({ error: 'Missing danmaku id' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 获取现有弹幕
    let danmakus = [];
    try {
      const existingData = await context.env.DANMAKU_KV.get('danmakus');
      if (existingData) {
        danmakus = JSON.parse(existingData);
      }
    } catch (parseError) {
      console.error('Error parsing existing danmakus:', parseError);
      danmakus = [];
    }

    // 查找要删除的弹幕
    const danmakuToDelete = danmakus.find(d => d.id === body.id);
    if (!danmakuToDelete) {
      return new Response(JSON.stringify({ error: 'Danmaku not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 过滤掉要删除的弹幕
    const filteredDanmakus = danmakus.filter(d => d.id !== body.id);

    // 保存回 KV
    await context.env.DANMAKU_KV.put('danmakus', JSON.stringify(filteredDanmakus));

    return new Response(JSON.stringify({ success: true, deleted: body.id }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error deleting danmaku:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete danmaku', details: error.message }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
