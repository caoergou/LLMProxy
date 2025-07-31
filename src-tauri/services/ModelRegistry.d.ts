export interface ModelInfo {
    id: string;
    object: string;
    created: number;
    owned_by: string;
    permission?: any[];
    root?: string;
    parent?: string;
}
export interface ModelCapabilities {
    supports_chat: boolean;
    supports_completion: boolean;
    supports_embedding: boolean;
    supports_function_calling: boolean;
    supports_streaming: boolean;
    max_tokens: number;
    context_window: number;
}
export interface UnifiedModel {
    openai_id: string;
    provider: string;
    provider_id: string;
    display_name: string;
    description: string;
    capabilities: ModelCapabilities;
    cost_per_1k_tokens?: {
        input: number;
        output: number;
    };
}
declare class ModelRegistryService {
    private models;
    private openaiModelMapping;
    private providerModelMapping;
    constructor();
    private initializeModels;
    private loadOpenAIModels;
    private loadAnthropicModels;
    private loadAzureModels;
    private buildMappings;
    /**
     * Get OpenAI-compatible model list
     */
    getOpenAIModels(): ModelInfo[];
    /**
     * Get detailed model information with capabilities
     */
    getDetailedModels(provider?: string): UnifiedModel[];
    /**
     * Get model by OpenAI ID
     */
    getModelByOpenAIId(openaiId: string): UnifiedModel | null;
    /**
     * Get model by provider and provider-specific ID
     */
    getModelByProviderId(provider: string, providerId: string): UnifiedModel | null;
    /**
     * Get best model for a provider given an OpenAI model request
     */
    getBestModelForProvider(provider: string, requestedOpenAIModel: string): UnifiedModel | null;
    /**
     * Validate if a model supports a specific capability
     */
    validateCapability(openaiId: string, capability: keyof ModelCapabilities): boolean;
    /**
     * Get available providers for a specific OpenAI model
     */
    getProvidersForModel(openaiId: string): string[];
    /**
     * Register additional models dynamically
     */
    registerModel(model: UnifiedModel): void;
    /**
     * Get supported providers
     */
    getSupportedProviders(): string[];
}
declare const _default: ModelRegistryService;
export default _default;
//# sourceMappingURL=ModelRegistry.d.ts.map