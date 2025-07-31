# OpenAI 统一规范接口指南

本项目实现了完全兼容 OpenAI API 规范的统一接口，支持多个 AI 服务提供商通过标准化的 OpenAI API 格式进行调用。

## 🎯 核心优势

- **完全 OpenAI 兼容** - 所有端点都遵循 OpenAI API 规范
- **智能提供商选择** - 自动根据模型可用性选择最优提供商
- **模型映射和标准化** - 将不同提供商的模型统一为 OpenAI 标准模型名
- **零破坏性更改** - 完全向后兼容现有集成

## 📚 API 端点

### 主要端点

#### 聊天完成 (Chat Completions)
```bash
POST /api/v1/chat/completions
```

**基础请求示例：**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "你好，请介绍一下自己"}
  ],
  "max_tokens": 150,
  "temperature": 0.7
}
```

**流式响应：**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}
```

**指定提供商：**
```bash
POST /api/v1/chat/completions?provider=anthropic
```

#### 模型列表
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
    }
  ]
}
```

#### 特定模型信息
```bash
GET /api/v1/models/gpt-3.5-turbo
```

#### 详细模型信息（包含能力）
```bash
GET /api/v1/models/detailed
GET /api/providers/capabilities
```

## 🔧 模型映射

系统自动将不同提供商的模型映射到 OpenAI 标准模型名：

| OpenAI 模型 | OpenAI 实际 | Anthropic 映射 | Azure 映射 |
|-------------|-------------|----------------|------------|
| gpt-3.5-turbo | gpt-3.5-turbo | claude-3-haiku-20240307 | gpt-35-turbo |
| gpt-4-turbo | gpt-4-turbo-preview | claude-3-sonnet-20240229 | gpt-4 |
| gpt-4 | gpt-4 | claude-3-opus-20240229 | gpt-4 |

## 💡 使用示例

### JavaScript/Node.js 客户端

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'dummy-key', // API Proxy 不需要真实密钥
  baseURL: 'http://localhost:3000/api/v1'
});

// 非流式
const completion = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Say hello in Chinese' }],
  model: 'gpt-3.5-turbo',
});

// 流式
const stream = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Tell me a story' }],
  model: 'gpt-3.5-turbo',
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content || '');
}
```

### Python 客户端

```python
import openai

openai.api_key = "dummy-key"
openai.api_base = "http://localhost:3000/api/v1"

response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "你好，请用中文回答"}]
)
```

### cURL 示例

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
    "messages": [{"role": "user", "content": "Write a short poem about AI"}]
  }'
```

## 🎛️ 高级配置

### 提供商优先级

可以通过查询参数指定首选提供商：

```bash
# 优先使用 OpenAI
POST /api/v1/chat/completions?provider=openai

# 优先使用 Anthropic  
POST /api/v1/chat/completions?provider=anthropic

# 优先使用 Azure
POST /api/v1/chat/completions?provider=azure
```

### 自动回退

如果指定的提供商不可用，系统会自动回退到其他可用提供商：

1. 检查指定提供商的可用性
2. 如果不可用，检查其他支持该模型的提供商
3. 根据成本和配额选择最优提供商

## 🔍 错误处理

所有错误都遵循 OpenAI 标准格式：

### 参数错误
```json
{
  "error": {
    "message": "Missing required parameter: model",
    "type": "invalid_request_error"
  }
}
```

### 模型不支持
```json
{
  "error": {
    "message": "Model gpt-3.5-turbo does not support chat completions",
    "type": "invalid_request_error",
    "code": "model_not_found"
  }
}
```

### 服务器错误
```json
{
  "error": {
    "message": "No suitable provider or API key available",
    "type": "server_error"
  }
}
```

## 🔧 开发和测试

### 组件测试
```bash
npm run build
node examples/unified-api-example.js
```

### 手动测试
```bash
# 启动服务
npm start

# 测试端点
curl http://localhost:3000/api/v1/models
curl http://localhost:3000/api/providers/capabilities
```

---

通过这个统一的 OpenAI 规范接口，你可以：
- 🔄 无缝切换不同的 AI 服务提供商
- 📊 获得一致的 API 体验
- 💰 优化成本和性能
- 🛠️ 简化集成和维护