# API Proxy

构建本地轻量服务，提供统一接口供客户端调用，集中加密管理多平台 API 密钥，跟踪各 API 价格、剩余额度。按成本 / 额度优先等策略自动选最优 API，支持格式转换适配不同厂商。含本地 Web 界面，可视化管理资源与调用统计。仅本地存储数据，轻量安全，易配置。

## 🚀 特性

- **🎯 统一 OpenAI 规范接口**: 完全兼容 OpenAI API，支持使用官方客户端库
- **🔄 智能提供商选择**: 自动选择最优 API 密钥（基于成本、额度、响应时间）
- **🗺️ 透明模型映射**: 自动将 OpenAI 模型映射到不同提供商的对应模型
- **📊 格式转换**: 自动适配不同厂商的请求/响应格式到 OpenAI 标准
- **🔒 加密存储**: 本地加密存储 API 密钥，确保安全性
- **📈 实时监控**: 跟踪 API 调用统计、成本和性能
- **🖥️ Web 管理界面**: 直观的可视化管理面板
- **⚡ 轻量部署**: 单一服务，易于部署和配置
- **🔄 向后兼容**: 完全支持现有集成，零破坏性更改

## 🎯 支持的 AI 服务商

<div align="center">

### 🚀 当前支持的模型

| 提供商 | 图标 | 模型 | 特性 |
|--------|------|------|------|
| **OpenAI** | 🤖 | GPT-4, GPT-4 Turbo, GPT-3.5 Turbo | 最先进的语言模型，适合复杂任务 |
| **Anthropic** | 🧠 | Claude 3 Opus, Sonnet, Haiku | 安全可靠，擅长推理和分析 |
| **Azure OpenAI** | ☁️ | GPT-4, GPT-4 32K, GPT-3.5 Turbo | 企业级部署，数据安全 |

</div>

### 📈 扩展支持

系统采用配置化设计，支持快速添加新的 AI 服务提供商。查看 [贡献指南](CONTRIBUTING.md) 了解如何添加新的服务商支持。

### 🔄 智能路由

- **自动选择**：根据成本、额度、响应时间智能选择最优 API
- **格式转换**：自动适配不同厂商的请求/响应格式
- **负载均衡**：支持多个 API 密钥的负载分配

## 📦 快速开始

### 🐳 Docker 一键部署（推荐）

使用 Docker 是最简单的部署方式，无需安装 Node.js 和其他依赖：

```bash
# 克隆项目
git clone https://github.com/caoergou/api-proxy.git
cd api-proxy

# 一键启动
./start.sh

# 一键停止
./stop.sh
```

或者使用 docker compose：

```bash
# 启动服务
docker compose up -d --build

# 停止服务
docker compose down

# 查看日志
docker compose logs -f
```

### 🔧 传统部署方式

如果您不使用 Docker，可以按以下步骤手动部署：

#### 1. 安装依赖

```bash
npm install
```

#### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置加密密钥等配置
```

#### 3. 启动服务

```bash
npm start
```

#### 4. 访问管理界面

打开浏览器访问: http://localhost:3000

## 🔧 使用说明

### 🌟 统一 OpenAI 规范接口（推荐）

项目现在提供完全兼容 OpenAI API 的统一接口，支持使用标准 OpenAI 客户端库：

#### 1. 主要聊天完成接口

```bash
POST http://localhost:3000/api/v1/chat/completions
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello, world!"}
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": false
}
```

#### 1.1. 流式响应支持 (SSE)

支持服务器发送事件 (Server-Sent Events) 的流式响应：

```bash
POST http://localhost:3000/api/v1/chat/completions
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello, world!"}
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": true
}
```

流式响应返回 `text/event-stream` 格式，兼容 OpenAI 流式 API 规范：

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: [DONE]
```

**优势：**
- 🎯 **完全 OpenAI 兼容** - 可直接使用官方 OpenAI 客户端库
- 🔄 **智能提供商选择** - 自动选择最优可用提供商
- 🗺️ **模型映射** - 透明地将 OpenAI 模型映射到不同提供商
- ✅ **标准化错误处理** - 统一的错误响应格式
- 🌊 **流式响应支持** - 支持 SSE (Server-Sent Events) 实时流式输出

#### 2. 使用 OpenAI 客户端库

**JavaScript/Node.js (非流式):**
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'dummy-key', // API Proxy 不需要真实密钥
  baseURL: 'http://localhost:3000/api/v1'
});

const completion = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Say hello in Chinese' }],
  model: 'gpt-3.5-turbo',
});
```

**JavaScript/Node.js (流式):**
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'dummy-key',
  baseURL: 'http://localhost:3000/api/v1'
});

const stream = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Tell me a story' }],
  model: 'gpt-3.5-turbo',
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content);
}
```

**Python:**
```python
import openai

openai.api_key = "dummy-key"
openai.api_base = "http://localhost:3000/api/v1"

response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "你好"}]
)
```

#### 3. 可用模型列表

```bash
GET http://localhost:3000/api/v1/models
```

#### 4. 详细提供商信息

```bash
GET http://localhost:3000/api/providers/capabilities
```

**查看完整文档：** [OpenAI 统一规范接口指南](docs/UNIFIED_API.md)

### 🔧 传统接口（向后兼容）

#### 1. 传统聊天接口

```bash
POST http://localhost:3000/api/chat/completions?provider=openai
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello, world!"}
  ]
}
```

支持的 provider: `openai`, `anthropic`, `azure`

#### 2. 直接代理接口

```bash
POST http://localhost:3000/api/proxy/openai/chat/completions
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello, world!"}
  ]
}
```

#### 3. 健康检查

```bash
GET http://localhost:3000/api/health
```

### Web 管理界面功能

1. **仪表板**: 查看调用统计、成本分析、性能指标
2. **API 密钥管理**: 添加、编辑、删除 API 密钥
3. **调用日志**: 查看详细的 API 调用记录
4. **系统设置**: 配置系统参数

## 🔒 安全特性

- **本地存储**: 所有数据仅存储在本地 SQLite 数据库
- **密钥加密**: API 密钥使用 AES 加密存储
- **无外部依赖**: 不依赖外部服务，确保数据隐私
- **访问控制**: 仅本地访问，可配置防火墙规则

## 📊 智能选择策略

系统按以下优先级自动选择最优 API:

1. **可用性**: 排除已停用或额度耗尽的 API
2. **额度优先**: 优先选择剩余额度多的 API
3. **成本优先**: 在额度相同时，选择成本更低的 API
4. **性能考虑**: 考虑历史响应时间

## 🛠️ 配置说明

### 环境变量

- `PORT`: 服务端口 (默认: 3000)
- `ENCRYPTION_KEY`: 数据加密密钥
- `DATABASE_PATH`: 数据库文件路径
- `LOG_LEVEL`: 日志级别

### 🔧 供应商配置

系统采用配置化设计，所有 AI 服务商的配置都存储在 `configs/providers/` 目录下：

```
configs/
└── providers/
    ├── openai.json      # OpenAI 配置
    ├── anthropic.json   # Anthropic 配置
    ├── azure.json       # Azure OpenAI 配置
    └── ...              # 其他供应商配置
```

每个配置文件包含：
- 🔗 API 端点和认证信息
- 💰 成本和额度设置
- 🔄 请求/响应格式适配
- 📋 支持的模型列表
- 🎨 显示图标和描述

### API 密钥配置

在 Web 界面中配置 API 密钥时，需要提供:

- **提供商**: 选择 AI 服务商
- **名称**: 为密钥命名，便于识别
- **API 密钥**: 从服务商获取的密钥
- **基础 URL**: API 服务地址
- **成本设置**: 每次调用的成本
- **额度管理**: 总额度和剩余额度

## 📝 API 响应格式

系统自动将不同服务商的响应格式统一为 OpenAI 标准格式，确保客户端调用的一致性。

### 示例响应

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## 🚀 部署建议

### 🐳 Docker 生产环境部署

Docker 部署是推荐的生产环境部署方式：

#### 基础配置

1. **环境变量配置**:
   ```bash
   # 复制并编辑环境变量文件
   cp .env.example .env
   # 修改 ENCRYPTION_KEY 为强加密密钥
   # 设置其他必要的环境变量
   ```

2. **数据持久化**:
   - 数据库文件自动保存在 `./data` 目录
   - Docker 重启后数据不会丢失
   - 定期备份 `./data` 目录

3. **端口配置**:
   ```yaml
   # 在 docker-compose.yml 中修改端口映射
   ports:
     - "8080:3000"  # 将服务映射到 8080 端口
   ```

4. **SSL/TLS 配置**:
   - 建议使用 Nginx 或 Traefik 作为反向代理
   - 配置 HTTPS 证书

#### 扩展配置

如需自定义 Docker 配置，可以修改 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  api-proxy:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./.env:/app/.env:ro
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

### 🔧 传统生产环境部署

如果不使用 Docker，传统部署方式：

1. **修改加密密钥**: 在 `.env` 中设置强加密密钥
2. **数据备份**: 定期备份 `data/` 目录
3. **防火墙配置**: 限制只允许必要的网络访问
4. **进程管理**: 使用 PM2 或 systemd 管理进程

### PM2 部署示例

```bash
npm install -g pm2
pm2 start src/server.js --name api-proxy
pm2 save
pm2 startup
```

## 🔍 故障排除

### 常见问题

1. **数据库连接失败**: 检查 `data/` 目录权限
2. **API 调用失败**: 验证 API 密钥和网络连接
3. **格式转换错误**: 检查请求格式是否符合标准

### 日志查看

服务日志会输出到控制台，包含详细的错误信息和调用统计。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

### 🆕 添加新的 AI 服务商

想要添加对新 AI 服务商的支持？查看我们的 [贡献指南](CONTRIBUTING.md)，其中包含：

- 📝 配置文件格式说明
- 🔧 格式适配器实现指南
- 🧪 测试流程
- 📋 提交 PR 的要求

### 🐛 报告问题

如果发现 bug 或有功能建议，请通过 [GitHub Issues](https://github.com/caoergou/api-proxy/issues) 提交。

## 📄 许可证

MIT License
