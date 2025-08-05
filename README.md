# API Proxy

Build a lightweight local service that provides a unified interface for client calls, centrally encrypts and manages multi-platform API keys, tracks API prices and remaining quotas. Automatically selects the optimal API based on cost/quota priority strategies, supports format conversion to adapt to different vendors. Includes a local Web interface for visual management of resources and call statistics. Only stores data locally, lightweight, secure, and easy to configure.

🌐 **[Visit our website](https://caoergou.github.io/LLMProxy/)** for more information and download links.

> **English Documentation** | [中文文档](README_cn.md)

## 🚀 Features

- **🎯 Unified OpenAI Standard Interface**: Fully compatible with OpenAI API, supports official client libraries
- **🔄 Intelligent Provider Selection**: Automatically selects optimal API keys (based on cost, quota, response time)
- **🗺️ Transparent Model Mapping**: Automatically maps OpenAI models to corresponding models from different providers
- **📊 Format Conversion**: Automatically adapts different vendor request/response formats to OpenAI standard
- **🔒 Encrypted Storage**: Local encrypted storage of API keys for security
- **📈 Real-time Monitoring**: Tracks API call statistics, costs, and performance
- **🖥️ Web Management Interface**: Intuitive visual management panel
- **⚡ Lightweight Deployment**: Single service, easy to deploy and configure
- **🖥️ Desktop Application**: Cross-platform desktop app based on Tauri with small package size and excellent performance

## 🎯 Supported AI Providers

| Provider | Icon | Main Models |
|----------|------|-------------|
| **OpenAI** | 🤖 | GPT-4, GPT-4 Turbo, GPT-3.5 Turbo |
| **Anthropic** | 🧠 | Claude 3 Opus, Sonnet, Haiku |
| **Azure OpenAI** | ☁️ | GPT-4, GPT-3.5 Turbo (Enterprise) |

## 📦 Quick Start

### 🖥️ Desktop Application (Recommended)

Download the installer for your system:

- **Windows**: [API Proxy v1.0.0.msi](https://github.com/caoergou/api-proxy/releases/latest)
- **macOS**: [API Proxy v1.0.0.dmg](https://github.com/caoergou/api-proxy/releases/latest)
- **Linux**: [API Proxy v1.0.0.deb](https://github.com/caoergou/api-proxy/releases/latest) / [API Proxy v1.0.0.rpm](https://github.com/caoergou/api-proxy/releases/latest)

After installation, launch directly, and the app will automatically manage the backend service.

#### 🛠 Build Desktop App from Source

```bash
# Clone project
git clone https://github.com/caoergou/api-proxy.git
cd api-proxy

# Install dependencies
npm install

# Build desktop app
npm run tauri:build

# Installer location: src-tauri/target/release/bundle/
```

For detailed build guide, see: [Tauri Desktop App Build Guide](docs/TAURI_BUILD_GUIDE.md)

### 🐳 Docker Deployment

```bash
# Clone project
git clone https://github.com/caoergou/api-proxy.git
cd api-proxy

# One-click start
./start.sh

# Access management interface
# http://localhost:3000
```

### 🔧 Traditional Deployment

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env file, set encryption key

# Start service
npm start

# Access management interface
# http://localhost:3000
```

## 🔧 Usage Guide

### Main API Endpoints

```bash
# Chat Completions (OpenAI Compatible)
POST /api/v1/chat/completions

# Model List
GET /api/v1/models

# Health Check
GET /api/health
```

### Usage Examples

#### JavaScript/Node.js
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'dummy-key', // API Proxy doesn't need real keys
  baseURL: 'http://localhost:3000/api/v1'
});

const completion = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Hello, world!' }],
  model: 'gpt-3.5-turbo',
});
```

#### Python
```python
import openai

openai.api_key = "dummy-key"
openai.api_base = "http://localhost:3000/api/v1"

response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello"}]
)
```

#### cURL
```bash
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## 🛠️ Configuration

### Environment Variables

- `PORT`: Service port (default: 3000)
- `ENCRYPTION_KEY`: Data encryption key
- `DATABASE_PATH`: Database file path

### Provider Configuration

All AI service provider configurations are in the `configs/providers/` directory, supporting quick addition of new providers. See [Provider Configuration Documentation](configs/README.md).

### Web Interface Features

1. **Dashboard**: View call statistics and cost analysis
2. **API Key Management**: Add, edit, delete API keys
3. **Call Logs**: View detailed API call records
4. **System Settings**: Configure system parameters

## 🔒 Security Features

- **Local Storage**: All data is stored only in local SQLite database
- **Key Encryption**: API keys are stored encrypted using AES
- **No External Dependencies**: No reliance on external services, ensuring data privacy

## 📚 Documentation

- [OpenAI Unified API Guide](docs/UNIFIED_API.md) - Detailed API usage instructions
- [Contributing Guide](CONTRIBUTING.md) - How to add new AI service providers
- [Adding Providers Guide](docs/ADDING_PROVIDERS.md) - Automated provider request system

## 🚀 Adding New Providers

LLM Proxy now supports an **automated provider request system**! Simply:

1. Create a [New Provider Request Issue](https://github.com/caoergou/LLMProxy/issues/new/choose)
2. Fill out the form with provider details
3. Our automation will validate and create a Pull Request
4. Review and merge - your provider is ready!

For manual setup, see the [Contributing Guide](CONTRIBUTING.md).

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve the project!

## 📄 License

MIT License
