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

## 🎯 支持的 AI 服务商

| 提供商 | 图标 | 主要模型 |
|--------|------|----------|
| **OpenAI** | 🤖 | GPT-4, GPT-4 Turbo, GPT-3.5 Turbo |
| **Anthropic** | 🧠 | Claude 3 Opus, Sonnet, Haiku |
| **Azure OpenAI** | ☁️ | GPT-4, GPT-3.5 Turbo (企业级) |

## 📦 快速开始

### 🐳 Docker 部署（推荐）

```bash
# 克隆项目
git clone https://github.com/caoergou/api-proxy.git
cd api-proxy

# 一键启动
./start.sh

# 访问管理界面
# http://localhost:3000
```

### 🔧 传统部署

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置加密密钥

# 启动服务
npm start

# 访问管理界面
# http://localhost:3000
```

## 🔧 使用说明

### 主要 API 端点

```bash
# 聊天完成（OpenAI 兼容）
POST /api/v1/chat/completions

# 模型列表
GET /api/v1/models

# 健康检查
GET /api/health
```

### 使用示例

#### JavaScript/Node.js
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'dummy-key', // API Proxy 不需要真实密钥
  baseURL: 'http://localhost:3000/api/v1'
});

const completion = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Hello, world!' }],
  model: 'gpt-3.5-turbo',
});
```

#### Python
```python
import openai

openai.api_key = "dummy-key"
openai.api_base = "http://localhost:3000/api/v1"

response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "你好"}]
)
```

#### cURL
```bash
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## 🛠️ 配置说明

### 环境变量

- `PORT`: 服务端口 (默认: 3000)
- `ENCRYPTION_KEY`: 数据加密密钥
- `DATABASE_PATH`: 数据库文件路径

### 提供商配置

所有 AI 服务商配置都在 `configs/providers/` 目录下，支持快速添加新提供商。详见 [Provider 配置文档](configs/README.md)。

### Web 界面功能

1. **仪表板**: 查看调用统计、成本分析
2. **API 密钥管理**: 添加、编辑、删除 API 密钥
3. **调用日志**: 查看详细的 API 调用记录
4. **系统设置**: 配置系统参数

## 🔒 安全特性

- **本地存储**: 所有数据仅存储在本地 SQLite 数据库
- **密钥加密**: API 密钥使用 AES 加密存储
- **无外部依赖**: 不依赖外部服务，确保数据隐私

## 📚 文档

- [OpenAI 统一规范接口指南](docs/UNIFIED_API.md) - 详细 API 使用说明
- [贡献指南](CONTRIBUTING.md) - 如何添加新的 AI 服务商

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📄 许可证

MIT License
