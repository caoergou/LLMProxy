# OpenAI 统一规范模型调用指南

本项目已实现统一的 OpenAI 规范模型调用接口，支持多个 AI 服务提供商通过标准化的 OpenAI API 格式进行调用。

## 🎯 核心优势

### 1. 完全 OpenAI 兼容
- 所有端点都遵循 OpenAI API 规范
- 标准化的请求/响应格式
- 一致的错误处理机制

### 2. 智能提供商选择
- 自动根据模型可用性选择最优提供商
- 支持指定优先提供商
- 智能回退机制

### 3. 模型映射和标准化
- 将不同提供商的模型统一为 OpenAI 标准模型名
- 自动处理模型能力映射
- 透明的格式转换

### 4. 零破坏性更改
- 完全向后兼容现有集成
- 渐进式迁移支持

## 📚 API 端点

### 主要 OpenAI 兼容端点

#### 1. 聊天完成 (Chat Completions)
```bash
POST /api/v1/chat/completions
```

**标准 OpenAI 格式请求：**
```bash
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "你好，请介绍一下自己"}
    ],
    "max_tokens": 150,
    "temperature": 0.7
  }'
```

**指定提供商：**
```bash
curl -X POST http://localhost:3000/api/v1/chat/completions?provider=anthropic \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

#### 2. 模型列表 (Models)
```bash
GET /api/v1/models
```

**响应示例：**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-3.5-turbo",
      "object": "model",
      "created": 1753928368,
      "owned_by": "api-proxy"
    },
    {
      "id": "gpt-4",
      "object": "model", 
      "created": 1753928368,
      "owned_by": "api-proxy"
    }
  ]
}
```

#### 3. 特定模型信息
```bash
GET /api/v1/models/gpt-3.5-turbo
```

### 扩展端点

#### 1. 详细模型信息（包含能力）
```bash
GET /api/v1/models/detailed
```

**可选参数：**
- `?provider=openai` - 筛选特定提供商

#### 2. 提供商能力报告
```bash
GET /api/providers/capabilities
```

**响应包含：**
- 每个提供商的详细模型信息
- 模型能力（聊天、完成、嵌入等）
- 成本信息
- 上下文窗口大小

### 向后兼容端点

#### 1. 传统聊天完成端点
```bash
POST /api/chat/completions
POST /api/chat/completions?provider=anthropic
```

#### 2. 传统模型列表
```bash
GET /api/models
```

#### 3. 传统代理端点
```bash
POST /api/proxy/:provider/*
```

## 🔧 模型映射

系统自动将不同提供商的模型映射到 OpenAI 标准模型名：

| OpenAI 模型 | OpenAI 实际 | Anthropic 映射 | Azure 映射 |
|-------------|-------------|----------------|------------|
| gpt-3.5-turbo | gpt-3.5-turbo | claude-3-haiku-20240307 | gpt-35-turbo |
| gpt-4-turbo | gpt-4-turbo-preview | claude-3-sonnet-20240229 | gpt-4 |
| gpt-4 | gpt-4 | claude-3-opus-20240229 | gpt-4 |

## 💡 使用示例

### 1. JavaScript/Node.js 客户端

```javascript
// 使用标准 OpenAI 客户端库
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'dummy-key', // API Proxy 不需要真实密钥
  baseURL: 'http://localhost:3000/api/v1'
});

async function chatWithModel() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say hello in Chinese' }],
    model: 'gpt-3.5-turbo',
  });
  
  console.log(completion.choices[0]);
}
```

### 2. Python 客户端

```python
import openai

# 配置 API Proxy
openai.api_key = "dummy-key"  # API Proxy 不需要真实密钥
openai.api_base = "http://localhost:3000/api/v1"

# 标准 OpenAI 调用
response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "你好，请用中文回答"}
    ]
)

print(response.choices[0].message.content)
```

### 3. cURL 直接调用

```bash
# 基本聊天请求
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "你是一个有用的助手"},
      {"role": "user", "content": "解释什么是人工智能"}
    ],
    "max_tokens": 200,
    "temperature": 0.8
  }'

# 指定 Anthropic 提供商
curl -X POST "http://localhost:3000/api/v1/chat/completions?provider=anthropic" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Write a short poem about AI"}
    ]
  }'
```

## 🎛️ 高级配置

### 1. 提供商优先级

可以通过查询参数指定首选提供商：

```bash
# 优先使用 OpenAI
POST /api/v1/chat/completions?provider=openai

# 优先使用 Anthropic  
POST /api/v1/chat/completions?provider=anthropic

# 优先使用 Azure
POST /api/v1/chat/completions?provider=azure
```

### 2. 自动回退

如果指定的提供商不可用，系统会自动回退到其他可用提供商：

1. 检查指定提供商的可用性
2. 如果不可用，检查其他支持该模型的提供商
3. 根据成本和配额选择最优提供商

### 3. 模型能力验证

系统会自动验证请求的功能是否受支持：

```json
{
  "error": {
    "message": "Model gpt-3.5-turbo does not support function calling",
    "type": "invalid_request_error"
  }
}
```

## 🔍 错误处理

所有错误都遵循 OpenAI 标准格式：

### 1. 参数错误
```json
{
  "error": {
    "message": "Missing required parameter: model",
    "type": "invalid_request_error"
  }
}
```

### 2. 模型不支持
```json
{
  "error": {
    "message": "Model gpt-3.5-turbo does not support chat completions",
    "type": "invalid_request_error",
    "code": "model_not_found"
  }
}
```

### 3. 服务器错误
```json
{
  "error": {
    "message": "No suitable provider or API key available",
    "type": "server_error"
  }
}
```

## 🚀 迁移指南

### 从现有集成迁移

如果你已经在使用本项目，迁移到新的统一接口非常简单：

#### 1. 最小更改迁移

```bash
# 老接口（仍然支持）
POST /api/chat/completions?provider=openai

# 新接口（推荐）  
POST /api/v1/chat/completions?provider=openai
```

#### 2. 完全 OpenAI 兼容迁移

```javascript
// 替换原有的直接 HTTP 调用
// 使用标准 OpenAI 客户端库

// 老方式
const response = await fetch('/api/chat/completions', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({model: 'gpt-3.5-turbo', messages: [...]})
});

// 新方式 - 使用官方 OpenAI 客户端
const openai = new OpenAI({
  apiKey: 'dummy',
  baseURL: 'http://localhost:3000/api/v1'
});
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [...]
});
```

### 外部项目集成

对于使用本项目作为 OpenAI API 代理的外部项目：

1. **无需更改** - 现有的 `/api/chat/completions` 端点继续工作
2. **可选升级** - 迁移到 `/api/v1/*` 端点获得更好的兼容性
3. **渐进式迁移** - 可以逐步迁移不同的功能

## 📊 监控和统计

### 1. 健康检查
```bash
GET /api/health
```

### 2. 调用统计
```bash
GET /api/stats
GET /api/calls/recent
GET /api/usage/endpoints
```

### 3. API 密钥管理
```bash
GET /api/keys
POST /api/keys
PUT /api/keys/:id
DELETE /api/keys/:id
```

## 🔧 开发和测试

### 1. 组件测试
```bash
npm run build
node dist/test-components.js
```

### 2. 手动测试
```bash
# 启动服务
npm start

# 测试端点
curl http://localhost:3000/api/v1/models
curl http://localhost:3000/api/providers/capabilities
```

## 🤝 贡献

本统一接口设计为可扩展的架构：

### 添加新提供商

1. 在 `configs/providers/` 添加配置文件
2. 在 `FormatAdapter.ts` 中实现适配器
3. 在 `ModelRegistry.ts` 中注册模型信息
4. 注册适配器到工厂类

### 扩展功能

- 支持更多 OpenAI 端点（嵌入、微调等）
- 添加流式响应支持
- 实现函数调用功能
- 增强错误处理和重试逻辑

---

通过这个统一的 OpenAI 规范接口，你可以：
- 🔄 无缝切换不同的 AI 服务提供商
- 📊 获得一致的 API 体验
- 💰 优化成本和性能
- 🛠️ 简化集成和维护

所有现有的集成都将继续工作，同时你可以逐步迁移到更强大和标准化的新接口。