# Provider Configuration

> **English Documentation** | [中文文档](README_cn.md)

This directory contains the AI service provider configuration files supported by API Proxy.

## Directory Structure

```text
configs/providers/
├── openai.json      # OpenAI configuration
├── anthropic.json   # Anthropic configuration
├── azure.json       # Azure OpenAI configuration
└── ...              # Other provider configurations
```

## Configuration Format

Each provider configuration file should follow this JSON format:

```json
{
  "provider": "provider_id",
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
  "registration_guide": "Registration guide",
  "notes": "Usage instructions"
}
```

## Adding New Providers

1. Create a new JSON configuration file in this directory
2. Follow the above format requirements
3. Add format adapters in code if needed
4. Restart server to load configuration

For detailed instructions, see [Contributing Guide](../../CONTRIBUTING.md).

## Notes

- `{{api_key}}` placeholder will be replaced with actual API key
- Icons use emoji characters
- Configuration changes require server restart to take effect
