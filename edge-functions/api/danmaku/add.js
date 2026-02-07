export async function onRequestPost(context) {
  try {
    let body = {};
    try {
      body = await context.request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Bad JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!body.text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const text = String(body.text).trim();
    if (!text || text.length > 15) {
      return new Response(JSON.stringify({ error: 'Invalid text length' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const kv = DANMAKU_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 获取弹幕列表
    let danmakus = [];
    const data = await kv.get('danmakus');
    if (data) {
      try {
        danmakus = JSON.parse(data);
      } catch (e) {
        danmakus = [];
      }
    }

    const newDanmaku = {
      id: 'd' + Date.now(),
      text: text,
      userId: String(body.userId || 'anon'),
      timestamp: Date.now(),
      color: String(body.color || '#60a5fa'),
      // 轨道类型
      orbitType: String(body.orbitType || 'medium'),
      // 轨道参数
      angle: body.angle != null ? body.angle : Math.random() * Math.PI * 2,
      inclination: body.inclination != null ? body.inclination : (Math.random() - 0.5) * Math.PI / 1.5,
      altitude: body.altitude != null ? body.altitude : (2000000 + Math.random() * 1000000), // 默认2000-3000km
      speed: body.speed != null ? body.speed : (2 + Math.random()),
      // 升交点赤经 RAAN，用于确定轨道平面方向
      raan: body.raan != null ? body.raan : Math.random() * Math.PI * 2,
    };

    danmakus.push(newDanmaku);
    if (danmakus.length > 200) {
      // 如果超过200条，删除最早的弹幕及其markdown内容
      const removedDanmaku = danmakus.shift();
      if (removedDanmaku) {
        // 删除对应的markdown内容（列表格式）
        let textList = [];
        const textData = await kv.get('text');
        if (textData) {
          try {
            textList = JSON.parse(textData);
            if (!Array.isArray(textList)) {
              textList = [];
            }
          } catch (e) {
            textList = [];
          }
        }
        // 过滤掉要删除的条目
        textList = textList.filter((item) => item.id !== removedDanmaku.id);
        await kv.put('text', JSON.stringify(textList));
      }
    }

    await kv.put('danmakus', JSON.stringify(danmakus));

    // 如果有 markdown 文本，保存到 text 键（列表格式）
    if (body.markdownContent) {
      const markdownText = String(body.markdownContent).trim();
      if (markdownText) {
        // 限制 markdown 长度不超过 300 字符
        if (markdownText.length > 300) {
          return new Response(JSON.stringify({ error: 'Markdown content too long (max 300 chars)' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        // 获取现有的 text 数据（列表格式）
        let textList = [];
        const textData = await kv.get('text');
        if (textData) {
          try {
            textList = JSON.parse(textData);
            if (!Array.isArray(textList)) {
              textList = [];
            }
          } catch (e) {
            textList = [];
          }
        }
        // 检查是否已存在该 id 的条目，存在则更新，否则添加
        const existingIndex = textList.findIndex((item) => item.id === newDanmaku.id);
        if (existingIndex >= 0) {
          textList[existingIndex].text = markdownText;
        } else {
          textList.push({ id: newDanmaku.id, text: markdownText });
        }
        await kv.put('text', JSON.stringify(textList));
      }
    }

    return new Response(JSON.stringify({ success: true, danmaku: newDanmaku }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
