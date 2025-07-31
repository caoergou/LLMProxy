# 更新日志

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
- **向后兼容**: 100% 保持现有 API 的兼容性

### 🔧 技术架构

- **抽象格式适配器**: 可扩展的适配器模式，支持轻松添加新提供商
- **工厂模式**: 统一的适配器创建和管理
- **配置驱动**: 提供商配置完全由 JSON 文件驱动

### 📚 文档和示例

- 新增 [OpenAI 统一规范接口指南](docs/UNIFIED_API.md)
- 提供完整的使用示例和迁移指南
- 支持 JavaScript、Python、cURL 等多种调用方式

### 🔄 向前兼容

- 现有的 `/api/chat/completions` 端点继续工作
- 传统的 `/api/proxy/:provider` 端点保持不变
- 无需修改现有集成代码

### 🎯 模型映射

| OpenAI 模型 | OpenAI | Anthropic | Azure |
|-------------|--------|-----------|-------|
| gpt-3.5-turbo | gpt-3.5-turbo | claude-3-haiku-20240307 | gpt-35-turbo |
| gpt-4-turbo | gpt-4-turbo-preview | claude-3-sonnet-20240229 | gpt-4 |
| gpt-4 | gpt-4 | claude-3-opus-20240229 | gpt-4 |

### 📈 性能优化

- 优化了提供商选择算法
- 改进了错误处理性能
- 增强了请求/响应缓存机制

---

## v1.x.x - 基础功能

### 已有功能
- 多提供商 API 代理
- 基础格式转换
- API 密钥管理
- Web 管理界面
- 调用统计和监控