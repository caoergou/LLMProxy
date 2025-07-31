# 更新日志

## v2.1.0 - 代码优化和文档精简 (2024-01-XX)

### 🧹 代码清理

- **移除历史接口**: 删除了冗余的传统兼容性端点
  - 移除 `/api/proxy/:provider` 直接代理端点
  - 移除 `/api/chat/completions` 重复端点（保留 `/api/v1/chat/completions`）
  - 移除 `/api/models` 重复端点（保留 `/api/v1/models`）
  - 移除 `/api/provider-configs` 过时端点

### 📚 文档精简

- **README.md 重构**: 精简主文档，减少冗余内容
  - 移除过度详细的部署配置说明
  - 简化 API 使用示例
  - 保留核心功能介绍和快速开始指南
- **UNIFIED_API.md 优化**: 精简统一接口文档
  - 减少重复的示例代码
  - 聚焦于核心 API 使用方法
- **CONTRIBUTING.md 简化**: 精简贡献指南
  - 保留关键的提供商添加步骤
  - 移除过度详细的配置说明

### 🔧 提供商配置优化

- **配置文件精简**: 简化提供商配置中的冗余信息
  - 将详细的注册指南简化为简要说明
  - 合并推广信息和使用说明到统一的 `notes` 字段
  - 保留核心配置功能不变
- **configs/README.md 改进**: 提供更清晰的配置说明

### ✨ 保持向后兼容

- 保留所有核心 OpenAI 兼容端点
- 保持 API 密钥管理和统计功能不变
- 所有现有集成继续正常工作

---

## v2.0.0 - OpenAI 统一规范接口 (2024-01-XX)

### 🚀 重大功能

- **完全 OpenAI 兼容的统一接口**: 实现了完整的 OpenAI API 规范兼容，支持使用官方 OpenAI 客户端库
- **智能模型映射系统**: 自动将 OpenAI 标准模型名映射到不同提供商的对应模型
- **增强格式适配器**: 全面的请求/响应格式转换，确保各提供商之间的透明切换
- **统一错误处理**: 所有错误响应都遵循 OpenAI 标准格式

### 🆕 新增端点

- `POST /api/v1/chat/completions` - 主要 OpenAI 兼容聊天完成端点
- `GET /api/v1/models` - OpenAI 兼容模型列表
- `GET /api/v1/models/:model` - 特定模型信息查询
- `GET /api/v1/models/detailed` - 详细模型能力信息
- `GET /api/providers/capabilities` - 提供商能力报告

### 📊 核心改进

- **模型注册表服务**: 集中管理所有支持的模型及其能力
- **智能提供商选择**: 根据模型可用性、成本和配额自动选择最优提供商
- **参数验证**: 全面的请求参数验证和错误提示

### 🎯 模型映射

| OpenAI 模型 | OpenAI | Anthropic | Azure |
|-------------|--------|-----------|-------|
| gpt-3.5-turbo | gpt-3.5-turbo | claude-3-haiku-20240307 | gpt-35-turbo |
| gpt-4-turbo | gpt-4-turbo-preview | claude-3-sonnet-20240229 | gpt-4 |
| gpt-4 | gpt-4 | claude-3-opus-20240229 | gpt-4 |

---

## v1.x.x - 基础功能

### 已有功能
- 多提供商 API 代理
- 基础格式转换
- API 密钥管理
- Web 管理界面
- 调用统计和监控