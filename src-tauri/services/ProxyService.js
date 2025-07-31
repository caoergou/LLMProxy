"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const ApiKey_1 = __importDefault(require("../models/ApiKey"));
const ApiCall_1 = __importDefault(require("../models/ApiCall"));
const ProviderConfigLoader_1 = __importDefault(require("../utils/ProviderConfigLoader"));
class ProxyService {
    constructor() {
        this.formatAdapters = {
            openai: this.adaptOpenAIFormat.bind(this),
            anthropic: this.adaptAnthropicFormat.bind(this),
            azure: this.adaptAzureFormat.bind(this)
        };
        this.providerConfig = ProviderConfigLoader_1.default;
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
            response = await (0, axios_1.default)(requestConfig);
            if (!response) {
                throw new Error('No response received from API');
            }
            // Adapt response format
            const adaptedResponse = await this.adaptResponseFormat(provider, response.data);
            // Update quota if applicable
            if (selectedApiKey.remaining_quota !== undefined && selectedApiKey.remaining_quota > 0) {
                await ApiKey_1.default.updateQuota(selectedApiKey.id, selectedApiKey.remaining_quota - 1);
            }
            else if (selectedApiKey.remaining_quota !== undefined && selectedApiKey.remaining_quota !== -1) {
                throw new Error(`Quota exhausted for API key: ${selectedApiKey.name}`);
            }
            // Log successful call
            await this.logApiCall(selectedApiKey.id, endpoint, method, data, response.status, Date.now() - startTime, selectedApiKey.cost_per_request || 0);
            return {
                success: true,
                data: adaptedResponse,
                provider: provider,
                api_key_name: selectedApiKey.name,
                response_time: Date.now() - startTime,
                cost: selectedApiKey.cost_per_request
            };
        }
        catch (err) {
            error = err;
            const responseStatus = err.response ? err.response.status : 500;
            // Log failed call
            if (selectedApiKey) {
                await this.logApiCall(selectedApiKey?.id || 0, endpoint, method, data, responseStatus, Date.now() - startTime, 0);
            }
            return {
                success: false,
                error: error.message,
                status: responseStatus,
                provider: provider,
                api_key_name: selectedApiKey ? selectedApiKey.name : 'none',
                response_time: Date.now() - startTime
            };
        }
    }
    async selectOptimalApiKey(provider) {
        const apiKeys = await ApiKey_1.default.getActiveByProvider(provider);
        if (apiKeys.length === 0) {
            return null;
        }
        // Priority: 
        // 1. Unlimited quota (remaining_quota = -1)
        // 2. Highest remaining quota
        // 3. Lowest cost per request
        const unlimitedQuotaKeys = apiKeys.filter(key => key.remaining_quota === -1);
        if (unlimitedQuotaKeys.length > 0) {
            return unlimitedQuotaKeys.sort((a, b) => (a.cost_per_request || 0) - (b.cost_per_request || 0))[0];
        }
        return apiKeys.sort((a, b) => {
            if ((a.remaining_quota || 0) !== (b.remaining_quota || 0)) {
                return (b.remaining_quota || 0) - (a.remaining_quota || 0);
            }
            return (a.cost_per_request || 0) - (b.cost_per_request || 0);
        })[0];
    }
    buildHeaders(apiKey, additionalHeaders = {}) {
        const headers = { ...additionalHeaders };
        // Use provider config to build headers
        const providerConfig = this.providerConfig.getProvider(apiKey.provider);
        if (providerConfig && providerConfig.headers) {
            const configHeaders = this.providerConfig.buildHeaders(apiKey.provider, apiKey.api_key);
            Object.assign(headers, configHeaders);
        }
        else {
            // Fallback to hardcoded headers for backward compatibility
            if (apiKey.provider === 'openai') {
                headers['Authorization'] = `Bearer ${apiKey.api_key}`;
                headers['Content-Type'] = 'application/json';
            }
            else if (apiKey.provider === 'anthropic') {
                headers['x-api-key'] = apiKey.api_key;
                headers['Content-Type'] = 'application/json';
                headers['anthropic-version'] = '2023-06-01';
            }
            else if (apiKey.provider === 'azure') {
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
                    messages: data.messages.map((msg) => ({
                        role: msg.role,
                        content: msg.content
                    }))
                };
            }
        }
        else if (direction === 'response') {
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
            await ApiCall_1.default.create({
                api_key_id: apiKeyId,
                endpoint,
                method,
                request_data: requestData,
                response_status: responseStatus,
                response_time: responseTime,
                cost
            });
        }
        catch (error) {
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
}
exports.default = new ProxyService();
//# sourceMappingURL=ProxyService.js.map