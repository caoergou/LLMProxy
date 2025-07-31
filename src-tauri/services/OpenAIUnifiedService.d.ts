import { Response } from 'express';
import { OpenAIRequest, OpenAIResponse, OpenAIError } from './FormatAdapter';
interface UnifiedRequestOptions {
    preferredProvider?: string;
    fallbackProviders?: string[];
    requireCapability?: string;
}
declare class OpenAIUnifiedService {
    private adapters;
    constructor();
    private initializeAdapters;
    /**
     * Unified chat completions endpoint - OpenAI compliant with streaming support
     */
    chatCompletions(request: OpenAIRequest, options?: UnifiedRequestOptions): Promise<{
        success: boolean;
        data?: OpenAIResponse;
        error?: OpenAIError;
        metadata?: any;
    }>;
    /**
     * Streaming chat completions endpoint - OpenAI compliant SSE
     */
    chatCompletionsStream(request: OpenAIRequest, res: Response, options?: UnifiedRequestOptions): Promise<{
        success: boolean;
        error?: OpenAIError;
        metadata?: any;
    }>;
    /**
     * Get available models - OpenAI compliant
     */
    getModels(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * Get detailed model information with capabilities
     */
    getDetailedModels(provider?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * Get model information - OpenAI compliant
     */
    getModel(modelId: string): Promise<{
        success: boolean;
        data?: any;
        error?: OpenAIError;
    }>;
    private validateChatRequest;
    private selectProviderAndAdaptRequest;
    private selectOptimalApiKey;
    private makeProviderRequest;
    private makeProviderStreamRequest;
    private buildHeaders;
    private logApiCall;
    /**
     * Get supported providers for the unified service
     */
    getSupportedProviders(): string[];
    /**
     * Check if streaming is supported for a model
     */
    supportsStreaming(modelId: string): boolean;
    /**
     * Reload adapters (useful for development)
     */
    reloadAdapters(): void;
}
declare const _default: OpenAIUnifiedService;
export default _default;
//# sourceMappingURL=OpenAIUnifiedService.d.ts.map