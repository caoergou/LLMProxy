import ProviderConfigLoader from '../utils/ProviderConfigLoader';
import { ProviderConfig } from '../types';

export interface ModelInfo {
  id: string; // OpenAI-compliant model ID
  object: string; // "model"
  created: number; // Unix timestamp
  owned_by: string; // Provider name
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
  openai_id: string; // Standardized OpenAI-format model ID
  provider: string;
  provider_id: string; // Provider-specific model ID
  display_name: string;
  description: string;
  capabilities: ModelCapabilities;
  cost_per_1k_tokens?: {
    input: number;
    output: number;
  };
}

class ModelRegistryService {
  private models: Map<string, UnifiedModel[]> = new Map(); // provider -> models
  private openaiModelMapping: Map<string, UnifiedModel> = new Map(); // openai_id -> model
  private providerModelMapping: Map<string, Map<string, UnifiedModel>> = new Map(); // provider -> provider_id -> model

  constructor() {
    this.initializeModels();
  }

  private initializeModels(): void {
    this.loadOpenAIModels();
    this.loadAnthropicModels();
    this.loadAzureModels();
    this.buildMappings();
  }

  private loadOpenAIModels(): void {
    const openaiModels: UnifiedModel[] = [
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

  private loadAnthropicModels(): void {
    const anthropicModels: UnifiedModel[] = [
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

  private loadAzureModels(): void {
    const azureModels: UnifiedModel[] = [
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

  private buildMappings(): void {
    this.openaiModelMapping.clear();
    this.providerModelMapping.clear();

    for (const [provider, models] of this.models) {
      const providerMapping = new Map<string, UnifiedModel>();
      
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
  getOpenAIModels(): ModelInfo[] {
    const modelList: ModelInfo[] = [];
    const seenModels = new Set<string>();

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
  getDetailedModels(provider?: string): UnifiedModel[] {
    if (provider) {
      return this.models.get(provider) || [];
    }

    const allModels: UnifiedModel[] = [];
    for (const models of this.models.values()) {
      allModels.push(...models);
    }
    return allModels;
  }

  /**
   * Get model by OpenAI ID
   */
  getModelByOpenAIId(openaiId: string): UnifiedModel | null {
    return this.openaiModelMapping.get(openaiId) || null;
  }

  /**
   * Get model by provider and provider-specific ID
   */
  getModelByProviderId(provider: string, providerId: string): UnifiedModel | null {
    const providerMapping = this.providerModelMapping.get(provider);
    return providerMapping?.get(providerId) || null;
  }

  /**
   * Get best model for a provider given an OpenAI model request
   */
  getBestModelForProvider(provider: string, requestedOpenAIModel: string): UnifiedModel | null {
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
  validateCapability(openaiId: string, capability: keyof ModelCapabilities): boolean {
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
  getProvidersForModel(openaiId: string): string[] {
    const providers: string[] = [];
    
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
  registerModel(model: UnifiedModel): void {
    const providerModels = this.models.get(model.provider) || [];
    providerModels.push(model);
    this.models.set(model.provider, providerModels);
    this.buildMappings();
  }

  /**
   * Get supported providers
   */
  getSupportedProviders(): string[] {
    return Array.from(this.models.keys());
  }
}

export default new ModelRegistryService();