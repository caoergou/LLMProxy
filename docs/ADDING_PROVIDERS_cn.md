# 添加新AI服务商 - 自动化流程

本指南介绍如何使用自动化服务商请求系统为LLM Proxy添加新的AI服务提供商支持。

## 🚀 快速开始

1. **创建服务商请求Issue**
   - 前往 [Issues](https://github.com/caoergou/LLMProxy/issues) → New Issue
   - 选择 "🚀 新增AI服务商请求" 或 "🚀 New AI Provider Request" (English)
   - 填写表单并提供服务商详情

2. **自动处理**
   - 系统将自动验证您的请求
   - 创建新的功能分支和拉取请求
   - 您将在issue中收到反馈

3. **审核和合并**
   - 维护者将审核生成的配置
   - 一旦批准，该服务商将在LLM Proxy中可用

## 📋 所需信息

提交服务商请求时，您需要提供：

### 基本信息
- **服务商名称**: 官方名称（例如："智谱AI"）
- **服务商ID**: 唯一标识符（例如："zhipu"）
- **API基础URL**: 基础端点URL
- **官方网站**: 服务商官方网站
- **API文档**: API文档链接

### 技术细节
- **认证方式**: API如何进行请求认证
- **请求/响应格式**: 是否兼容OpenAI格式或自定义格式
- **可用模型**: 服务商提供的模型列表
- **支持的端点**: 要集成的API端点

### 可选信息
- **每次请求成本**: 用于价格比较
- **开发者控制台**: 服务商仪表板链接
- **注册指南**: 如何注册并获取API密钥
- **特殊功能**: 独特能力（函数调用、视觉等）

## 🔧 自动化处理内容

当您提交服务商请求时：

1. **配置生成**: 创建JSON配置文件
2. **验证**: 检查配置是否有错误
3. **文档更新**: 更新README文件添加新服务商
4. **拉取请求**: 创建包含所有更改的PR
5. **反馈**: 您将在issue中收到状态更新评论

## 🎯 验证规则

系统会验证：
- ✅ 必需字段已填写
- ✅ URL有效且可访问
- ✅ 服务商ID遵循命名约定
- ✅ 认证详情格式正确
- ✅ 没有重复的服务商

## 🐛 故障排除

如果自动化失败：
1. 检查所有必需字段是否已填写
2. 验证URL是否有效且可访问
3. 确保服务商ID唯一且遵循约定（小写，仅使用连字符）
4. 维护者将审核并提供指导

## 🤝 手动流程（备选方案）

如果您更喜欢手动流程，请参阅：
- [Contributing Guide (English)](CONTRIBUTING.md)
- [贡献指南 (中文)](CONTRIBUTING_cn.md)

## 📚 配置架构

生成的配置遵循此架构：

```json
{
  "provider": "unique-id",
  "name": "Provider Name",
  "display_name": "显示名称",
  "description": "简要描述",
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
  "registration_guide": "如何注册并获取API密钥"
}
```

## 🔒 安全与隐私

- 所有服务商配置都存储在本地
- API密钥加密存储
- 核心功能无外部依赖
- 开源且可审核

---

如有关于自动化的问题或问题，请创建issue或联系维护者。