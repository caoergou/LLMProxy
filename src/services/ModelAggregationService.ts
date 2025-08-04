
import ProviderConfigLoader from '../utils/ProviderConfigLoader';
import { 
  ModelFamilyInfo, 
  ModelProviderInfo, 
  ExtendedModelInfo, 
  ProviderConfig, 
  ModelCapabilities,
  ModelFamilyWithAvgPrice
} from '../types';

class ModelAggregationService {
  private modelFamilies: Map<string, ModelFamilyInfo> = new Map();

  constructor() {
    this.loadModelFamilies();
  }

  /**
   * Load and aggregate models by family from all providers
   */
  private loadModelFamilies(): void {
    const providers = ProviderConfigLoader.getAllProviders();
    this.modelFamilies.clear();

    for (const provider of providers) {
      if (!provider.models || !Array.isArray(provider.models)) {
        continue;
      }

      for (const model of provider.models as ExtendedModelInfo[]) {
        const family = model.model_family || model.name;

        if (!this.modelFamilies.has(family)) {
          this.modelFamilies.set(family, {
            family,
            display_name: this.getFamilyDisplayName(family),
            description: this.getFamilyDescription(family),
            capabilities: this.getBaseCapabilities(model.capabilities),
            providers: [],
          });
        }

        const familyInfo = this.modelFamilies.get(family)!;

        // Add provider info for this model
        const providerInfo: ModelProviderInfo = {
          provider: provider.provider,
          provider_name: provider.display_name || provider.name,
          model_name: model.name,
          display_name: model.display_name,
          pricing: model.pricing,
          performance: model.performance,
          limits: model.limits,
          icon: provider.icon,
        };

        familyInfo.providers.push(providerInfo);

        // Update family capabilities (union of all provider capabilities)
        familyInfo.capabilities = this.mergeCapabilities(
          familyInfo.capabilities,
          model.capabilities
        );
      }
    }
  }

  /**
   * Get all model families
   */
  getModelFamilies(): ModelFamilyInfo[] {
    return Array.from(this.modelFamilies.values()).sort((a, b) =>
      a.display_name.localeCompare(b.display_name)
    );
  }

  /**
   * Get specific model family by name
   */
  getModelFamily(family: string): ModelFamilyInfo | null {
    return this.modelFamilies.get(family) || null;
  }

  /**
   * Get providers for a specific model family
   */
  getProvidersForFamily(family: string): ModelProviderInfo[] {
    const familyInfo = this.modelFamilies.get(family);
    return familyInfo ? familyInfo.providers : [];
  }

  /**
   * Filter model families by capabilities
   */
  filterByCapabilities(
    capabilities: Partial<ModelCapabilities>
  ): ModelFamilyInfo[] {
    return this.getModelFamilies().filter((family) => {
      return Object.entries(capabilities).every(([key, value]) => {
        const capability = key as keyof ModelCapabilities;
        if (typeof value === "boolean") {
          return family.capabilities[capability] === value;
        } else if (
          typeof value === "number" &&
          capability === "context_length"
        ) {
          return family.capabilities.context_length >= value;
        }
        return true;
      });
    });
  }

  /**
   * Get best provider for a family based on criteria
   */
  getBestProvider(
    family: string,
    criteria: {
      prioritizePrice?: boolean;
      prioritizePerformance?: boolean;
      prioritizeAvailability?: boolean;
    } = {}
  ): ModelProviderInfo | null {
    const providers = this.getProvidersForFamily(family);
    if (providers.length === 0) {
      return null;
    }

    let sortedProviders = [...providers];

    if (criteria.prioritizePrice) {
      sortedProviders.sort(
        (a, b) => a.pricing.input_price - b.pricing.input_price
      );
    } else if (criteria.prioritizePerformance) {
      sortedProviders.sort(
        (a, b) =>
          a.performance.avg_response_time - b.performance.avg_response_time
      );
    } else if (criteria.prioritizeAvailability) {
      sortedProviders.sort(
        (a, b) => b.performance.availability - a.performance.availability
      );
    }

    return sortedProviders[0];
  }

  /**
   * Search model families by name or description
   */
  searchModelFamilies(query: string): ModelFamilyInfo[] {
    const lowerQuery = query.toLowerCase();
    return this.getModelFamilies().filter(
      (family) =>
        family.family.toLowerCase().includes(lowerQuery) ||
        family.display_name.toLowerCase().includes(lowerQuery) ||
        family.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get model families sorted by price (lowest first)
   */
  getModelFamiliesByPrice(): ModelFamilyInfo[] {
    return this.getModelFamilies()
      .map((family) => {
        // Calculate average price across providers
        const avgPrice =
          family.providers.reduce(
            (sum, provider) => sum + provider.pricing.input_price,
            0
          ) / family.providers.length;

        return { ...family, avgPrice } as ModelFamilyWithAvgPrice;
      })
      .sort(
        (a: ModelFamilyWithAvgPrice, b: ModelFamilyWithAvgPrice) =>
          a.avgPrice - b.avgPrice
      );
  }

  /**
   * Refresh model families (reload from configs)
   */
  refresh(): void {
    this.loadModelFamilies();
  }

  /**
   * Get family display name
   */
  private getFamilyDisplayName(family: string): string {
    const displayNames: Record<string, string> = {
      "gpt-4": "GPT-4 系列",
      "gpt-3.5": "GPT-3.5 系列",
      "claude-3": "Claude 3 系列",
      "claude-2": "Claude 2 系列",
    };
    return displayNames[family] || family;
  }

  /**
   * Get family description
   */
  private getFamilyDescription(family: string): string {
    const descriptions: Record<string, string> = {
      "gpt-4": "最先进的大型语言模型系列，具备强大的推理和创作能力",
      "gpt-3.5": "快速高效的语言模型系列，适合大部分日常任务",
      "claude-3": "Anthropic 最新的对话AI系列，注重安全和有用性",
      "claude-2": "Anthropic 的对话AI模型，擅长复杂推理任务",
    };
    return descriptions[family] || `${family} 模型系列`;
  }

  /**
   * Get base capabilities for a family
   */
  private getBaseCapabilities(
    capabilities: ModelCapabilities
  ): ModelCapabilities {
    return { ...capabilities };
  }

  /**
   * Merge capabilities (union operation)
   */
  private mergeCapabilities(
    existing: ModelCapabilities,
    newCaps: ModelCapabilities
  ): ModelCapabilities {
    return {
      reasoning: existing.reasoning || newCaps.reasoning,
      function_calling: existing.function_calling || newCaps.function_calling,
      vision: existing.vision || newCaps.vision,
      code_generation: existing.code_generation || newCaps.code_generation,
      multimodal: existing.multimodal || newCaps.multimodal,
      streaming: existing.streaming || newCaps.streaming,
      context_length: Math.max(existing.context_length, newCaps.context_length),
    };
  }
}

export default new ModelAggregationService();
