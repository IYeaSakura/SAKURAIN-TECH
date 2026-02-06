export async function onRequestPost(context) {
  try {
    // 1. 解析请求体
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 2. 验证字段
    if (!body.text || !body.userId || !body.color) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const text = body.text.trim();
    if (!text || text.length > 50) {
      return new Response(JSON.stringify({ error: 'Invalid text' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 3. 检查 KV
    const kv = context.env.DANMAKU_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV not bound' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 4. 获取现有数据
    let danmakus = [];
    try {
      const existing = await kv.get('danmakus');
      if (existing) {
        danmakus = JSON.parse(existing);
        if (!Array.isArray(danmakus)) danmakus = [];
      }
    } catch (e) {
      danmakus = [];
    }

    // 5. 创建新弹幕（简化轨道参数）
    const newDanmaku = {
      id: 'd' + Date.now(),
      text: text,
      userId: body.userId,
      timestamp: Date.now(),
      color: body.color,
      angle: Math.random() * Math.PI * 2,
      inclination: 0,
      altitude: 20000000,
      speed: 1,
    };

    // 6. 添加到数组
    danmakus.push(newDanmaku);
    if (danmakus.length > 200) {
      danmakus = danmakus.slice(-200);
    }

    // 7. 保存到 KV
    await kv.put('danmakus', JSON.stringify(danmakus));

    // 8. 返回成功
    return new Response(JSON.stringify({ success: true, danmaku: newDanmaku }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
