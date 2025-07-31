# Provider Configurations

This directory contains configuration files for AI service providers supported by the API Proxy.

## Directory Structure

```
configs/
└── providers/
    ├── openai.json      # OpenAI configuration
    ├── anthropic.json   # Anthropic configuration
    ├── azure.json       # Azure OpenAI configuration
    └── ...              # Additional provider configurations
```

## Configuration Format

Each provider configuration file should follow this JSON schema:

```json
{
  "provider": "unique_provider_id",
  "name": "Provider Name",
  "display_name": "Display Name in UI",
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
  "documentation": "https://docs.provider.com"
}
```

## Adding New Providers

To add a new provider:

1. Create a new JSON file in this directory with the provider ID as filename
2. Follow the configuration schema above
3. Add format adapters in `src/services/ProxyService.js` if needed (for non-OpenAI compatible APIs)
4. Test the configuration by restarting the server

For detailed instructions, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Notes

- The `{{api_key}}` placeholder in headers will be replaced with the actual API key
- Icons should be emoji characters for consistent display
- All configurations are loaded automatically on server startup
- Changes require a server restart to take effect