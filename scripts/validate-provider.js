#!/usr/bin/env node

/**
 * Provider Configuration Validator
 * Validates provider configuration files for LLM Proxy
 */

const fs = require('fs');
const path = require('path');

// Required fields for provider configuration
const REQUIRED_FIELDS = [
  'provider',
  'name', 
  'display_name',
  'description',
  'base_url',
  'auth_type',
  'request_format',
  'response_format',
  'endpoints',
  'models',
  'headers',
  'website',
  'documentation'
];

// Valid values for enum fields
const VALID_AUTH_TYPES = ['bearer', 'header', 'api-key', 'oauth'];
const VALID_FORMATS = ['openai', 'custom'];

/**
 * Validates a URL string
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates provider ID format
 * @param {string} providerId - Provider ID to validate
 * @returns {boolean} - Whether provider ID is valid
 */
function isValidProviderId(providerId) {
  // Must be lowercase, alphanumeric with hyphens only
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(providerId);
}

/**
 * Validates a single model configuration
 * @param {Object} model - Model configuration to validate
 * @returns {Object} - Validation result
 */
function validateModel(model) {
  const errors = [];
  
  if (!model.name || typeof model.name !== 'string') {
    errors.push('Model must have a valid name');
  }
  
  if (!model.display_name || typeof model.display_name !== 'string') {
    errors.push('Model must have a valid display_name');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates provider configuration
 * @param {Object} config - Provider configuration to validate
 * @returns {Object} - Validation result
 */
function validateProviderConfig(config) {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // If basic fields are missing, return early
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }
  
  // Validate provider ID format
  if (!isValidProviderId(config.provider)) {
    errors.push('Provider ID must be lowercase, alphanumeric with hyphens only (e.g., "my-provider")');
  }
  
  // Validate URLs
  if (!isValidUrl(config.base_url)) {
    errors.push('base_url must be a valid URL');
  }
  
  if (!isValidUrl(config.website)) {
    errors.push('website must be a valid URL');
  }
  
  if (!isValidUrl(config.documentation)) {
    errors.push('documentation must be a valid URL');
  }
  
  if (config.console_url && !isValidUrl(config.console_url)) {
    errors.push('console_url must be a valid URL');
  }
  
  // Validate enum fields
  if (!VALID_AUTH_TYPES.includes(config.auth_type)) {
    errors.push(`auth_type must be one of: ${VALID_AUTH_TYPES.join(', ')}`);
  }
  
  if (!VALID_FORMATS.includes(config.request_format)) {
    errors.push(`request_format must be one of: ${VALID_FORMATS.join(', ')}`);
  }
  
  if (!VALID_FORMATS.includes(config.response_format)) {
    errors.push(`response_format must be one of: ${VALID_FORMATS.join(', ')}`);
  }
  
  // Validate arrays
  if (!Array.isArray(config.endpoints) || config.endpoints.length === 0) {
    errors.push('endpoints must be a non-empty array');
  }
  
  if (!Array.isArray(config.models) || config.models.length === 0) {
    errors.push('models must be a non-empty array');
  } else {
    // Validate each model
    config.models.forEach((model, index) => {
      const modelValidation = validateModel(model);
      if (!modelValidation.valid) {
        errors.push(`Model ${index + 1}: ${modelValidation.errors.join(', ')}`);
      }
    });
  }
  
  // Validate headers object
  if (typeof config.headers !== 'object' || config.headers === null) {
    errors.push('headers must be an object');
  }
  
  // Validate cost_per_request if provided
  if (config.cost_per_request !== undefined) {
    const cost = parseFloat(config.cost_per_request);
    if (isNaN(cost) || cost < 0) {
      errors.push('cost_per_request must be a positive number');
    }
  }
  
  // Warnings for optional but recommended fields
  if (!config.icon) {
    warnings.push('No icon specified (recommended for better UX)');
  }
  
  if (!config.registration_guide) {
    warnings.push('No registration guide provided (recommended for users)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Checks if provider already exists
 * @param {string} providerId - Provider ID to check
 * @param {string} configsDir - Path to providers directory
 * @returns {boolean} - Whether provider already exists
 */
function providerExists(providerId, configsDir) {
  const providerFile = path.join(configsDir, `${providerId}.json`);
  return fs.existsSync(providerFile);
}

/**
 * Main validation function
 * @param {string} configPath - Path to config file or config JSON string
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
function validateProvider(configPath, options = {}) {
  let config;
  
  try {
    // Check if it's a file path or JSON string
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configContent);
    } else {
      config = JSON.parse(configPath);
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to parse configuration: ${error.message}`],
      warnings: []
    };
  }
  
  const validation = validateProviderConfig(config);
  
  // Check if provider already exists (if configs directory is provided)
  if (options.configsDir && config.provider) {
    if (providerExists(config.provider, options.configsDir)) {
      validation.errors.push(`Provider '${config.provider}' already exists`);
      validation.valid = false;
    }
  }
  
  return validation;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node validate-provider.js <config-file-or-json> [configs-dir]');
    process.exit(1);
  }
  
  const configPath = args[0];
  const configsDir = args[1] || path.join(__dirname, '../configs/providers');
  
  console.log('🔍 Validating provider configuration...\n');
  
  const result = validateProvider(configPath, { configsDir });
  
  if (result.valid) {
    console.log('✅ Configuration is valid!');
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    process.exit(0);
  } else {
    console.log('❌ Configuration has errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    process.exit(1);
  }
}

module.exports = {
  validateProvider,
  validateProviderConfig,
  providerExists,
  isValidUrl,
  isValidProviderId
};