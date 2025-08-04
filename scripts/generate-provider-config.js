#!/usr/bin/env node

/**
 * Provider Configuration Generator
 * Generates provider configuration files from GitHub issue data
 */

const fs = require('fs');
const path = require('path');

/**
 * Parses GitHub issue body to extract form data
 * @param {string} issueBody - The issue body text
 * @returns {Object} - Parsed form data
 */
function parseIssueBody(issueBody) {
  const data = {};
  
  // Parse form fields using regex patterns
  const patterns = {
    provider_name: /### Provider Name\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    provider_id: /### Provider ID\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    base_url: /### API Base URL\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    auth_type: /### Authentication Type\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    auth_details: /### Authentication Details\s*\n+([\s\S]*?)(?=\n###|$)/i,
    request_format: /### Request Format\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    response_format: /### Response Format\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    models: /### Available Models\s*\n+([\s\S]*?)(?=\n###|$)/i,
    endpoints: /### Supported Endpoints\s*\n+([\s\S]*?)(?=\n###|$)/i,
    cost_per_request: /### Cost Per Request \(USD\)\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    website: /### Provider Website\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    documentation: /### API Documentation URL\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    console_url: /### Developer Console URL\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    registration_guide: /### Registration Guide\s*\n+([\s\S]*?)(?=\n###|$)/i,
    special_features: /### Special Features & Capabilities\s*\n+([\s\S]*?)(?=\n###|$)/i,
    additional_headers: /### Additional Headers\s*\n+([\s\S]*?)(?=\n###|$)/i,
    notes: /### Additional Notes\s*\n+([\s\S]*?)(?=\n###|$)/i
  };
  
  // Chinese patterns
  const chinesePatterns = {
    provider_name: /### 服务商名称\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    provider_id: /### 服务商ID\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    base_url: /### API基础URL\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    auth_type: /### 认证方式\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    auth_details: /### 认证详情\s*\n+([\s\S]*?)(?=\n###|$)/i,
    request_format: /### 请求格式\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    response_format: /### 响应格式\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    models: /### 可用模型\s*\n+([\s\S]*?)(?=\n###|$)/i,
    endpoints: /### 支持的端点\s*\n+([\s\S]*?)(?=\n###|$)/i,
    cost_per_request: /### 每次请求成本（美元）\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    website: /### 服务商官网\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    documentation: /### API文档URL\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    console_url: /### 开发者控制台URL\s*\n+\s*(.+?)(?=\s*\n|$)/i,
    registration_guide: /### 注册指南\s*\n+([\s\S]*?)(?=\n###|$)/i,
    special_features: /### 特殊功能和能力\s*\n+([\s\S]*?)(?=\n###|$)/i,
    additional_headers: /### 额外请求头\s*\n+([\s\S]*?)(?=\n###|$)/i,
    notes: /### 附加说明\s*\n+([\s\S]*?)(?=\n###|$)/i
  };
  
  // Try English patterns first, then Chinese
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = issueBody.match(pattern);
    if (match && match[1] && match[1].trim() !== '_No response_' && match[1].trim() !== '') {
      data[key] = match[1].trim();
    }
  }
  
  // Try Chinese patterns if not found in English
  for (const [key, pattern] of Object.entries(chinesePatterns)) {
    if (!data[key]) {
      const match = issueBody.match(pattern);
      if (match && match[1] && match[1].trim() !== '_No response_' && match[1].trim() !== '') {
        data[key] = match[1].trim();
      }
    }
  }
  
  return data;
}

/**
 * Processes auth type to standard format
 * @param {string} authType - Raw auth type from form
 * @returns {string} - Standardized auth type
 */
function processAuthType(authType) {
  if (!authType) return 'bearer';
  
  const lower = authType.toLowerCase();
  if (lower.includes('bearer')) return 'bearer';
  if (lower.includes('header')) return 'header';
  if (lower.includes('api-key') || lower.includes('api key')) return 'api-key';
  if (lower.includes('oauth')) return 'oauth';
  
  return 'bearer'; // default
}

/**
 * Processes format type to standard format
 * @param {string} formatType - Raw format type from form
 * @returns {string} - Standardized format type
 */
function processFormat(formatType) {
  if (!formatType) return 'openai';
  
  const lower = formatType.toLowerCase();
  if (lower.includes('openai')) return 'openai';
  if (lower.includes('custom')) return 'custom';
  
  return 'openai'; // default
}

/**
 * Processes models list from text
 * @param {string} modelsText - Raw models text from form
 * @returns {Array} - Array of model objects
 */
function processModels(modelsText) {
  if (!modelsText) return [];
  
  return modelsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(modelName => ({
      name: modelName,
      display_name: modelName,
      description: `${modelName} model`
    }));
}

/**
 * Processes endpoints list from text
 * @param {string} endpointsText - Raw endpoints text from form
 * @returns {Array} - Array of endpoints
 */
function processEndpoints(endpointsText) {
  if (!endpointsText) return ['/chat/completions'];
  
  return endpointsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(endpoint => endpoint.startsWith('/') ? endpoint : `/${endpoint}`);
}

/**
 * Processes additional headers from text
 * @param {string} headersText - Raw headers text from form
 * @param {string} authType - Authentication type
 * @param {string} authDetails - Authentication details
 * @returns {Object} - Headers object
 */
function processHeaders(headersText, authType, authDetails) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add authentication header based on type
  if (authType === 'bearer') {
    headers.Authorization = 'Bearer {{api_key}}';
  } else if (authType === 'header' && authDetails) {
    // Try to parse auth details for custom headers
    const authMatch = authDetails.match(/([^:]+):\s*(.+)/);
    if (authMatch) {
      const headerName = authMatch[1].trim();
      const headerValue = authMatch[2].trim().replace(/<api_key>|<token>/g, '{{api_key}}');
      headers[headerName] = headerValue;
    } else {
      headers['X-API-Key'] = '{{api_key}}';
    }
  } else if (authType === 'api-key') {
    headers['X-API-Key'] = '{{api_key}}';
  }
  
  // Parse additional headers if provided
  if (headersText) {
    try {
      const additionalHeaders = JSON.parse(headersText);
      Object.assign(headers, additionalHeaders);
    } catch (error) {
      console.warn('Failed to parse additional headers, using defaults');
    }
  }
  
  return headers;
}

/**
 * Generates provider configuration from issue data
 * @param {string} issueTitle - Issue title
 * @param {string} issueBody - Issue body
 * @returns {Object} - Provider configuration
 */
function generateProviderConfig(issueTitle, issueBody) {
  const data = parseIssueBody(issueBody);
  
  const config = {
    provider: data.provider_id || 'unknown-provider',
    name: data.provider_name || 'Unknown Provider',
    display_name: data.provider_name || 'Unknown Provider',
    description: data.notes || `${data.provider_name || 'Unknown Provider'} AI models`,
    base_url: data.base_url || 'https://api.example.com',
    auth_type: processAuthType(data.auth_type),
    request_format: processFormat(data.request_format),
    response_format: processFormat(data.response_format),
    cost_per_request: data.cost_per_request ? parseFloat(data.cost_per_request) : 0.002,
    endpoints: processEndpoints(data.endpoints),
    models: processModels(data.models),
    headers: processHeaders(data.additional_headers, processAuthType(data.auth_type), data.auth_details),
    icon: '🤖',
    website: data.website || 'https://example.com',
    documentation: data.documentation || 'https://docs.example.com',
    registration_guide: data.registration_guide || 'Please visit the provider website for registration instructions.'
  };
  
  // Add optional fields if present
  if (data.console_url) {
    config.console_url = data.console_url;
  }
  
  if (data.notes) {
    config.notes = data.notes;
  }
  
  return config;
}

/**
 * Saves provider configuration to file
 * @param {Object} config - Provider configuration
 * @param {string} outputDir - Output directory
 * @returns {string} - Path to saved file
 */
function saveProviderConfig(config, outputDir) {
  const filename = `${config.provider}.json`;
  const filepath = path.join(outputDir, filename);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, JSON.stringify(config, null, 2));
  return filepath;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node generate-provider-config.js <issue-title> <issue-body> [output-dir]');
    process.exit(1);
  }
  
  const issueTitle = args[0];
  const issueBody = args[1];
  const outputDir = args[2] || './configs/providers';
  
  console.log('🔧 Generating provider configuration...\n');
  
  try {
    const config = generateProviderConfig(issueTitle, issueBody);
    const filepath = saveProviderConfig(config, outputDir);
    
    console.log('✅ Provider configuration generated successfully!');
    console.log(`📁 Saved to: ${filepath}`);
    console.log('\n📋 Configuration preview:');
    console.log(JSON.stringify(config, null, 2));
    
  } catch (error) {
    console.error('❌ Failed to generate configuration:', error.message);
    process.exit(1);
  }
}

module.exports = {
  generateProviderConfig,
  parseIssueBody,
  saveProviderConfig
};