"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatAdapterFactory = exports.AzureFormatAdapter = exports.AnthropicFormatAdapter = exports.OpenAIFormatAdapter = exports.BaseFormatAdapter = void 0;
class BaseFormatAdapter {
    constructor(providerConfig) {
        this.providerConfig = providerConfig;
    }
}
exports.BaseFormatAdapter = BaseFormatAdapter;
class OpenAIFormatAdapter extends BaseFormatAdapter {
    adaptRequest(openaiRequest) {
        // OpenAI format is the standard, no adaptation needed
        return openaiRequest;
    }
    adaptResponse(providerResponse, originalRequest) {
        // OpenAI format is the standard, no adaptation needed
        return providerResponse;
    }
    adaptError(providerError) {
        // OpenAI format is the standard, no adaptation needed
        return providerError;
    }
    mapModelName(openaiModel) {
        // Direct mapping for OpenAI
        return openaiModel;
    }
    reverseMapModelName(providerModel) {
        // Direct mapping for OpenAI
        return providerModel;
    }
    adaptStreamChunk(providerChunk, originalRequest) {
        // OpenAI format is the standard, no adaptation needed
        return providerChunk;
    }
    parseStreamData(data) {
        const chunks = [];
        const lines = data.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const jsonData = trimmed.slice(6); // Remove 'data: ' prefix
                if (jsonData === '[DONE]') {
                    break;
                }
                try {
                    chunks.push(JSON.parse(jsonData));
                }
                catch (e) {
                    // Skip invalid JSON
                }
            }
        }
        return chunks;
    }
    supportsStreaming() {
        return true;
    }
}
exports.OpenAIFormatAdapter = OpenAIFormatAdapter;
class AnthropicFormatAdapter extends BaseFormatAdapter {
    constructor() {
        super(...arguments);
        this.modelMapping = {
            'gpt-4': 'claude-3-opus-20240229',
            'gpt-4-turbo': 'claude-3-sonnet-20240229',
            'gpt-3.5-turbo': 'claude-3-haiku-20240307',
            'claude-3-opus': 'claude-3-opus-20240229',
            'claude-3-sonnet': 'claude-3-sonnet-20240229',
            'claude-3-haiku': 'claude-3-haiku-20240307'
        };
        this.reverseModelMapping = {
            'claude-3-opus-20240229': 'gpt-4',
            'claude-3-sonnet-20240229': 'gpt-4-turbo',
            'claude-3-haiku-20240307': 'gpt-3.5-turbo'
        };
    }
    adaptRequest(openaiRequest) {
        const anthropicRequest = {
            model: this.mapModelName(openaiRequest.model),
            max_tokens: openaiRequest.max_tokens || 1000,
            messages: this.adaptMessages(openaiRequest.messages)
        };
        // Add optional parameters
        if (openaiRequest.temperature !== undefined) {
            anthropicRequest.temperature = openaiRequest.temperature;
        }
        if (openaiRequest.top_p !== undefined) {
            anthropicRequest.top_p = openaiRequest.top_p;
        }
        if (openaiRequest.stop !== undefined) {
            anthropicRequest.stop_sequences = Array.isArray(openaiRequest.stop)
                ? openaiRequest.stop
                : [openaiRequest.stop];
        }
        // Handle streaming
        if (openaiRequest.stream) {
            anthropicRequest.stream = true;
        }
        return anthropicRequest;
    }
    adaptResponse(providerResponse, originalRequest) {
        const now = Math.floor(Date.now() / 1000);
        return {
            id: providerResponse.id || `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: now,
            model: this.reverseMapModelName(providerResponse.model) || originalRequest.model,
            choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: this.extractContent(providerResponse)
                    },
                    finish_reason: this.mapFinishReason(providerResponse.stop_reason)
                }],
            usage: {
                prompt_tokens: providerResponse.usage?.input_tokens || 0,
                completion_tokens: providerResponse.usage?.output_tokens || 0,
                total_tokens: (providerResponse.usage?.input_tokens || 0) + (providerResponse.usage?.output_tokens || 0)
            }
        };
    }
    adaptError(providerError) {
        return {
            error: {
                message: providerError.error?.message || 'Unknown error occurred',
                type: this.mapErrorType(providerError.error?.type),
                code: providerError.error?.code
            }
        };
    }
    mapModelName(openaiModel) {
        return this.modelMapping[openaiModel] || 'claude-3-sonnet-20240229';
    }
    reverseMapModelName(providerModel) {
        return this.reverseModelMapping[providerModel] || 'gpt-3.5-turbo';
    }
    adaptMessages(messages) {
        return messages.map(msg => ({
            role: msg.role === 'system' ? 'metadata' : msg.role, // Use a neutral role for system messages
            content: msg.role === 'system'
                ? JSON.stringify({ original_role: 'system', content: msg.content }) // Preserve original role in structured format
                : msg.content
        }));
    }
    extractContent(response) {
        if (response.content && Array.isArray(response.content) && response.content.length > 0) {
            return response.content[0].text || '';
        }
        return response.content || '';
    }
    mapFinishReason(anthropicReason) {
        const mapping = {
            'end_turn': 'stop',
            'max_tokens': 'length',
            'stop_sequence': 'stop'
        };
        return mapping[anthropicReason] || 'stop';
    }
    mapErrorType(anthropicType) {
        const mapping = {
            'invalid_request_error': 'invalid_request_error',
            'authentication_error': 'invalid_request_error',
            'permission_error': 'invalid_request_error',
            'not_found_error': 'invalid_request_error',
            'rate_limit_error': 'rate_limit_exceeded',
            'api_error': 'server_error',
            'overloaded_error': 'server_error'
        };
        return mapping[anthropicType] || 'server_error';
    }
    adaptStreamChunk(providerChunk, originalRequest) {
        if (!providerChunk || providerChunk.type === 'ping') {
            return null;
        }
        const now = Math.floor(Date.now() / 1000);
        const chunkId = `chatcmpl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        // Handle different Anthropic event types
        if (providerChunk.type === 'message_start') {
            return {
                id: chunkId,
                object: 'chat.completion.chunk',
                created: now,
                model: this.reverseMapModelName(providerChunk.message?.model) || originalRequest.model,
                choices: [{
                        index: 0,
                        delta: {
                            role: 'assistant'
                        }
                    }]
            };
        }
        if (providerChunk.type === 'content_block_delta' && providerChunk.delta?.text) {
            return {
                id: chunkId,
                object: 'chat.completion.chunk',
                created: now,
                model: this.reverseMapModelName(originalRequest.model) || originalRequest.model,
                choices: [{
                        index: 0,
                        delta: {
                            content: providerChunk.delta.text
                        }
                    }]
            };
        }
        if (providerChunk.type === 'message_delta' && providerChunk.delta?.stop_reason) {
            return {
                id: chunkId,
                object: 'chat.completion.chunk',
                created: now,
                model: this.reverseMapModelName(originalRequest.model) || originalRequest.model,
                choices: [{
                        index: 0,
                        delta: {},
                        finish_reason: this.mapFinishReason(providerChunk.delta.stop_reason)
                    }]
            };
        }
        return null;
    }
    parseStreamData(data) {
        const chunks = [];
        const lines = data.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const jsonData = trimmed.slice(6); // Remove 'data: ' prefix
                try {
                    chunks.push(JSON.parse(jsonData));
                }
                catch (e) {
                    // Skip invalid JSON
                }
            }
        }
        return chunks;
    }
    supportsStreaming() {
        return true;
    }
}
exports.AnthropicFormatAdapter = AnthropicFormatAdapter;
class AzureFormatAdapter extends BaseFormatAdapter {
    adaptRequest(openaiRequest) {
        // Azure uses OpenAI format, mostly compatible
        return openaiRequest;
    }
    adaptResponse(providerResponse, originalRequest) {
        // Azure uses OpenAI format, mostly compatible
        return providerResponse;
    }
    adaptError(providerError) {
        // Azure uses OpenAI format, mostly compatible
        return providerError;
    }
    mapModelName(openaiModel) {
        // Azure deployment names might be different from model names
        // This would typically be configured per API key
        return openaiModel;
    }
    reverseMapModelName(providerModel) {
        return providerModel;
    }
    adaptStreamChunk(providerChunk, originalRequest) {
        // Azure uses OpenAI format, mostly compatible
        return providerChunk;
    }
    parseStreamData(data) {
        const chunks = [];
        const lines = data.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const jsonData = trimmed.slice(6); // Remove 'data: ' prefix
                if (jsonData === '[DONE]') {
                    break;
                }
                try {
                    chunks.push(JSON.parse(jsonData));
                }
                catch (e) {
                    // Skip invalid JSON
                }
            }
        }
        return chunks;
    }
    supportsStreaming() {
        return true;
    }
}
exports.AzureFormatAdapter = AzureFormatAdapter;
class FormatAdapterFactory {
    static register(provider, adapterClass) {
        FormatAdapterFactory.adapters.set(provider, adapterClass);
    }
    static getAdapter(provider, providerConfig) {
        const AdapterClass = FormatAdapterFactory.adapters.get(provider);
        if (!AdapterClass) {
            return null;
        }
        return new AdapterClass(providerConfig);
    }
    static getSupportedProviders() {
        return Array.from(FormatAdapterFactory.adapters.keys());
    }
}
exports.FormatAdapterFactory = FormatAdapterFactory;
FormatAdapterFactory.adapters = new Map();
(() => {
    FormatAdapterFactory.register('openai', OpenAIFormatAdapter);
    FormatAdapterFactory.register('anthropic', AnthropicFormatAdapter);
    FormatAdapterFactory.register('azure', AzureFormatAdapter);
})();
//# sourceMappingURL=FormatAdapter.js.map