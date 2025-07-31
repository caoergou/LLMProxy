"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ProviderConfigLoader_1 = __importDefault(require("../utils/ProviderConfigLoader"));
class ModelAggregationService {
    constructor() {
        this.modelFamilies = new Map();
        this.loadModelFamilies();
    }
    /**
     * Load and aggregate models by family from all providers
     */
    loadModelFamilies() {
        const providers = ProviderConfigLoader_1.default.getAllProviders();
        this.modelFamilies.clear();
        for (const provider of providers) {
            if (!provider.models || !Array.isArray(provider.models)) {
                continue;
            }
            for (const model of provider.models) {
                const family = model.model_family || model.name;
                if (!this.modelFamilies.has(family)) {
                    this.modelFamilies.set(family, {
                        family,
                        display_name: this.getFamilyDisplayName(family),
                        description: this.getFamilyDescription(family),
                        capabilities: this.getBaseCapabilities(model.capabilities),
                        providers: []
                    });
                }
                const familyInfo = this.modelFamilies.get(family);
                // Add provider info for this model
                const providerInfo = {
                    provider: provider.provider,
                    provider_name: provider.display_name || provider.name,
                    model_name: model.name,
                    display_name: model.display_name,
                    pricing: model.pricing,
                    performance: model.performance,
                    limits: model.limits,
                    icon: provider.icon
                };
                familyInfo.providers.push(providerInfo);
                // Update family capabilities (union of all provider capabilities)
                familyInfo.capabilities = this.mergeCapabilities(familyInfo.capabilities, model.capabilities);
            }
        }
    }
    /**
     * Get all model families
     */
    getModelFamilies() {
        return Array.from(this.modelFamilies.values())
            .sort((a, b) => a.display_name.localeCompare(b.display_name));
    }
    /**
     * Get specific model family by name
     */
    getModelFamily(family) {
        return this.modelFamilies.get(family) || null;
    }
    /**
     * Get providers for a specific model family
     */
    getProvidersForFamily(family) {
        const familyInfo = this.modelFamilies.get(family);
        return familyInfo ? familyInfo.providers : [];
    }
    /**
     * Filter model families by capabilities
     */
    filterByCapabilities(capabilities) {
        return this.getModelFamilies().filter(family => {
            return Object.entries(capabilities).every(([key, value]) => {
                const capability = key;
                if (typeof value === 'boolean') {
                    return family.capabilities[capability] === value;
                }
                else if (typeof value === 'number' && capability === 'context_length') {
                    return family.capabilities.context_length >= value;
                }
                return true;
            });
        });
    }
    /**
     * Get best provider for a family based on criteria
     */
    getBestProvider(family, criteria = {}) {
        const providers = this.getProvidersForFamily(family);
        if (providers.length === 0) {
            return null;
        }
        let sortedProviders = [...providers];
        if (criteria.prioritizePrice) {
            sortedProviders.sort((a, b) => a.pricing.input_price - b.pricing.input_price);
        }
        else if (criteria.prioritizePerformance) {
            sortedProviders.sort((a, b) => a.performance.avg_response_time - b.performance.avg_response_time);
        }
        else if (criteria.prioritizeAvailability) {
            sortedProviders.sort((a, b) => b.performance.availability - a.performance.availability);
        }
        return sortedProviders[0];
    }
    /**
     * Search model families by name or description
     */
    searchModelFamilies(query) {
        const lowerQuery = query.toLowerCase();
        return this.getModelFamilies().filter(family => family.family.toLowerCase().includes(lowerQuery) ||
            family.display_name.toLowerCase().includes(lowerQuery) ||
            family.description.toLowerCase().includes(lowerQuery));
    }
    /**
     * Get model families sorted by price (lowest first)
     */
    getModelFamiliesByPrice() {
        return this.getModelFamilies().map(family => {
            // Calculate average price across providers
            const avgPrice = family.providers.reduce((sum, provider) => sum + provider.pricing.input_price, 0) / family.providers.length;
            return { ...family, avgPrice };
        }).sort((a, b) => a.avgPrice - b.avgPrice);
    }
    /**
     * Refresh model families (reload from configs)
     */
    refresh() {
        this.loadModelFamilies();
    }
    /**
     * Get family display name
     */
    getFamilyDisplayName(family) {
        const displayNames = {
            'gpt-4': 'GPT-4 系列',
            'gpt-3.5': 'GPT-3.5 系列',
            'claude-3': 'Claude 3 系列',
            'claude-2': 'Claude 2 系列'
        };
        return displayNames[family] || family;
    }
    /**
     * Get family description
     */
    getFamilyDescription(family) {
        const descriptions = {
            'gpt-4': '最先进的大型语言模型系列，具备强大的推理和创作能力',
            'gpt-3.5': '快速高效的语言模型系列，适合大部分日常任务',
            'claude-3': 'Anthropic 最新的对话AI系列，注重安全和有用性',
            'claude-2': 'Anthropic 的对话AI模型，擅长复杂推理任务'
        };
        return descriptions[family] || `${family} 模型系列`;
    }
    /**
     * Get base capabilities for a family
     */
    getBaseCapabilities(capabilities) {
        return { ...capabilities };
    }
    /**
     * Merge capabilities (union operation)
     */
    mergeCapabilities(existing, newCaps) {
        return {
            reasoning: existing.reasoning || newCaps.reasoning,
            function_calling: existing.function_calling || newCaps.function_calling,
            vision: existing.vision || newCaps.vision,
            code_generation: existing.code_generation || newCaps.code_generation,
            multimodal: existing.multimodal || newCaps.multimodal,
            streaming: existing.streaming || newCaps.streaming,
            context_length: Math.max(existing.context_length, newCaps.context_length)
        };
    }
}
exports.default = new ModelAggregationService();
//# sourceMappingURL=ModelAggregationService.js.map