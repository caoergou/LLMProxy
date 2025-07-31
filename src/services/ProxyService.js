const axios = require('axios');
const ApiKeyModel = require('../models/ApiKey');
const ApiCallModel = require('../models/ApiCall');
const ProviderConfigLoader = require('../utils/ProviderConfigLoader');

class ProxyService {
    constructor() {
        this.formatAdapters = {
            openai: this.adaptOpenAIFormat.bind(this),
            anthropic: this.adaptAnthropicFormat.bind(this),
            azure: this.adaptAzureFormat.bind(this)
        };
        this.providerConfig = ProviderConfigLoader;
    }

    async proxyRequest(provider, endpoint, method, data, headers = {}) {
        const startTime = Date.now();
        let selectedApiKey = null;
        let response = null;
        let error = null;

        try {
            // Get optimal API key for provider
            selectedApiKey = await this.selectOptimalApiKey(provider);
            if (!selectedApiKey) {
                throw new Error(`No active API key found for provider: ${provider}`);
            }

            // Adapt request format if needed
            const adaptedData = await this.adaptRequestFormat(provider, data);
            
            // Prepare request
            const requestConfig = {
                method: method.toLowerCase(),
                url: `${selectedApiKey.base_url}${endpoint}`,
                data: adaptedData,
                headers: this.buildHeaders(selectedApiKey, headers),
                timeout: 30000
            };

            // Make request
            response = await axios(requestConfig);
            
            // Adapt response format
            const adaptedResponse = await this.adaptResponseFormat(provider, response.data);
            
            // Update quota if applicable
            if (selectedApiKey.remaining_quota > 0) {
                await ApiKeyModel.updateQuota(selectedApiKey.id, selectedApiKey.remaining_quota - 1);
            } else {
                throw new Error(`Quota exhausted for API key: ${selectedApiKey.name}`);
            }

            // Log successful call
            await this.logApiCall(selectedApiKey.id, endpoint, method, data, response.status, Date.now() - startTime, selectedApiKey.cost_per_request);

            return {
                success: true,
                data: adaptedResponse,
                provider: provider,
                api_key_name: selectedApiKey.name,
                response_time: Date.now() - startTime,
                cost: selectedApiKey.cost_per_request
            };

        } catch (err) {
            error = err;
            const responseStatus = err.response ? err.response.status : 500;
            
            // Log failed call
            if (selectedApiKey) {
                await this.logApiCall(selectedApiKey.id, endpoint, method, data, responseStatus, Date.now() - startTime, 0);
            }

            return {
                success: false,
                error: err.message,
                status: responseStatus,
                provider: provider,
                api_key_name: selectedApiKey ? selectedApiKey.name : 'none',
                response_time: Date.now() - startTime
            };
        }
    }

    async selectOptimalApiKey(provider) {
        const apiKeys = await ApiKeyModel.getActiveByProvider(provider);
        
        if (apiKeys.length === 0) {
            return null;
        }

        // Priority: 
        // 1. Unlimited quota (remaining_quota = -1)
        // 2. Highest remaining quota
        // 3. Lowest cost per request
        const unlimitedQuotaKeys = apiKeys.filter(key => key.remaining_quota === -1);
        if (unlimitedQuotaKeys.length > 0) {
            return unlimitedQuotaKeys.sort((a, b) => a.cost_per_request - b.cost_per_request)[0];
        }

        return apiKeys.sort((a, b) => {
            if (a.remaining_quota !== b.remaining_quota) {
               return b.remaining_quota - a.remaining_quota;
           }
           return a.cost_per_request - b.cost_per_request;
       })[0];
    }

    buildHeaders(apiKey, additionalHeaders = {}) {
        const headers = { ...additionalHeaders };
        
        // Use provider config to build headers
        const providerConfig = this.providerConfig.getProvider(apiKey.provider);
        if (providerConfig && providerConfig.headers) {
            const configHeaders = this.providerConfig.buildHeaders(apiKey.provider, apiKey.api_key);
            Object.assign(headers, configHeaders);
        } else {
            // Fallback to hardcoded headers for backward compatibility
            if (apiKey.provider === 'openai') {
                headers['Authorization'] = `Bearer ${apiKey.api_key}`;
                headers['Content-Type'] = 'application/json';
            } else if (apiKey.provider === 'anthropic') {
                headers['x-api-key'] = apiKey.api_key;
                headers['Content-Type'] = 'application/json';
                headers['anthropic-version'] = '2023-06-01';
            } else if (apiKey.provider === 'azure') {
                headers['api-key'] = apiKey.api_key;
                headers['Content-Type'] = 'application/json';
            }
        }

        return headers;
    }

    async adaptRequestFormat(provider, data) {
        if (this.formatAdapters[provider]) {
            return this.formatAdapters[provider](data, 'request');
        }
        return data;
    }

    async adaptResponseFormat(provider, data) {
        if (this.formatAdapters[provider]) {
            return this.formatAdapters[provider](data, 'response');
        }
        return data;
    }

    adaptOpenAIFormat(data, direction) {
        // OpenAI is our standard format, no adaptation needed
        return data;
    }

    adaptAnthropicFormat(data, direction) {
        if (direction === 'request') {
            // Convert OpenAI format to Anthropic format
            if (data.messages) {
                return {
                    model: data.model || 'claude-3-sonnet-20240229',
                    max_tokens: data.max_tokens || 1000,
                    messages: data.messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                };
            }
        } else if (direction === 'response') {
            // Convert Anthropic response to OpenAI format
            if (data.content && data.content[0]) {
                return {
                    id: data.id,
                    object: 'chat.completion',
                    model: data.model,
                    choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: data.content[0].text
                        },
                        finish_reason: data.stop_reason
                    }],
                    usage: data.usage
                };
            }
        }
        return data;
    }

    adaptAzureFormat(data, direction) {
        // Azure uses OpenAI format, no adaptation needed
        return data;
    }

    async logApiCall(apiKeyId, endpoint, method, requestData, responseStatus, responseTime, cost) {
        try {
            await ApiCallModel.create({
                api_key_id: apiKeyId,
                endpoint,
                method,
                request_data: requestData,
                response_status: responseStatus,
                response_time: responseTime,
                cost
            });
        } catch (error) {
            console.error('Failed to log API call:', error);
        }
    }

    // Get list of supported providers from config
    getSupportedProviders() {
        return this.providerConfig.getAllProviders();
    }

    // Check if provider is supported
    isProviderSupported(providerId) {
        return this.providerConfig.hasProvider(providerId);
    }

    // Get provider for a given model name
    async getProviderForModel(modelName) {
        const providers = this.providerConfig.getAllProviders();
        
        // First try exact match
        for (const provider of providers) {
            if (provider.models) {
                for (const model of provider.models) {
                    if (model.name === modelName) {
                        return provider.provider;
                    }
                }
            }
        }
        
        // If exact match not found, try case-insensitive match
        const lowerModelName = modelName.toLowerCase();
        for (const provider of providers) {
            if (provider.models) {
                for (const model of provider.models) {
                    if (model.name.toLowerCase() === lowerModelName) {
                        return provider.provider;
                    }
                }
            }
        }
        
        // Try partial matching for common model name variations
        for (const provider of providers) {
            if (provider.models) {
                for (const model of provider.models) {
                    // Handle common variations like gpt-3.5-turbo vs gpt-35-turbo
                    const normalizedModelName = modelName.replace(/[-_.]/g, '').toLowerCase();
                    const normalizedConfigName = model.name.replace(/[-_.]/g, '').toLowerCase();
                    
                    if (normalizedConfigName === normalizedModelName) {
                        return provider.provider;
                    }
                }
            }
        }
        
        // Try substring matching for broader compatibility
        for (const provider of providers) {
            if (provider.models) {
                for (const model of provider.models) {
                    const normalizedModelName = modelName.replace(/[-_.]/g, '').toLowerCase();
                    const normalizedConfigName = model.name.replace(/[-_.]/g, '').toLowerCase();
                    
                    // Check if either contains the other (with minimum length to avoid false positives)
                    if (normalizedModelName.length >= 5 && normalizedConfigName.length >= 5) {
                        if (normalizedConfigName.includes(normalizedModelName) || 
                            normalizedModelName.includes(normalizedConfigName)) {
                            return provider.provider;
                        }
                    }
                }
            }
        }
        
        // Try matching common model family names
        const modelFamilyMapping = {
            'gpt4': 'openai',
            'gpt3': 'openai', 
            'gpt35': 'openai',
            'claude3': 'anthropic',
            'claude': 'anthropic'
        };
        
        const cleanModelName = modelName.replace(/[-_.]/g, '').toLowerCase();
        for (const [family, provider] of Object.entries(modelFamilyMapping)) {
            if (cleanModelName.includes(family)) {
                return provider;
            }
        }
        
        return null;
    }

    // Get all available models across all providers
    getAllAvailableModels() {
        const providers = this.providerConfig.getAllProviders();
        const models = [];
        
        for (const provider of providers) {
            if (provider.models) {
                for (const model of provider.models) {
                    models.push({
                        ...model,
                        provider: provider.provider,
                        provider_name: provider.display_name
                    });
                }
            }
        }
        
        return models;
    }
}

module.exports = new ProxyService();