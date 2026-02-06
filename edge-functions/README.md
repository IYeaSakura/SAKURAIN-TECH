# EdgeOne Pages Functions - 弹幕功能

此目录包含腾讯云 EdgeOne Pages 的 **Edge Functions**，用于实现地球页面的弹幕功能。

## 为什么选择 Edge Functions？

| 特性 | Cloud Functions | Edge Functions |
|------|-----------------|----------------|
| 运行位置 | 云中心 | 全球边缘节点 |
| 冷启动时间 | 相对较长 | **毫秒级** |
| 延迟性能 | 较低 | **极低** |
| 适用场景 | 复杂数据处理 | **高并发、延迟敏感** |

弹幕功能非常适合 Edge Functions：
- ✅ 全球用户低延迟访问
- ✅ 毫秒级冷启动
- ✅ 简单的 KV 读写操作
- ✅ 高并发场景

## 目录结构

```
edge-functions/
└── api/
    └── danmaku/
        ├── list.js   # 获取弹幕列表 (GET)
        ├── add.js    # 添加弹幕 (POST)
        └── delete.js # 删除弹幕 (POST)
```

## 环境变量配置

在 EdgeOne Pages 控制台中，需要配置以下环境变量：

- `DANMAKU_KV`: KV 命名空间绑定

### 配置步骤

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)
2. 进入你的 Pages 项目
3. 点击「设置」→「环境变量」
4. 添加 KV 命名空间绑定：
   - 变量名称: `DANMAKU_KV`
   - 类型: KV 命名空间
   - 值: 选择或创建一个 KV 命名空间

## API 接口说明

### 获取弹幕列表

```
GET /api/danmaku/list
```

返回: 弹幕数组 JSON

### 添加弹幕

```
POST /api/danmaku/add
Content-Type: application/json

{
  "id": "可选，系统自动生成",
  "text": "弹幕内容",
  "userId": "用户ID",
  "color": "颜色代码",
  "angle": "可选，角度",
  "speed": "可选，速度"
}
```

### 删除弹幕

```
POST /api/danmaku/delete
Content-Type: application/json

{
  "id": "弹幕ID"
}
```

## 本地开发

EdgeOne Functions 目前不支持本地模拟，需要在部署后测试。

## 部署

函数会自动随 Pages 项目一起部署，无需额外操作。

## 参考文档

- [Pages Functions 概览](https://cloud.tencent.com/document/product/1552/127415)
