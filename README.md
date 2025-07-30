# API Proxy

构建本地轻量服务，提供统一接口供客户端调用，集中加密管理多平台 API 密钥，跟踪各 API 价格、剩余额度。按成本 / 额度优先等策略自动选最优 API，支持格式转换适配不同厂商。含本地 Web 界面，可视化管理资源与调用统计。仅本地存储数据，轻量安全，易配置。

## 🚀 特性

- **统一接口**: 提供标准化的 API 接口，支持多种 AI 服务提供商
- **智能路由**: 自动选择最优 API 密钥（基于成本、额度、响应时间）
- **格式转换**: 自动适配不同厂商的请求/响应格式
- **加密存储**: 本地加密存储 API 密钥，确保安全性
- **实时监控**: 跟踪 API 调用统计、成本和性能
- **Web 管理界面**: 直观的可视化管理面板
- **轻量部署**: 单一服务，易于部署和配置

## 🎯 支持的 AI 服务商

- **OpenAI**: GPT-4, GPT-3.5, ChatGPT
- **Anthropic**: Claude 3 系列
- **Azure OpenAI**: Azure 托管的 OpenAI 服务
- 易于扩展支持更多服务商

## 📦 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置加密密钥等配置
```

### 3. 启动服务

```bash
npm start
```

### 4. 访问管理界面

打开浏览器访问: http://localhost:3000

## 🔧 使用说明

### API 接口

#### 1. 统一聊天接口

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

### 生产环境部署

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

## 📄 许可证

MIT License
