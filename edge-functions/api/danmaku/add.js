// 添加弹幕 - Edge Function

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // 验证必填字段
    if (!body.text || !body.userId || !body.color) {
      return new Response(JSON.stringify({ error: 'Missing required fields: text, userId, color' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 文本长度限制
    if (body.text.trim().length === 0 || body.text.trim().length > 50) {
      return new Response(JSON.stringify({ error: 'Text length must be between 1 and 50 characters' }), {
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

    // 创建新弹幕
    const newDanmaku = {
      id: body.id || `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: body.text.trim(),
      userId: body.userId,
      timestamp: Date.now(),
      angle: body.angle ?? Math.random() * Math.PI * 2,
      speed: body.speed ?? (0.0001 + Math.random() * 0.0002),
      color: body.color,
    };

    // 限制弹幕总数（保留最新的 200 条）
    danmakus.push(newDanmaku);
    if (danmakus.length > 200) {
      danmakus = danmakus.slice(-200);
    }

    // 保存到 KV
    await context.env.DANMAKU_KV.put('danmakus', JSON.stringify(danmakus));

    return new Response(JSON.stringify({ success: true, danmaku: newDanmaku }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error adding danmaku:', error);
    return new Response(JSON.stringify({ error: 'Failed to add danmaku', details: error.message }), {
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
