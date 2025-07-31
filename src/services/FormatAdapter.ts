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

export abstract class BaseFormatAdapter {
  protected providerConfig: ProviderConfig;

  constructor(providerConfig: ProviderConfig) {
    this.providerConfig = providerConfig;
  }

  abstract adaptRequest(openaiRequest: OpenAIRequest): any;
  abstract adaptResponse(providerResponse: any, originalRequest: OpenAIRequest): OpenAIResponse;
  abstract adaptError(providerError: any): OpenAIError;
  abstract mapModelName(openaiModel: string): string;
  abstract reverseMapModelName(providerModel: string): string;
  
  // Streaming support methods
  abstract adaptStreamChunk(providerChunk: any, originalRequest: OpenAIRequest): OpenAIStreamChunk | null;
  abstract parseStreamData(data: string): any[];
  abstract supportsStreaming(): boolean;
}

export class OpenAIFormatAdapter extends BaseFormatAdapter {
  adaptRequest(openaiRequest: OpenAIRequest): any {
    // OpenAI format is the standard, no adaptation needed
    return openaiRequest;
  }

  adaptResponse(providerResponse: any, originalRequest: OpenAIRequest): OpenAIResponse {
    // OpenAI format is the standard, no adaptation needed
    return providerResponse;
  }

  adaptError(providerError: any): OpenAIError {
    // OpenAI format is the standard, no adaptation needed
    return providerError;
  }

  mapModelName(openaiModel: string): string {
    // Direct mapping for OpenAI
    return openaiModel;
  }

  reverseMapModelName(providerModel: string): string {
    // Direct mapping for OpenAI
    return providerModel;
  }

  adaptStreamChunk(providerChunk: any, originalRequest: OpenAIRequest): OpenAIStreamChunk | null {
    // OpenAI format is the standard, no adaptation needed
    return providerChunk;
  }

  parseStreamData(data: string): any[] {
    const chunks: any[] = [];
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
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    return chunks;
  }

  supportsStreaming(): boolean {
    return true;
  }
}

export class AnthropicFormatAdapter extends BaseFormatAdapter {
  private modelMapping = {
    'gpt-4': 'claude-3-opus-20240229',
    'gpt-4-turbo': 'claude-3-sonnet-20240229',
    'gpt-3.5-turbo': 'claude-3-haiku-20240307',
    'claude-3-opus': 'claude-3-opus-20240229',
    'claude-3-sonnet': 'claude-3-sonnet-20240229',
    'claude-3-haiku': 'claude-3-haiku-20240307'
  };

  private reverseModelMapping = {
    'claude-3-opus-20240229': 'gpt-4',
    'claude-3-sonnet-20240229': 'gpt-4-turbo',
    'claude-3-haiku-20240307': 'gpt-3.5-turbo'
  };

  adaptRequest(openaiRequest: OpenAIRequest): any {
    const anthropicRequest: any = {
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

  adaptResponse(providerResponse: any, originalRequest: OpenAIRequest): OpenAIResponse {
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

  adaptError(providerError: any): OpenAIError {
    return {
      error: {
        message: providerError.error?.message || 'Unknown error occurred',
        type: this.mapErrorType(providerError.error?.type),
        code: providerError.error?.code
      }
    };
  }

  mapModelName(openaiModel: string): string {
    return this.modelMapping[openaiModel as keyof typeof this.modelMapping] || 'claude-3-sonnet-20240229';
  }

  reverseMapModelName(providerModel: string): string {
    return this.reverseModelMapping[providerModel as keyof typeof this.reverseModelMapping] || 'gpt-3.5-turbo';
  }

  private adaptMessages(messages: OpenAIMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role === 'system' ? 'metadata' : msg.role, // Use a neutral role for system messages
      content: msg.role === 'system' 
        ? JSON.stringify({ original_role: 'system', content: msg.content }) // Preserve original role in structured format
        : msg.content
    }));
  }

  private extractContent(response: any): string {
    if (response.content && Array.isArray(response.content) && response.content.length > 0) {
      return response.content[0].text || '';
    }
    return response.content || '';
  }

  private mapFinishReason(anthropicReason: string): string {
    const mapping: Record<string, string> = {
      'end_turn': 'stop',
      'max_tokens': 'length',
      'stop_sequence': 'stop'
    };
    return mapping[anthropicReason] || 'stop';
  }

  private mapErrorType(anthropicType: string): string {
    const mapping: Record<string, string> = {
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

  adaptStreamChunk(providerChunk: any, originalRequest: OpenAIRequest): OpenAIStreamChunk | null {
    if (!providerChunk || providerChunk.type === 'ping') {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const chunkId = `chatcmpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

  parseStreamData(data: string): any[] {
    const chunks: any[] = [];
    const lines = data.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const jsonData = trimmed.slice(6); // Remove 'data: ' prefix
        try {
          chunks.push(JSON.parse(jsonData));
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    return chunks;
  }

  supportsStreaming(): boolean {
    return true;
  }
}

export class AzureFormatAdapter extends BaseFormatAdapter {
  adaptRequest(openaiRequest: OpenAIRequest): any {
    // Azure uses OpenAI format, mostly compatible
    return openaiRequest;
  }

  adaptResponse(providerResponse: any, originalRequest: OpenAIRequest): OpenAIResponse {
    // Azure uses OpenAI format, mostly compatible
    return providerResponse;
  }

  adaptError(providerError: any): OpenAIError {
    // Azure uses OpenAI format, mostly compatible
    return providerError;
  }

  mapModelName(openaiModel: string): string {
    // Azure deployment names might be different from model names
    // This would typically be configured per API key
    return openaiModel;
  }

  reverseMapModelName(providerModel: string): string {
    return providerModel;
  }

  adaptStreamChunk(providerChunk: any, originalRequest: OpenAIRequest): OpenAIStreamChunk | null {
    // Azure uses OpenAI format, mostly compatible
    return providerChunk;
  }

  parseStreamData(data: string): any[] {
    const chunks: any[] = [];
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
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    return chunks;
  }

  supportsStreaming(): boolean {
    return true;
  }
}

export class FormatAdapterFactory {
  private static adapters = new Map<string, new (config: ProviderConfig) => BaseFormatAdapter>();

  static {
    FormatAdapterFactory.register('openai', OpenAIFormatAdapter);
    FormatAdapterFactory.register('anthropic', AnthropicFormatAdapter);
    FormatAdapterFactory.register('azure', AzureFormatAdapter);
  }

  static register(provider: string, adapterClass: new (config: ProviderConfig) => BaseFormatAdapter): void {
    FormatAdapterFactory.adapters.set(provider, adapterClass);
  }

  static getAdapter(provider: string, providerConfig: ProviderConfig): BaseFormatAdapter | null {
    const AdapterClass = FormatAdapterFactory.adapters.get(provider);
    if (!AdapterClass) {
      return null;
    }
    return new AdapterClass(providerConfig);
  }

  static getSupportedProviders(): string[] {
    return Array.from(FormatAdapterFactory.adapters.keys());
  }
}