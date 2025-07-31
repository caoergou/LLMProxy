# 贡献指南

欢迎为 API Proxy 项目贡献代码！本指南将帮助你了解如何为项目添加新的 AI 服务提供商支持以及如何参与 Tauri 桌面应用开发。

## 🖥️ Tauri 桌面应用开发

### 开发环境设置

1. **安装依赖**
   ```bash
   # 使用自动安装脚本
   ./scripts/install-deps.sh
   
   # 或手动安装
   npm install
   ```

2. **开发模式**
   ```bash
   # 启动开发模式（前端 + 后端 + Tauri）
   npm run tauri:dev
   
   # 仅启动 Node.js 后端
   npm run dev
   ```

3. **构建测试**
   ```bash
   # 构建调试版本
   npm run tauri:build:debug
   
   # 构建生产版本
   npm run tauri:build
   ```

### Tauri 架构说明

本项目采用 Tauri + Node.js 混合架构：

- **前端**: HTML/CSS/JavaScript（位于 `public/` 目录）
- **Tauri 后端**: Rust 代码（位于 `src-tauri/src/` 目录）
- **Node.js 服务**: TypeScript 服务器（位于 `src/` 目录）

### 开发工作流

1. **修改前端**: 编辑 `public/` 目录下的文件
2. **修改 API 逻辑**: 编辑 `src/` 目录下的 TypeScript 文件
3. **修改 Tauri 功能**: 编辑 `src-tauri/src/` 目录下的 Rust 文件
4. **测试**: 使用 `npm run tauri:dev` 测试所有组件

### 常见任务

#### 添加新的 Tauri 命令

1. 在 `src-tauri/src/lib.rs` 中定义命令：
   ```rust
   #[tauri::command]
   async fn my_command(param: String) -> Result<String, String> {
       // 实现逻辑
       Ok(format!("Hello, {}!", param))
   }
   ```

2. 在 `invoke_handler` 中注册：
   ```rust
   .invoke_handler(tauri::generate_handler![my_command])
   ```

3. 在前端调用：
   ```javascript
   if (window.__TAURI__) {
       const result = await window.__TAURI__.tauri.invoke('my_command', { param: 'World' });
   }
   ```

#### 配置新的打包目标

编辑 `src-tauri/tauri.conf.json` 中的 `bundle` 配置：

```json
{
  "bundle": {
    "targets": ["deb", "rpm", "appimage", "msi", "dmg"]
  }
}
```

## 🚀 添加新的 AI 服务提供商

### 1. 创建提供商配置文件

在 `configs/providers/` 目录下创建新的 JSON 配置文件：

```json
{
  "provider": "provider_id",
  "name": "Provider Name",
  "display_name": "显示名称",
  "description": "简短描述",
  "base_url": "https://api.provider.com",
  "auth_type": "bearer|header|api-key",
  "request_format": "openai|custom",
  "response_format": "openai|custom", 
  "cost_per_request": 0.002,
  "endpoints": ["/chat/completions"],
  "models": [
    {
      "name": "model-name",
      "display_name": "模型显示名称",
      "description": "模型描述"
    }
  ],
  "headers": {
    "Authorization": "Bearer {{api_key}}",
    "Content-Type": "application/json"
  },
  "icon": "🤖",
  "website": "https://provider.com",
  "documentation": "https://docs.provider.com",
  "registration_guide": "注册指南",
  "notes": "使用说明"
}
```

### 2. 配置字段说明

| 字段 | 必需 | 说明 |
|------|------|------|
| `provider` | ✓ | 提供商唯一标识符 |
| `name` | ✓ | 提供商名称 |
| `display_name` | ✓ | 前端显示名称 |
| `base_url` | ✓ | API 基础 URL |
| `auth_type` | ✓ | 认证类型 |
| `request_format` | ✓ | 请求格式 |
| `response_format` | ✓ | 响应格式 |
| `models` | ✓ | 支持的模型列表 |
| `headers` | ✓ | 请求头模板 |

### 3. 实现格式适配器（如需要）

如果新提供商的请求/响应格式与 OpenAI 不兼容，需要在 `src/services/ProxyService.js` 中添加格式适配器：

```javascript
// 在适配器映射中添加
this.formatAdapters = {
    your_provider: this.adaptYourProviderFormat.bind(this)
};

// 实现适配方法
adaptYourProviderFormat(data, direction) {
    if (direction === 'request') {
        // 将 OpenAI 格式转换为提供商格式
        return { /* 转换后的请求数据 */ };
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

### 4. 测试配置

1. 启动服务：`npm start`
2. 访问 http://localhost:3000/api/providers 确认新提供商已加载
3. 在管理界面添加新提供商的 API 密钥
4. 测试 API 调用功能

### 5. 提交 Pull Request

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

## 📝 示例：添加 Cohere 支持

### 创建 `configs/providers/cohere.json`

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
  "endpoints": ["/generate", "/chat"],
  "models": [
    {
      "name": "command",
      "display_name": "Command",
      "description": "Cohere's flagship generative model"
    }
  ],
  "headers": {
    "Authorization": "Bearer {{api_key}}",
    "Content-Type": "application/json"
  },
  "icon": "🎯",
  "website": "https://cohere.com",
  "documentation": "https://docs.cohere.com/",
  "registration_guide": "访问 Cohere Console 注册账户并获取 API 密钥",
  "notes": "支持企业级大语言模型服务"
}
```

### 添加格式适配器

```javascript
adaptCohereFormat(data, direction) {
    if (direction === 'request') {
        const lastMessage = data.messages[data.messages.length - 1];
        return {
            model: data.model || 'command',
            prompt: lastMessage.content,
            max_tokens: data.max_tokens || 1000,
            temperature: data.temperature || 0.7
        };
    } else if (direction === 'response') {
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

```bash
# 克隆项目
git clone https://github.com/caoergou/api-proxy.git
cd api-proxy

# 安装依赖
npm install

# 配置环境
cp .env.example .env

# 启动开发服务器
npm start
```

## 📋 代码规范

- 使用 TypeScript/JavaScript ES6+ 语法
- 保持代码注释的一致性
- 遵循现有的代码风格
- 确保配置文件格式正确（JSON 有效性）

## 🐛 报告问题

发现 bug 或有功能建议，请通过 [GitHub Issues](https://github.com/caoergou/api-proxy/issues) 报告。

## 📄 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

---

感谢你的贡献！🎉