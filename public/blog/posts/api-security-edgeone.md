---
title: 在腾讯云 EO 上实现 API 安全验证系统
description: 记录在腾讯云边缘函数上实现 HMAC-SHA256 认证系统的完整过程，包括遇到的坑和解决方案。
date: 2026-02-08
author: SAKURAIN
tags: 腾讯云, 边缘计算, API安全, 边缘函数
cover: /image/logo.webp
featured: false
---

# 在腾讯云 EO 上实现 API 安全验证系统

前几天在给博客添加弹幕功能时，遇到了一个很现实的问题：弹幕 API 需要安全验证，防止被恶意调用。既然项目部署在腾讯云 EO 上，那就顺便研究一下如何在边缘函数上实现一套完整的 API 安全验证系统。

## 为什么需要 API 安全验证

弹幕功能涉及写操作（添加、删除弹幕），如果不加任何保护，任何人都可以调用 API，很容易被滥用。虽然前端可以做一些限制，但前端代码是可以被绕过的，所以必须在后端做验证。

常见的验证方式有：
- API Key 验证
- JWT Token验证
- OAuth 2.0

对于这种简单的场景，我选择了基于 HMAC-SHA256 的签名验证，原因如下：
- 不需要维护用户状态
- 实现相对简单
- 性能开销小
- 可以防止重放攻击

## 设计思路

核心思路是：前端在请求时生成签名，后端验证签名的正确性。

### 签名生成算法

签名由三部分组成：
1. **时间戳**：防止重放攻击
2. **Nonce**：随机值，确保每个请求唯一
3. **签名**：HMAC-SHA256(timestamp:nonce, secret_key)

前端生成签名后，将这三个值放在请求头中：
```
X-Timestamp: 1704067200000
X-Nonce: 550e8400-e29b-41d4-a716-446655440000
X-Signature: a1b2c3d4e5f6...
```

### 后端验证流程

1. 检查请求头是否完整
2. 验证时间戳是否在有效期内（5分钟容差）
3. 检查 Nonce 是否已被使用（防止重放）
4. 用相同的算法计算签名，对比是否一致
5. 将 Nonce 存入 KV，设置 5 分钟过期时间

## 实现过程

### 前端实现

先创建一个认证工具库：

```typescript
const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY || '';

async function generateSignature(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(API_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateAuthHeaders(): Promise<AuthHeaders> {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  const message = `${timestamp}:${nonce}`;
  const signature = await generateSignature(message);
  
  return {
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Signature': signature,
  };
}
```

在发送请求时带上认证头：

```typescript
const response = await fetch('/api/danmaku/add', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    ...await generateAuthHeaders(),
  },
  body: JSON.stringify(data),
});
```

### 后端实现

创建认证模块 `auth.js`：

```javascript
const TIMESTAMP_TOLERANCE = 5 * 60 * 1000;
const NONCE_TTL = 300;

export async function verifyAuthHeaders(headers, env) {
  const timestamp = headers.get('X-Timestamp');
  const nonce = headers.get('X-Nonce');
  const signature = headers.get('X-Signature');

  if (!timestamp || !nonce || !signature) {
    return { success: false, error: 'Missing required headers' };
  }

  const now = Date.now();
  const timestampNum = parseInt(timestamp, 10);

  if (Math.abs(now - timestampNum) > TIMESTAMP_TOLERANCE) {
    return { success: false, error: 'Timestamp expired' };
  }

  const usedNonce = await KV_SECRET.get(`nonce:${nonce}`);
  if (usedNonce) {
    return { success: false, error: 'Nonce already used' };
  }

  const message = `${timestamp}:${nonce}`;
  const isValid = await verifySignature(message, signature, env.VITE_API_SECRET_KEY);

  if (!isValid) {
    return { success: false, error: 'Invalid signature' };
  }

  await KV_SECRET.put(`nonce:${nonce}`, '1', {
    expirationTtl: NONCE_TTL,
  });

  return { success: true };
}
```

在 API 中使用：

```javascript
import { verifyAuthHeaders, createAuthErrorResponse, addCorsHeaders } from '../../auth.js';

export async function onRequestPost(context) {
  const authResult = await verifyAuthHeaders(context.request.headers, context.env);

  if (!authResult.success) {
    return addCorsHeaders(createAuthErrorResponse(authResult));
  }

  // 处理业务逻辑...
}
```

## 遇到的坑

### 坑 1：环境变量命名

一开始我把密钥命名为 `API_SECRET_KEY`，结果前端一直读取不到。查了半天才发现，Vite 只能访问以 `VITE_` 开头的环境变量。

解决方法：把 `API_SECRET_KEY` 改为 `VITE_API_SECRET_KEY`。

### 坑 2：KV 绑定方式

这是最大的坑。我一开始以为 KV 是通过 `context.env` 访问的，结果一直报 "KV not bound" 错误。

查了腾讯云 EO 的文档才发现，EdgeOne Pages 的 KV 绑定后，是直接作为全局变量使用的，不需要通过 `context.env` 访问。

错误写法：
```javascript
const kv = context.env.DANMAKU_KV;  // ❌ 错误
```

正确写法：
```javascript
const kv = DANMAKU_KV;  // ✅ 正确
```

### 坑 3：公开 API 不需要认证

弹幕列表接口是公开的，不需要认证，但前端代码一开始对所有请求都加了认证头，导致请求失败。

解决方法：对公开 API 不添加认证头。

## 腾讯云 EO 配置步骤

### 1. 创建 KV 命名空间

在腾讯云 EO 控制台的"KV存储"页面创建两个命名空间：
- `danmaku`：存储弹幕数据
- `auth-nonces`：存储已使用的 Nonce

### 2. 绑定 KV 到项目

进入项目详情 → KV 存储，绑定命名空间：
- 变量名：`DANMAKU_KV`，绑定到 `danmaku` 命名空间
- 变量名：`KV_SECRET`，绑定到 `auth-nonces` 命名空间

### 3. 配置环境变量

在项目环境变量中添加：
- `VITE_API_SECRET_KEY`：你的密钥值（至少 32 字节）
- `VITE_API_BASE_URL`：`https://your-domain.com`

### 4. 部署

使用 EdgeOne CLI 或控制台部署：
```bash
edgeone deploy
```

## 安全性分析

这套方案的安全性如何？简单分析一下：

### 防重放攻击

通过时间戳 + Nonce 双重验证：
- 时间戳限制请求的有效期（5分钟）
- Nonce 确保每个请求唯一
- 已使用的 Nonce 存入 KV，5 分钟后自动过期

### 防篡改

HMAC-SHA256 签名确保请求内容未被篡改：
- 密钥只有前后端知道
- 签名无法伪造
- 算法公开，安全性依赖于密钥

### 密钥管理

密钥通过环境变量管理，不暴露在代码中：
- 本地开发使用 `.env` 文件
- 生产环境使用平台配置的环境变量
- `.env` 文件加入 `.gitignore`

## 优化空间

虽然这套方案已经能满足需求，但还有一些可以优化的地方：

### 1. 密钥轮换

定期更换密钥可以提高安全性，但需要考虑前后端同步更新的问题。

### 2. 限流

除了认证，还可以添加限流机制，防止 API 被滥用。

### 3. 日志记录

记录所有认证失败的请求，便于分析攻击行为。

### 4. IP 白名单

对于某些敏感接口，可以添加 IP 白名单限制。

## 总结

这次实现 API 安全验证系统的过程，让我对边缘函数和 KV 存储有了更深入的理解。虽然中间踩了不少坑，但最终实现的效果还是不错的。

这套方案的优点：
- 实现简单，不需要复杂的用户系统
- 性能好，签名验证开销小
- 安全性足够，适合中小型项目
- 利用边缘函数和 KV 存储，无需额外服务器

如果你也在使用腾讯云 EO，希望这篇文章对你有帮助。如果有问题或建议，欢迎交流讨论。
