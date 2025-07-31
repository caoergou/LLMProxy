"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ModelRegistryService {
    constructor() {
        this.models = new Map(); // provider -> models
        this.openaiModelMapping = new Map(); // openai_id -> model
        this.providerModelMapping = new Map(); // provider -> provider_id -> model
        this.initializeModels();
    }
    initializeModels() {
        this.loadOpenAIModels();
        this.loadAnthropicModels();
        this.loadAzureModels();
        this.buildMappings();
    }
    loadOpenAIModels() {
        const openaiModels = [
            {
                openai_id: 'gpt-4',
                provider: 'openai',
                provider_id: 'gpt-4',
                display_name: 'GPT-4',
                description: 'Most capable model, best for complex tasks',
                capabilities: {
                    supports_chat: true,
                    supports_completion: true,
                    supports_embedding: false,
                    supports_function_calling: true,
                    supports_streaming: true,
                    max_tokens: 4096,
                    context_window: 8192
                },
                cost_per_1k_tokens: {
                    input: 0.03,
                    output: 0.06
                }
            },
            {
                openai_id: 'gpt-4-turbo',
                provider: 'openai',
                provider_id: 'gpt-4-turbo-preview',
                display_name: 'GPT-4 Turbo',
                description: 'Faster and more efficient version of GPT-4',
                capabilities: {
                    supports_chat: true,
                    supports_completion: true,
                    supports_embedding: false,
                    supports_function_calling: true,
                    supports_streaming: true,
                    max_tokens: 4096,
                    context_window: 128000
                },
                cost_per_1k_tokens: {
                    input: 0.01,
                    output: 0.03
                }
            },
            {
                openai_id: 'gpt-3.5-turbo',
                provider: 'openai',
                provider_id: 'gpt-3.5-turbo',
                display_name: 'GPT-3.5 Turbo',
                description: 'Fast and efficient model for most tasks',
                capabilities: {
                    supports_chat: true,
                    supports_completion: true,
                    supports_embedding: false,
                    supports_function_calling: true,
                    supports_streaming: true,
                    max_tokens: 4096,
                    context_window: 16385
                },
                cost_per_1k_tokens: {
                    input: 0.001,
                    output: 0.002
                }
            }
        ];
        this.models.set('openai', openaiModels);
    }
    loadAnthropicModels() {
        const anthropicModels = [
            {
                openai_id: 'claude-3-opus', // Unique ID for Anthropic model
                provider: 'anthropic',
                provider_id: 'claude-3-opus-20240229',
                display_name: 'Claude 3 Opus',
                description: 'Most powerful model for complex tasks',
                capabilities: {
                    supports_chat: true,
                    supports_completion: false,
                    supports_embedding: false,
                    supports_function_calling: false,
                    supports_streaming: true,
                    max_tokens: 4096,
                    context_window: 200000
                },
                cost_per_1k_tokens: {
                    input: 0.015,
                    output: 0.075
                }
            },
            {
                openai_id: 'gpt-4-turbo', // Map to GPT-4 Turbo equivalent
                provider: 'anthropic',
                provider_id: 'claude-3-sonnet-20240229',
                display_name: 'Claude 3 Sonnet',
                description: 'Balanced performance and speed',
                capabilities: {
                    supports_chat: true,
                    supports_completion: false,
                    supports_embedding: false,
                    supports_function_calling: false,
                    supports_streaming: true,
                    max_tokens: 4096,
                    context_window: 200000
                },
                cost_per_1k_tokens: {
                    input: 0.003,
                    output: 0.015
                }
            },
            {
                openai_id: 'gpt-3.5-turbo', // Map to GPT-3.5 Turbo equivalent
                provider: 'anthropic',
                provider_id: 'claude-3-haiku-20240307',
                display_name: 'Claude 3 Haiku',
                description: 'Fast and efficient for simple tasks',
                capabilities: {
                    supports_chat: true,
                    supports_completion: false,
                    supports_embedding: false,
                    supports_function_calling: false,
                    supports_streaming: true,
                    max_tokens: 4096,
                    context_window: 200000
                },
                cost_per_1k_tokens: {
                    input: 0.00025,
                    output: 0.00125
                }
            }
        ];
        this.models.set('anthropic', anthropicModels);
    }
    loadAzureModels() {
        const azureModels = [
            {
                openai_id: 'gpt-4',
                provider: 'azure',
                provider_id: 'gpt-4',
                display_name: 'GPT-4 (Azure)',
                description: 'GPT-4 hosted on Azure OpenAI Service',
                capabilities: {
                    supports_chat: true,
                    supports_completion: true,
                    supports_embedding: false,
                    supports_function_calling: true,
                    supports_streaming: true,
                    max_tokens: 4096,
                    context_window: 8192
                },
                cost_per_1k_tokens: {
                    input: 0.03,
                    output: 0.06
                }
            },
            {
                openai_id: 'gpt-3.5-turbo',
                provider: 'azure',
                provider_id: 'gpt-35-turbo',
                display_name: 'GPT-3.5 Turbo (Azure)',
                description: 'GPT-3.5 Turbo hosted on Azure OpenAI Service',
                capabilities: {
                    supports_chat: true,
                    supports_completion: true,
                    supports_embedding: false,
                    supports_function_calling: true,
                    supports_streaming: true,
                    max_tokens: 4096,
                    context_window: 16385
                },
                cost_per_1k_tokens: {
                    input: 0.001,
                    output: 0.002
                }
            }
        ];
        this.models.set('azure', azureModels);
    }
    buildMappings() {
        this.openaiModelMapping.clear();
        this.providerModelMapping.clear();
        for (const [provider, models] of this.models) {
            const providerMapping = new Map();
            for (const model of models) {
                // Build OpenAI model mapping (many-to-one possible)
                if (!this.openaiModelMapping.has(model.openai_id)) {
                    this.openaiModelMapping.set(model.openai_id, model);
                }
                // Build provider-specific mapping
                providerMapping.set(model.provider_id, model);
            }
            this.providerModelMapping.set(provider, providerMapping);
        }
    }
    /**
     * Get OpenAI-compatible model list
     */
    getOpenAIModels() {
        const modelList = [];
        const seenModels = new Set();
        for (const models of this.models.values()) {
            for (const model of models) {
                if (!seenModels.has(model.openai_id)) {
                    seenModels.add(model.openai_id);
                    modelList.push({
                        id: model.openai_id,
                        object: 'model',
                        created: Math.floor(Date.now() / 1000),
                        owned_by: 'api-proxy'
                    });
                }
            }
        }
        return modelList.sort((a, b) => a.id.localeCompare(b.id));
    }
    /**
     * Get detailed model information with capabilities
     */
    getDetailedModels(provider) {
        if (provider) {
            return this.models.get(provider) || [];
        }
        const allModels = [];
        for (const models of this.models.values()) {
            allModels.push(...models);
        }
        return allModels;
    }
    /**
     * Get model by OpenAI ID
     */
    getModelByOpenAIId(openaiId) {
        return this.openaiModelMapping.get(openaiId) || null;
    }
    /**
     * Get model by provider and provider-specific ID
     */
    getModelByProviderId(provider, providerId) {
        const providerMapping = this.providerModelMapping.get(provider);
        return providerMapping?.get(providerId) || null;
    }
    /**
     * Get best model for a provider given an OpenAI model request
     */
    getBestModelForProvider(provider, requestedOpenAIModel) {
        const providerModels = this.models.get(provider) || [];
        // First try exact match
        const exactMatch = providerModels.find(m => m.openai_id === requestedOpenAIModel);
        if (exactMatch) {
            return exactMatch;
        }
        // Fallback to first model of the provider
        return providerModels[0] || null;
    }
    /**
     * Validate if a model supports a specific capability
     */
    validateCapability(openaiId, capability) {
        const model = this.getModelByOpenAIId(openaiId);
        if (!model) {
            return false;
        }
        const value = model.capabilities[capability];
        return typeof value === 'boolean' ? value : false;
    }
    /**
     * Get available providers for a specific OpenAI model
     */
    getProvidersForModel(openaiId) {
        const providers = [];
        for (const [provider, models] of this.models) {
            if (models.some(m => m.openai_id === openaiId)) {
                providers.push(provider);
            }
        }
        return providers;
    }
    /**
     * Register additional models dynamically
     */
    registerModel(model) {
        const providerModels = this.models.get(model.provider) || [];
        providerModels.push(model);
        this.models.set(model.provider, providerModels);
        this.buildMappings();
    }
    /**
     * Get supported providers
     */
    getSupportedProviders() {
        return Array.from(this.models.keys());
    }
}
exports.default = new ModelRegistryService();
//# sourceMappingURL=ModelRegistry.js.map