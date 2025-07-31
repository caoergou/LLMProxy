import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Response } from 'express';
import ApiKeyModel from '../models/ApiKey';
import ApiCallModel from '../models/ApiCall';
import ProviderConfigLoader from '../utils/ProviderConfigLoader';
import ModelRegistry from './ModelRegistry';
import { FormatAdapterFactory, BaseFormatAdapter, OpenAIRequest, OpenAIResponse, OpenAIError, OpenAIStreamChunk } from './FormatAdapter';
import { ApiKeyData, ProxyResult } from '../types';

interface UnifiedRequestOptions {
  preferredProvider?: string;
  fallbackProviders?: string[];
  requireCapability?: string;
}

class OpenAIUnifiedService {
  private adapters: Map<string, BaseFormatAdapter> = new Map();

  constructor() {
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    const providers = ProviderConfigLoader.getAllProviders();
    
    for (const provider of providers) {
      const adapter = FormatAdapterFactory.getAdapter(provider.provider, provider);
      if (adapter) {
        this.adapters.set(provider.provider, adapter);
      }
    }
  }

  /**
   * Unified chat completions endpoint - OpenAI compliant with streaming support
   */
  async chatCompletions(
    request: OpenAIRequest, 
    options: UnifiedRequestOptions = {}
  ): Promise<{ success: boolean; data?: OpenAIResponse; error?: OpenAIError; metadata?: any }> {
    const startTime = Date.now();

    try {
      // Validate request
      const validationError = this.validateChatRequest(request);
      if (validationError) {
        return {
          success: false,
          error: {
            error: {
              message: validationError,
              type: 'invalid_request_error'
            }
          }
        };
      }

      // Select provider and model
      const { provider, apiKey, adaptedRequest } = await this.selectProviderAndAdaptRequest(request, options);
      
      if (!provider || !apiKey) {
        return {
          success: false,
          error: {
            error: {
              message: 'No suitable provider or API key available',
              type: 'invalid_request_error'
            }
          }
        };
      }

      // Get adapter
      const adapter = this.adapters.get(provider);
      if (!adapter) {
        return {
          success: false,
          error: {
            error: {
              message: `No format adapter available for provider: ${provider}`,
              type: 'server_error'
            }
          }
        };
      }

      // Make request to provider
      const providerResponse = await this.makeProviderRequest(
        provider,
        apiKey,
        '/v1/messages',
        'POST',
        adaptedRequest
      );

      if (!providerResponse.success) {
        return {
          success: false,
          error: adapter.adaptError(providerResponse.error),
          metadata: {
            provider,
            api_key_name: apiKey.name,
            response_time: Date.now() - startTime
          }
        };
      }

      // Adapt response to OpenAI format
      const openaiResponse = adapter.adaptResponse(providerResponse.data, request);

      // Extract performance metrics from response
      const performanceMetrics = {
        totalTokens: openaiResponse.usage?.total_tokens || 0,
        promptTokens: openaiResponse.usage?.prompt_tokens || 0,
        completionTokens: openaiResponse.usage?.completion_tokens || 0,
        modelName: request.model,
        providerName: provider
      };

      // Log successful call
      await this.logApiCall(
        apiKey.id!,
        '/chat/completions',
        'POST',
        request,
        200,
        Date.now() - startTime,
        apiKey.cost_per_request || 0,
        performanceMetrics
      );

      return {
        success: true,
        data: openaiResponse,
        metadata: {
          provider,
          api_key_name: apiKey.name,
          response_time: Date.now() - startTime,
          cost: apiKey.cost_per_request
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          error: {
            message: (error as Error).message,
            type: 'server_error'
          }
        },
        metadata: {
          response_time: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Streaming chat completions endpoint - OpenAI compliant SSE
   */
  async chatCompletionsStream(
    request: OpenAIRequest,
    res: Response,
    options: UnifiedRequestOptions = {}
  ): Promise<{ success: boolean; error?: OpenAIError; metadata?: any }> {
    const startTime = Date.now();

    try {
      // Validate request
      const validationError = this.validateChatRequest(request);
      if (validationError) {
        return {
          success: false,
          error: {
            error: {
              message: validationError,
              type: 'invalid_request_error'
            }
          }
        };
      }

      // Select provider and model
      const { provider, apiKey, adaptedRequest } = await this.selectProviderAndAdaptRequest(request, options);
      
      if (!provider || !apiKey) {
        return {
          success: false,
          error: {
            error: {
              message: 'No suitable provider or API key available',
              type: 'invalid_request_error'
            }
          }
        };
      }

      // Get adapter
      const adapter = this.adapters.get(provider);
      if (!adapter) {
        return {
          success: false,
          error: {
            error: {
              message: `No format adapter available for provider: ${provider}`,
              type: 'server_error'
            }
          }
        };
      }

      // Check if adapter supports streaming
      if (!adapter.supportsStreaming()) {
        return {
          success: false,
          error: {
            error: {
              message: `Provider ${provider} does not support streaming`,
              type: 'invalid_request_error'
            }
          }
        };
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Make streaming request to provider
      const streamMetrics = await this.makeProviderStreamRequest(
        provider,
        apiKey,
        adaptedRequest,
        adapter,
        request,
        res
      );

      // Log successful call (for streaming, we'll track basic metrics)
      const performanceMetrics = {
        modelName: request.model,
        providerName: provider,
        firstTokenLatency: streamMetrics.firstTokenLatency,
        // For streaming, we can't get exact token counts until the stream completes
        // We'll estimate or update this later if needed
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0
      };

      await this.logApiCall(
        apiKey.id!,
        '/chat/completions',
        'POST',
        request,
        200,
        Date.now() - startTime,
        apiKey.cost_per_request || 0,
        performanceMetrics
      );

      return {
        success: true,
        metadata: {
          provider,
          api_key_name: apiKey.name,
          response_time: Date.now() - startTime,
          cost: apiKey.cost_per_request
        }
      };

    } catch (error) {
      // Send error as SSE event if headers already sent
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({
          error: {
            message: (error as Error).message,
            type: 'server_error'
          }
        })}\n\n`);
        res.end();
      }

      return {
        success: false,
        error: {
          error: {
            message: (error as Error).message,
            type: 'server_error'
          }
        },
        metadata: {
          response_time: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get available models - OpenAI compliant
   */
  async getModels(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const models = ModelRegistry.getOpenAIModels();
      
      return {
        success: true,
        data: {
          object: 'list',
          data: models
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get detailed model information with capabilities
   */
  async getDetailedModels(provider?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const models = ModelRegistry.getDetailedModels(provider);
      
      return {
        success: true,
        data: {
          object: 'list',
          data: models
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get model information - OpenAI compliant
   */
  async getModel(modelId: string): Promise<{ success: boolean; data?: any; error?: OpenAIError }> {
    try {
      const model = ModelRegistry.getModelByOpenAIId(modelId);
      
      if (!model) {
        return {
          success: false,
          error: {
            error: {
              message: `Model ${modelId} not found`,
              type: 'invalid_request_error',
              code: 'model_not_found'
            }
          }
        };
      }

      return {
        success: true,
        data: {
          id: model.openai_id,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: 'api-proxy'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          error: {
            message: (error as Error).message,
            type: 'server_error'
          }
        }
      };
    }
  }

  private validateChatRequest(request: OpenAIRequest): string | null {
    if (!request.model) {
      return 'Missing required parameter: model';
    }

    if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
      return 'Missing required parameter: messages';
    }

    for (const message of request.messages) {
      if (!message.role || !message.content) {
        return 'Each message must have role and content fields';
      }
      
      if (!['system', 'user', 'assistant', 'function', 'tool'].includes(message.role)) {
        return `Invalid message role: ${message.role}`;
      }
    }

    // Validate model capability
    if (!ModelRegistry.validateCapability(request.model, 'supports_chat')) {
      return `Model ${request.model} does not support chat completions`;
    }

    return null;
  }

  private async selectProviderAndAdaptRequest(
    request: OpenAIRequest, 
    options: UnifiedRequestOptions
  ): Promise<{ provider: string | null; apiKey: ApiKeyData | null; adaptedRequest: any }> {
    let selectedProvider: string | null = null;
    let selectedApiKey: ApiKeyData | null = null;

    // If preferred provider is specified, try it first
    if (options.preferredProvider) {
      selectedApiKey = await this.selectOptimalApiKey(options.preferredProvider);
      if (selectedApiKey) {
        selectedProvider = options.preferredProvider;
      }
    }

    // If no preferred provider or preferred provider not available, try other providers
    if (!selectedProvider || !selectedApiKey) {
      const availableProviders = ModelRegistry.getProvidersForModel(request.model);
      
      for (const provider of availableProviders) {
        if (provider === options.preferredProvider) continue; // Already tried
        
        const apiKey = await this.selectOptimalApiKey(provider);
        if (apiKey) {
          selectedProvider = provider;
          selectedApiKey = apiKey;
          break;
        }
      }
    }

    if (!selectedProvider || !selectedApiKey) {
      return { provider: null, apiKey: null, adaptedRequest: null };
    }

    // Adapt request for the selected provider
    const adapter = this.adapters.get(selectedProvider);
    const adaptedRequest = adapter ? adapter.adaptRequest(request) : request;

    return { provider: selectedProvider, apiKey: selectedApiKey, adaptedRequest };
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

  private async makeProviderRequest(
    provider: string,
    apiKey: ApiKeyData,
    endpoint: string,
    method: string,
    data: any
  ): Promise<{ success: boolean; data?: any; error?: any; status?: number }> {
    try {
      const providerConfig = ProviderConfigLoader.getProvider(provider);
      if (!providerConfig) {
        throw new Error(`Provider configuration not found: ${provider}`);
      }

      // Determine the correct endpoint based on provider
      let actualEndpoint = endpoint;
      if (provider === 'anthropic') {
        actualEndpoint = '/v1/messages';
      } else if (provider === 'openai' || provider === 'azure') {
        actualEndpoint = '/chat/completions';
      }

      const requestConfig: AxiosRequestConfig = {
        method: method.toLowerCase() as any,
        url: `${apiKey.base_url}${actualEndpoint}`,
        data: data,
        headers: this.buildHeaders(provider, apiKey),
        timeout: 30000
      };

      const response = await axios(requestConfig);
      
      // Update quota if applicable
      if (apiKey.remaining_quota !== undefined && apiKey.remaining_quota > 0) {
        await ApiKeyModel.updateQuota(apiKey.id!, apiKey.remaining_quota - 1);
      }

      return {
        success: true,
        data: response.data,
        status: response.status
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error,
        status: error.response?.status || 500
      };
    }
  }

  private async makeProviderStreamRequest(
    provider: string,
    apiKey: ApiKeyData,
    data: any,
    adapter: BaseFormatAdapter,
    originalRequest: OpenAIRequest,
    res: Response
  ): Promise<{ firstTokenLatency?: number }> {
    const providerConfig = ProviderConfigLoader.getProvider(provider);
    if (!providerConfig) {
      throw new Error(`Provider configuration not found: ${provider}`);
    }

    // Determine the correct endpoint based on provider
    let actualEndpoint = '/v1/messages';
    if (provider === 'anthropic') {
      actualEndpoint = '/v1/messages';
    } else if (provider === 'openai' || provider === 'azure') {
      actualEndpoint = '/chat/completions';
    }

    const requestConfig: AxiosRequestConfig = {
      method: 'post',
      url: `${apiKey.base_url}${actualEndpoint}`,
      data: data,
      headers: this.buildHeaders(provider, apiKey),
      timeout: 60000, // Longer timeout for streaming
      responseType: 'stream'
    };

    try {
      const response = await axios(requestConfig);
      
      // Update quota if applicable
      if (apiKey.remaining_quota !== undefined && apiKey.remaining_quota > 0) {
        await ApiKeyModel.updateQuota(apiKey.id!, apiKey.remaining_quota - 1);
      }

      let buffer = '';
      let firstTokenTime: number | null = null;
      const streamStartTime = Date.now();

      try {
        for await (const chunk of response.data) {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonData = trimmed.slice(6);
              
              if (jsonData === '[DONE]') {
                res.write('data: [DONE]\n\n');
                res.end();
                resolve({ firstTokenLatency: firstTokenTime || 0 });
                return;
              }

              try {
                const providerChunk = JSON.parse(jsonData);
                const openaiChunk = adapter.adaptStreamChunk(providerChunk, originalRequest);
                
                if (openaiChunk) {
                  // Track first token latency
                  if (firstTokenTime === null && openaiChunk.choices?.[0]?.delta?.content) {
                    firstTokenTime = Date.now() - streamStartTime;
                  }
                  
                  res.write(`data: ${JSON.stringify(openaiChunk)}\n\n`);
                }
              } catch (e) {
                // Skip invalid JSON chunks
                console.warn('Failed to parse streaming chunk:', e);
              }
            }
          }
        });

        response.data.on('end', () => {
          if (!res.headersSent && !res.destroyed) {
            res.write('data: [DONE]\n\n');
            res.end();
          }
          resolve({ firstTokenLatency: firstTokenTime || 0 });
        });

        response.data.on('error', (error: Error) => {
          if (!res.headersSent && !res.destroyed) {
            res.write(`data: ${JSON.stringify({
              error: {
                message: error.message,
                type: 'server_error'
              }
            })}\n\n`);
            res.end();
          }
          reject(error);
        });
      });

    } catch (error: any) {
      if (!res.headersSent && !res.destroyed) {
        res.write(`data: ${JSON.stringify({
          error: {
            message: error.response?.data || error.message,
            type: 'server_error'
          }
        })}\n\n`);
        res.end();
      }
      throw error;
    }
  }

  private buildHeaders(provider: string, apiKey: ApiKeyData): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const providerConfig = ProviderConfigLoader.getProvider(provider);
    if (providerConfig && providerConfig.headers) {
      const configHeaders = ProviderConfigLoader.buildHeaders(provider, apiKey.api_key);
      Object.assign(headers, configHeaders);
    } else {
      // Fallback headers
      if (provider === 'openai') {
        headers['Authorization'] = `Bearer ${apiKey.api_key}`;
        headers['Content-Type'] = 'application/json';
      } else if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey.api_key;
        headers['Content-Type'] = 'application/json';
        headers['anthropic-version'] = '2023-06-01';
      } else if (provider === 'azure') {
        headers['api-key'] = apiKey.api_key;
        headers['Content-Type'] = 'application/json';
      }
    }

    return headers;
  }

  private async logApiCall(
    apiKeyId: number,
    endpoint: string,
    method: string,
    requestData: any,
    responseStatus: number,
    responseTime: number,
    cost: number,
    performanceMetrics?: {
      firstTokenLatency?: number;
      totalTokens?: number;
      promptTokens?: number;
      completionTokens?: number;
      modelName?: string;
      providerName?: string;
    }
  ): Promise<void> {
    try {
      const callData: any = {
        api_key_id: apiKeyId,
        endpoint,
        method,
        request_data: requestData,
        response_status: responseStatus,
        response_time: responseTime,
        cost
      };

      // Add performance metrics if provided
      if (performanceMetrics) {
        callData.first_token_latency = performanceMetrics.firstTokenLatency || 0;
        callData.total_tokens = performanceMetrics.totalTokens || 0;
        callData.prompt_tokens = performanceMetrics.promptTokens || 0;
        callData.completion_tokens = performanceMetrics.completionTokens || 0;
        callData.model_name = performanceMetrics.modelName;
        callData.provider_name = performanceMetrics.providerName;
        
        // Calculate tokens per second if we have completion tokens and response time
        if (performanceMetrics.completionTokens && responseTime > 0) {
          callData.tokens_per_second = (performanceMetrics.completionTokens / responseTime) * 1000;
        }
      }

      await ApiCallModel.create(callData);
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }

  /**
   * Get supported providers for the unified service
   */
  getSupportedProviders(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if streaming is supported for a model
   */
  supportsStreaming(modelId: string): boolean {
    return ModelRegistry.validateCapability(modelId, 'supports_streaming');
  }

  /**
   * Reload adapters (useful for development)
   */
  reloadAdapters(): void {
    this.adapters.clear();
    this.initializeAdapters();
  }
}

export default new OpenAIUnifiedService();