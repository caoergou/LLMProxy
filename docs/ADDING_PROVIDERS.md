# Adding New AI Providers - Automated Process

This guide explains how to use the automated provider request system to add support for new AI service providers.

## 🚀 Quick Start

1. **Create a Provider Request Issue**
   - Go to [Issues](https://github.com/caoergou/LLMProxy/issues) → New Issue
   - Choose "🚀 New AI Provider Request" or "🚀 新增AI服务商请求" (Chinese)
   - Fill out the form with provider details

2. **Automatic Processing**
   - The system will automatically validate your request
   - A new feature branch and pull request will be created
   - You'll receive feedback on the issue

3. **Review and Merge**
   - Maintainers will review the generated configuration
   - Once approved, the provider will be available in LLM Proxy

## 📋 Required Information

When submitting a provider request, you'll need:

### Basic Information
- **Provider Name**: Official name (e.g., "Mistral AI")
- **Provider ID**: Unique identifier (e.g., "mistral")
- **API Base URL**: The base endpoint URL
- **Website**: Official provider website
- **Documentation**: Link to API documentation

### Technical Details
- **Authentication Type**: How the API authenticates requests
- **Request/Response Format**: Whether it's OpenAI-compatible or custom
- **Available Models**: List of models offered by the provider
- **Supported Endpoints**: API endpoints to integrate

### Optional Information
- **Cost per Request**: For pricing comparison
- **Developer Console**: Link to provider dashboard
- **Registration Guide**: How to sign up and get API keys
- **Special Features**: Unique capabilities (function calling, vision, etc.)

## 🔧 What Happens Automatically

When you submit a provider request:

1. **Configuration Generation**: A JSON configuration file is created
2. **Validation**: The configuration is checked for errors
3. **Documentation Update**: README files are updated with the new provider
4. **Pull Request**: A PR is created with all changes
5. **Feedback**: You'll receive comments on the issue with status updates

## 🎯 Validation Rules

The system validates:
- ✅ Required fields are present
- ✅ URLs are valid and accessible
- ✅ Provider ID follows naming conventions
- ✅ Authentication details are properly formatted
- ✅ No duplicate providers

## 🐛 Troubleshooting

If the automation fails:
1. Check that all required fields are filled
2. Verify URLs are valid and accessible
3. Ensure provider ID is unique and follows conventions (lowercase, hyphens only)
4. A maintainer will review and provide guidance

## 🤝 Manual Process (Fallback)

If you prefer the manual process, see:
- [Contributing Guide (English)](CONTRIBUTING.md)
- [贡献指南 (中文)](CONTRIBUTING_cn.md)

## 📚 Configuration Schema

The generated configuration follows this schema:

```json
{
  "provider": "unique-id",
  "name": "Provider Name",
  "display_name": "Display Name",
  "description": "Brief description",
  "base_url": "https://api.provider.com",
  "auth_type": "bearer|header|api-key",
  "request_format": "openai|custom",
  "response_format": "openai|custom",
  "cost_per_request": 0.002,
  "endpoints": ["/chat/completions"],
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
  "documentation": "https://docs.provider.com",
  "registration_guide": "How to register and get API keys"
}
```

## 🔒 Security & Privacy

- All provider configurations are stored locally
- API keys are encrypted when stored
- No external dependencies for core functionality
- Open source and auditable

---

For questions or issues with the automation, please create an issue or contact the maintainers.