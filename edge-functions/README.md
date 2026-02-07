# Edge Function API 安全验证系统

## 📋 概述

这是一个基于 HMAC-SHA256 的 API 安全验证系统，用于保护 Edge Function 免受未授权访问。

## 🔐 安全机制

- **时间戳验证**：防止重放攻击（5 分钟容差）
- **Nonce 验证**：防止请求重复（5 分钟 TTL）
- **HMAC-SHA256 签名**：验证请求真实性
- **KV 存储**：存储已使用的 Nonce

## 📁 文件结构

```
edge-functions/
├── auth.js                    # 认证核心逻辑
├── example-api.js             # 示例 API 实现
└── api/
    └── danmaku/
        ├── add.js          # 添加弹幕（需要认证）
        ├── list.js          # 获取弹幕列表（公开）
        └── delete.js        # 删除弹幕（需要认证）
```

## 🚀 快速开始

### 1. 生成密钥

```bash
# 生成 32 字节随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 配置环境变量

在 EdgeOne 控制台配置环境变量：
- 名称：`API_SECRET_KEY`
- 值：你的密钥

### 3. 配置 KV 命名空间

在 EdgeOne 控制台：
1. 创建 KV 命名空间（如 `auth-nonces`）
2. 绑定到边缘函数：
   - 变量名：`KV_SECRET`
   - 命名空间：`auth-nonces`
3. 创建弹幕 KV 命名空间（如 `danmaku`）
4. 绑定到边缘函数：
   - 变量名：`DANMAKU_KV`
   - 命名空间：`danmaku`

### 4. 部署

使用 EdgeOne CLI 部署：

```bash
edgeone deploy
```

## 🔧 前端配置

### 1. 配置环境变量

创建 `.env` 文件（项目根目录）：

```env
API_SECRET_KEY=your-32-byte-secret-key-here
VITE_API_BASE_URL=https://sakurain.net
```

### 2. 使用 API 客户端

```typescript
import { get, post } from '@/lib/api-client';

// GET 请求（公开 API，不需要认证）
const response = await get('/api/danmaku/list', {
  useAuth: false  // 公开 API 不需要认证
});
console.log(response.data);

// POST 请求（需要认证）
const response = await post('/api/danmaku/add', {
  text: 'Hello World',
}, {
  useAuth: true  // 默认为 true
});
console.log(response.data);
```

### 3. 使用 React Hooks

```typescript
import { useHealthCheck, useSecureApi } from '@/hooks/useSecureApi';

function MyComponent() {
  const { data, loading, error, checkHealth } = useHealthCheck();
  const { loading: sending, error: sendError, sendData } = useSecureApi();

  return (
    <div>
      <button onClick={checkHealth} disabled={loading}>
        {loading ? 'Checking...' : 'Check Health'}
      </button>

      <button
        onClick={() => sendData({ message: 'Hello' })}
        disabled={sending}
      >
        {sending ? 'Sending...' : 'Send Data'}
      </button>

      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## 🔐 API 请求头

所有经过安全验证的请求都会包含以下请求头：

```
X-Timestamp: 1704067200000
X-Nonce: 550e8400-e29b-41d4-a716-446655440000
X-Signature: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6
```

## 📊 API 端点

### 弹幕 API

#### 获取弹幕列表（公开）

```
GET /api/danmaku/list
```

**响应示例：**
```json
[
  {
    "id": "d1704067200000",
    "text": "Hello",
    "userId": "user123",
    "timestamp": 1704067200000,
    "color": "#60a5fa",
    "orbitType": "medium",
    "angle": 1.5,
    "inclination": 0.5,
    "altitude": 2500000,
    "speed": 3.5,
    "raan": 2.0,
    "markdown": ""
  }
]
```

#### 添加弹幕（需要认证）

```
POST /api/danmaku/add
Headers:
  X-Timestamp: <timestamp>
  X-Nonce: <uuid>
  X-Signature: <hmac-sha256>

Body:
{
  "text": "弹幕内容",
  "userId": "user123",
  "color": "#60a5fa",
  "orbitType": "medium",
  "markdown": "**Markdown 内容**"
}
```

**响应示例：**
```json
{
  "success": true,
  "danmaku": {
    "id": "d1704067200000",
    "text": "弹幕内容",
    ...
  }
}
```

#### 删除弹幕（需要认证）

```
POST /api/danmaku/delete
Headers:
  X-Timestamp: <timestamp>
  X-Nonce: <uuid>
  X-Signature: <hmac-sha256>

Body:
{
  "id": "d1704060000000"
}
```

**响应示例：**
```json
{
  "success": true
}
```

## 🔒 错误处理

### 前端错误

```typescript
import { ApiError } from '@/lib/api-client';

try {
  const response = await post('/api/danmaku/add', data);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
    console.error('Data:', error.data);
  }
}
```

### 后端错误

后端会返回以下错误：

- `401` - 认证失败
  - `Missing required headers` - 缺少必要的请求头
  - `Invalid timestamp format` - 时间戳格式错误
  - `Timestamp expired` - 时间戳过期
  - `Nonce already used` - Nonce 已被使用
  - `Invalid signature` - 签名验证失败

- `400` - 请求参数错误
  - `Bad JSON` - JSON 格式错误
  - `Missing text` - 缺少必要参数
  - `Invalid text length` - 参数长度错误

- `500` - 服务器内部错误

## 🧪 测试

### 测试获取弹幕列表

```bash
curl https://sakurain.net/api/danmaku/list
```

### 测试添加弹幕

```bash
curl -X POST https://sakurain.net/api/danmaku/add \
  -H "Content-Type: application/json" \
  -H "X-Timestamp: $(date +%s)000" \
  -H "X-Nonce: $(uuidgen)" \
  -H "X-Signature: your-signature" \
  -d '{"text":"Hello World","userId":"test"}'
```

### 测试删除弹幕

```bash
curl -X POST https://sakurain.net/api/danmaku/delete \
  -H "Content-Type: application/json" \
  -H "X-Timestamp: $(date +%s)000" \
  -H "X-Nonce: $(uuidgen)" \
  -H "X-Signature: your-signature" \
  -d '{"id":"d1704060000000"}'
```

## 🔒 安全最佳实践

1. **密钥管理**
   - ✅ 使用环境变量存储密钥
   - ✅ 不要在代码中硬编码密钥
   - ✅ 定期轮换密钥（3-6 个月）
   - ✅ 使用强随机密钥（32 字节）

2. **时间戳设置**
   - ✅ 使用 UTC 时间戳
   - ✅ 设置合理的容差（5 分钟）
   - ✅ 客户端和服务器时间同步

3. **KV 存储**
   - ✅ 设置合理的 TTL（5 分钟）
   - ✅ 监控 KV 读写性能
   - ✅ 定期清理过期数据（自动）

4. **错误处理**
   - ✅ 记录所有认证失败
   - ✅ 不要暴露敏感信息
   - ✅ 提供有用的错误消息

## 🆘 故障排除

### 问题：`API_SECRET_KEY is not configured`

**解决方案**：检查 `.env` 文件是否正确配置了 `API_SECRET_KEY`。

### 问题：`Timestamp expired`

**解决方案**：
1. 检查客户端和服务器时间是否同步
2. 增加 `TIMESTAMP_TOLERANCE` 值
3. 使用 NTP 同步时间

### 问题：`Nonce already used`

**解决方案**：
1. 检查是否重复发送相同请求
2. 检查 KV 存储是否正常工作
3. 增加 `NONCE_TTL` 值

### 问题：`Invalid signature`

**解决方案**：
1. 检查前后端密钥是否一致
2. 检查签名算法是否一致
3. 检查消息格式是否正确

## 📞 支持

如有问题，请查看：
- EdgeOne 文档
- Cloudflare Workers 文档
- 项目 Issues
