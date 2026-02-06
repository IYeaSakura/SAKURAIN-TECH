// 添加弹幕 - Edge Function
// 包含频率限制和内容过滤

// 简单的内容过滤器
const FILTER_WORDS = ['脏话', 'spam', '广告']; // 可以根据需要扩展

function containsFilteredContent(text) {
  const lowerText = text.toLowerCase();
  return FILTER_WORDS.some(word => lowerText.includes(word));
}

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
    const trimmedText = body.text.trim();
    if (trimmedText.length === 0 || trimmedText.length > 50) {
      return new Response(JSON.stringify({ error: 'Text length must be between 1 and 50 characters' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 内容过滤
    if (containsFilteredContent(trimmedText)) {
      return new Response(JSON.stringify({ error: 'Content contains inappropriate words' }), {
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

    // 检查该用户最近的发送频率（服务端二次校验）
    const now = Date.now();
    const userRecentDanmakus = danmakus.filter(d => 
      d.userId === body.userId && (now - d.timestamp) < 60000
    );
    
    if (userRecentDanmakus.length >= 10) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 生成轨道参数（如果客户端没有提供）
    const earthRadius = 6371000; // 米
    const altitude = body.altitude || (15000000 + Math.random() * 20000000);
    const angle = body.angle ?? Math.random() * Math.PI * 2;
    const inclination = body.inclination ?? ((Math.random() - 0.5) * Math.PI / 1.5);
    const speed = body.speed ?? ((0.5 + Math.random() * 1.0) * (Math.random() > 0.5 ? 1 : -1));

    // 创建新弹幕
    const newDanmaku = {
      id: body.id || `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: trimmedText,
      userId: body.userId,
      timestamp: now,
      color: body.color,
      // 轨道参数
      angle,
      inclination,
      altitude,
      speed,
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
