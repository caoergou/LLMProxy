import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import ApiKeyModel from '../models/ApiKey';
import ApiCallModel from '../models/ApiCall';
import ProviderConfigLoader from '../utils/ProviderConfigLoader';
import { ApiKeyData, ProxyResult } from '../types';

type FormatAdapterFunction = (data: any, direction: 'request' | 'response') => any;

class ProxyService {
    private formatAdapters: Record<string, FormatAdapterFunction>;
    private providerConfig: typeof ProviderConfigLoader;

    constructor() {
        this.formatAdapters = {
            openai: this.adaptOpenAIFormat.bind(this),
            anthropic: this.adaptAnthropicFormat.bind(this),
            azure: this.adaptAzureFormat.bind(this)
        };
        this.providerConfig = ProviderConfigLoader;
    }

    async proxyRequest(provider: string, endpoint: string, method: string, data: any, headers: Record<string, string> = {}): Promise<ProxyResult> {
        const startTime = Date.now();
        let selectedApiKey: ApiKeyData | null = null;
        let response: AxiosResponse | null = null;
        let error: Error | null = null;

        try {
            // Get optimal API key for provider
            selectedApiKey = await this.selectOptimalApiKey(provider);
            if (!selectedApiKey) {
                throw new Error(`No active API key found for provider: ${provider}`);
            }

            // Adapt request format if needed
            const adaptedData = await this.adaptRequestFormat(provider, data);
            
            // Prepare request
            const requestConfig: AxiosRequestConfig = {
                method: method.toLowerCase() as any,
                url: `${selectedApiKey.base_url}${endpoint}`,
                data: adaptedData,
                headers: this.buildHeaders(selectedApiKey, headers),
                timeout: 30000
            };

            // Make request
            response = await axios(requestConfig);
            
            if (!response) {
                throw new Error('No response received from API');
            }
            
            // Adapt response format
            const adaptedResponse = await this.adaptResponseFormat(provider, response.data);
            
            // Update quota if applicable
            if (selectedApiKey.remaining_quota !== undefined && selectedApiKey.remaining_quota > 0) {
                await ApiKeyModel.updateQuota(selectedApiKey.id!, selectedApiKey.remaining_quota - 1);
            } else if (selectedApiKey.remaining_quota !== undefined && selectedApiKey.remaining_quota !== -1) {
                throw new Error(`Quota exhausted for API key: ${selectedApiKey.name}`);
            }

            // Log successful call
            await this.logApiCall(selectedApiKey.id!, endpoint, method, data, response.status, Date.now() - startTime, selectedApiKey.cost_per_request || 0);

            return {
                success: true,
                data: adaptedResponse,
                provider: provider,
                api_key_name: selectedApiKey.name,
                response_time: Date.now() - startTime,
                cost: selectedApiKey.cost_per_request
            };

        } catch (err) {
            error = err as Error;
            const responseStatus = (err as any).response ? (err as any).response.status : 500;
            
            // Log failed call
            if (selectedApiKey) {
                await this.logApiCall(selectedApiKey.id!, endpoint, method, data, responseStatus, Date.now() - startTime, 0);
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

    private async selectOptimalApiKey(provider: string): Promise<ApiKeyData | null> {
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
            return unlimitedQuotaKeys.sort((a, b) => (a.cost_per_request || 0) - (b.cost_per_request || 0))[0];
        }

        return apiKeys.sort((a, b) => {
            if ((a.remaining_quota || 0) !== (b.remaining_quota || 0)) {
               return (b.remaining_quota || 0) - (a.remaining_quota || 0);
           }
           return (a.cost_per_request || 0) - (b.cost_per_request || 0);
       })[0];
    }

    private buildHeaders(apiKey: ApiKeyData, additionalHeaders: Record<string, string> = {}): Record<string, string> {
        const headers: Record<string, string> = { ...additionalHeaders };
        
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

    private async adaptRequestFormat(provider: string, data: any): Promise<any> {
        if (this.formatAdapters[provider]) {
            return this.formatAdapters[provider](data, 'request');
        }
        return data;
    }

    private async adaptResponseFormat(provider: string, data: any): Promise<any> {
        if (this.formatAdapters[provider]) {
            return this.formatAdapters[provider](data, 'response');
        }
        return data;
    }

    private adaptOpenAIFormat(data: any, direction: 'request' | 'response'): any {
        // OpenAI is our standard format, no adaptation needed
        return data;
    }

    private adaptAnthropicFormat(data: any, direction: 'request' | 'response'): any {
        if (direction === 'request') {
            // Convert OpenAI format to Anthropic format
            if (data.messages) {
                return {
                    model: data.model || 'claude-3-sonnet-20240229',
                    max_tokens: data.max_tokens || 1000,
                    messages: data.messages.map((msg: any) => ({
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

    private adaptAzureFormat(data: any, direction: 'request' | 'response'): any {
        // Azure uses OpenAI format, no adaptation needed
        return data;
    }

    private async logApiCall(apiKeyId: number, endpoint: string, method: string, requestData: any, responseStatus: number, responseTime: number, cost: number): Promise<void> {
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
    isProviderSupported(providerId: string): boolean {
        return this.providerConfig.hasProvider(providerId);
    }
}

export default new ProxyService();