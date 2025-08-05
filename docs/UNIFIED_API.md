# OpenAI Unified API Guide

> **English Documentation** | [中文文档](UNIFIED_API_cn.md)

This project implements a unified interface fully compatible with the OpenAI API specification, supporting multiple AI service providers through standardized OpenAI API format calls.

## 🎯 Core Advantages

- **Full OpenAI Compatibility** - All endpoints follow OpenAI API specifications
- **Intelligent Provider Selection** - Automatically selects optimal providers based on model availability
- **Model Mapping and Standardization** - Unifies different provider models to OpenAI standard model names
- **Zero Breaking Changes** - Fully backward compatible with existing integrations

## 📚 API Endpoints

### Main Endpoints

#### Chat Completions
```bash
POST /api/v1/chat/completions
```

**Basic Request Example:**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello, please introduce yourself"}
  ],
  "max_tokens": 150,
  "temperature": 0.7
}
```

**Streaming Response:**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}
```

**Specify Provider:**
```bash
POST /api/v1/chat/completions?provider=anthropic
```

#### Model List
```bash
GET /api/v1/models
```

**Response Example:**
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

#### Specific Model Information
```bash
GET /api/v1/models/gpt-3.5-turbo
```

#### Detailed Model Information (Including Capabilities)
```bash
GET /api/v1/models/detailed
GET /api/providers/capabilities
```

## 🔧 Model Mapping

The system automatically maps different provider models to OpenAI standard model names:

| OpenAI Model | OpenAI Actual | Anthropic Mapping | Azure Mapping |
|-------------|-------------|----------------|------------|
| gpt-3.5-turbo | gpt-3.5-turbo | claude-3-haiku-20240307 | gpt-35-turbo |
| gpt-4-turbo | gpt-4-turbo-preview | claude-3-sonnet-20240229 | gpt-4 |
| gpt-4 | gpt-4 | claude-3-opus-20240229 | gpt-4 |

## 💡 Usage Examples

### JavaScript/Node.js Client

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'dummy-key', // API Proxy doesn't need real keys
  baseURL: 'http://localhost:3000/api/v1'
});

// Non-streaming
const completion = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Say hello in Chinese' }],
  model: 'gpt-3.5-turbo',
});

// Streaming
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

### Python Client

```python
import openai

openai.api_key = "dummy-key"
openai.api_base = "http://localhost:3000/api/v1"

response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello, please respond in English"}]
)
```

### cURL Examples

```bash
# Basic chat request
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant"},
      {"role": "user", "content": "Explain what artificial intelligence is"}
    ],
    "max_tokens": 200,
    "temperature": 0.8
  }'

# Specify Anthropic provider
curl -X POST "http://localhost:3000/api/v1/chat/completions?provider=anthropic" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Write a short poem about AI"}]
  }'
```

## 🎛️ Advanced Configuration

### Provider Priority

You can specify preferred providers through query parameters:

```bash
# Prefer OpenAI
POST /api/v1/chat/completions?provider=openai

# Prefer Anthropic  
POST /api/v1/chat/completions?provider=anthropic

# Prefer Azure
POST /api/v1/chat/completions?provider=azure
```

### Automatic Fallback

If the specified provider is unavailable, the system will automatically fall back to other available providers:

1. Check availability of specified provider
2. If unavailable, check other providers supporting the model
3. Select optimal provider based on cost and quota

## 🔍 Error Handling

All errors follow OpenAI standard format:

### Parameter Errors
```json
{
  "error": {
    "message": "Missing required parameter: model",
    "type": "invalid_request_error"
  }
}
```

### Model Not Supported
```json
{
  "error": {
    "message": "Model gpt-3.5-turbo does not support chat completions",
    "type": "invalid_request_error",
    "code": "model_not_found"
  }
}
```

### Server Errors
```json
{
  "error": {
    "message": "No suitable provider or API key available",
    "type": "server_error"
  }
}
```

## 🔧 Development and Testing

### Component Testing
```bash
npm run build
node examples/unified-api-example.js
```

### Manual Testing
```bash
# Start service
npm start

# Test endpoints
curl http://localhost:3000/api/v1/models
curl http://localhost:3000/api/providers/capabilities
```

---

With this unified OpenAI standard interface, you can:
- 🔄 Seamlessly switch between different AI service providers
- 📊 Get consistent API experience
- 💰 Optimize cost and performance
- 🛠️ Simplify integration and maintenance