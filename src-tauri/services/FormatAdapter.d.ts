import { ProviderConfig } from '../types';
export interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
    content: string;
    name?: string;
    function_call?: any;
    tool_calls?: any[];
}
export interface OpenAIRequest {
    model: string;
    messages: OpenAIMessage[];
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | string[];
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
    user?: string;
    functions?: any[];
    function_call?: any;
    tools?: any[];
    tool_choice?: any;
}
export interface OpenAIResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        message: {
            role: string;
            content: string;
            function_call?: any;
            tool_calls?: any[];
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface OpenAIStreamChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        delta: {
            role?: string;
            content?: string;
            function_call?: any;
            tool_calls?: any[];
        };
        finish_reason?: string;
    }[];
}
export interface OpenAIError {
    error: {
        message: string;
        type: string;
        param?: string;
        code?: string;
    };
}
export declare abstract class BaseFormatAdapter {
    protected providerConfig: ProviderConfig;
    constructor(providerConfig: ProviderConfig);
    abstract adaptRequest(openaiRequest: OpenAIRequest): any;
    abstract adaptResponse(providerResponse: any, originalRequest: OpenAIRequest): OpenAIResponse;
    abstract adaptError(providerError: any): OpenAIError;
    abstract mapModelName(openaiModel: string): string;
    abstract reverseMapModelName(providerModel: string): string;
    abstract adaptStreamChunk(providerChunk: any, originalRequest: OpenAIRequest): OpenAIStreamChunk | null;
    abstract parseStreamData(data: string): any[];
    abstract supportsStreaming(): boolean;
}
export declare class OpenAIFormatAdapter extends BaseFormatAdapter {
    adaptRequest(openaiRequest: OpenAIRequest): any;
    adaptResponse(providerResponse: any, originalRequest: OpenAIRequest): OpenAIResponse;
    adaptError(providerError: any): OpenAIError;
    mapModelName(openaiModel: string): string;
    reverseMapModelName(providerModel: string): string;
    adaptStreamChunk(providerChunk: any, originalRequest: OpenAIRequest): OpenAIStreamChunk | null;
    parseStreamData(data: string): any[];
    supportsStreaming(): boolean;
}
export declare class AnthropicFormatAdapter extends BaseFormatAdapter {
    private modelMapping;
    private reverseModelMapping;
    adaptRequest(openaiRequest: OpenAIRequest): any;
    adaptResponse(providerResponse: any, originalRequest: OpenAIRequest): OpenAIResponse;
    adaptError(providerError: any): OpenAIError;
    mapModelName(openaiModel: string): string;
    reverseMapModelName(providerModel: string): string;
    private adaptMessages;
    private extractContent;
    private mapFinishReason;
    private mapErrorType;
    adaptStreamChunk(providerChunk: any, originalRequest: OpenAIRequest): OpenAIStreamChunk | null;
    parseStreamData(data: string): any[];
    supportsStreaming(): boolean;
}
export declare class AzureFormatAdapter extends BaseFormatAdapter {
    adaptRequest(openaiRequest: OpenAIRequest): any;
    adaptResponse(providerResponse: any, originalRequest: OpenAIRequest): OpenAIResponse;
    adaptError(providerError: any): OpenAIError;
    mapModelName(openaiModel: string): string;
    reverseMapModelName(providerModel: string): string;
    adaptStreamChunk(providerChunk: any, originalRequest: OpenAIRequest): OpenAIStreamChunk | null;
    parseStreamData(data: string): any[];
    supportsStreaming(): boolean;
}
export declare class FormatAdapterFactory {
    private static adapters;
    static register(provider: string, adapterClass: new (config: ProviderConfig) => BaseFormatAdapter): void;
    static getAdapter(provider: string, providerConfig: ProviderConfig): BaseFormatAdapter | null;
    static getSupportedProviders(): string[];
}
//# sourceMappingURL=FormatAdapter.d.ts.map