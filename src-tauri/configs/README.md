# 提供商配置

这个目录包含了 API Proxy 支持的 AI 服务提供商配置文件。

## 目录结构

```
configs/providers/
├── openai.json      # OpenAI 配置
├── anthropic.json   # Anthropic 配置
├── azure.json       # Azure OpenAI 配置
└── ...              # 其他提供商配置
```

## 配置格式

每个提供商配置文件应遵循以下 JSON 格式：

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

## 添加新提供商

1. 在此目录创建新的 JSON 配置文件
2. 遵循上述格式要求
3. 如需要，在代码中添加格式适配器
4. 重启服务器加载配置

详细说明请查看 [贡献指南](../../CONTRIBUTING.md)。

## 注意事项

- `{{api_key}}` 占位符会被实际 API 密钥替换
- 图标使用 emoji 字符
- 配置更改需要重启服务器生效