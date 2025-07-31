# 贡献指南 Contributing Guide

欢迎为 API Proxy 项目贡献代码！本指南将帮助你了解如何为项目添加新的 AI 服务提供商支持。

## 🚀 如何添加新的 AI 服务提供商

### 1. 创建提供商配置文件

在 `configs/providers/` 目录下创建一个新的 JSON 配置文件，文件名格式为 `{provider_id}.json`。

#### 配置文件模板

```json
{
  "provider": "provider_id",
  "name": "Provider Display Name",
  "display_name": "Frontend Display Name",
  "description": "Brief description of the provider",
  "base_url": "https://api.provider.com",
  "auth_type": "bearer|header|api-key",
  "request_format": "openai|custom_format",
  "response_format": "openai|custom_format", 
  "cost_per_request": 0.002,
  "endpoints": [
    "/chat/completions",
    "/completions"
  ],
  "models": [
    {
      "name": "model-name",
      "display_name": "Model Display Name",
      "description": "Model description"
    }
  ],
  "headers": {
    "Authorization": "Bearer {{api_key}}",
    "Content-Type": "application/json"
  },
  "icon": "🤖",
  "website": "https://provider.com",
  "documentation": "https://docs.provider.com"
}
```

#### 配置字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `provider` | string | ✓ | 提供商唯一标识符 |
| `name` | string | ✓ | 提供商名称 |
| `display_name` | string | ✓ | 前端显示名称 |
| `description` | string | - | 提供商描述 |
| `base_url` | string | ✓ | API 基础 URL |
| `auth_type` | string | ✓ | 认证类型：`bearer`、`header`、`api-key` |
| `request_format` | string | ✓ | 请求格式：`openai` 或自定义格式 |
| `response_format` | string | ✓ | 响应格式：`openai` 或自定义格式 |
| `cost_per_request` | number | - | 每次请求成本（默认 0） |
| `endpoints` | array | - | 支持的 API 端点列表 |
| `models` | array | - | 支持的模型列表 |
| `headers` | object | - | 请求头模板（`{{api_key}}` 将被替换） |
| `icon` | string | - | 显示图标（emoji） |
| `website` | string | - | 官方网站 |
| `documentation` | string | - | API 文档链接 |

### 2. 实现格式适配器（如果需要）

如果新提供商的请求/响应格式与 OpenAI 不兼容，需要在 `src/services/ProxyService.js` 中添加格式适配器：

```javascript
// 在 constructor 中添加
this.formatAdapters = {
    // ... 现有适配器
    your_provider: this.adaptYourProviderFormat.bind(this)
};

// 添加适配方法
adaptYourProviderFormat(data, direction) {
    if (direction === 'request') {
        // 将 OpenAI 格式转换为提供商格式
        return {
            // 转换后的请求数据
        };
    } else if (direction === 'response') {
        // 将提供商响应转换为 OpenAI 格式
        return {
            id: data.id,
            object: 'chat.completion',
            model: data.model,
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: data.content
                },
                finish_reason: data.finish_reason
            }],
            usage: data.usage
        };
    }
    return data;
}
```

### 3. 测试配置

1. 启动服务：`npm start`
2. 访问 http://localhost:3000/api/provider-configs 确认新提供商已加载
3. 在管理界面添加新提供商的 API 密钥
4. 测试 API 调用功能

### 4. 提交 Pull Request

1. Fork 项目到你的 GitHub 账户
2. 创建功能分支：`git checkout -b feature/add-provider-xxx`
3. 提交你的更改：`git commit -am 'Add support for XXX provider'`
4. 推送到分支：`git push origin feature/add-provider-xxx`
5. 创建 Pull Request

#### PR 要求

- [ ] 添加了完整的提供商配置文件
- [ ] 如有必要，添加了格式适配器
- [ ] 测试了基本功能
- [ ] 更新了 README.md 中的支持提供商列表
- [ ] 添加了提供商图标

## 📝 示例：添加 Cohere 支持

以下是添加 Cohere 支持的完整示例：

### 1. 创建 `configs/providers/cohere.json`

```json
{
  "provider": "cohere",
  "name": "Cohere",
  "display_name": "Cohere",
  "description": "Cohere's large language models for enterprise",
  "base_url": "https://api.cohere.ai/v1",
  "auth_type": "bearer",
  "request_format": "cohere",
  "response_format": "cohere",
  "cost_per_request": 0.0015,
  "endpoints": [
    "/generate",
    "/chat"
  ],
  "models": [
    {
      "name": "command",
      "display_name": "Command",
      "description": "Cohere's flagship generative model"
    },
    {
      "name": "command-light",
      "display_name": "Command Light", 
      "description": "Faster, lighter version of Command"
    }
  ],
  "headers": {
    "Authorization": "Bearer {{api_key}}",
    "Content-Type": "application/json"
  },
  "icon": "🎯",
  "website": "https://cohere.com",
  "documentation": "https://docs.cohere.com/"
}
```

### 2. 添加格式适配器

```javascript
adaptCohereFormat(data, direction) {
    if (direction === 'request') {
        // 转换 OpenAI chat completions 格式到 Cohere generate 格式
        const lastMessage = data.messages[data.messages.length - 1];
        return {
            model: data.model || 'command',
            prompt: lastMessage.content,
            max_tokens: data.max_tokens || 1000,
            temperature: data.temperature || 0.7
        };
    } else if (direction === 'response') {
        // 转换 Cohere 响应为 OpenAI 格式
        return {
            id: `cohere-${Date.now()}`,
            object: 'chat.completion',
            model: data.meta?.api_version?.version || 'command',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: data.generations[0].text
                },
                finish_reason: 'stop'
            }],
            usage: {
                prompt_tokens: data.meta?.billed_units?.input_tokens || 0,
                completion_tokens: data.meta?.billed_units?.output_tokens || 0,
                total_tokens: (data.meta?.billed_units?.input_tokens || 0) + (data.meta?.billed_units?.output_tokens || 0)
            }
        };
    }
    return data;
}
```

## 🛠️ 开发环境设置

1. 克隆项目：`git clone https://github.com/caoergou/api-proxy.git`
2. 安装依赖：`npm install`
3. 复制环境配置：`cp .env.example .env`
4. 启动开发服务器：`npm start`

## 📋 代码规范

- 使用 JavaScript ES6+ 语法
- 保持代码注释的一致性
- 遵循现有的代码风格
- 确保配置文件格式正确（JSON 有效性）

## 🐛 报告问题

如果你发现了 bug 或有功能建议，请通过 [GitHub Issues](https://github.com/caoergou/api-proxy/issues) 报告。

## 📄 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

---

感谢你的贡献！🎉