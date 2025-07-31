import { ModelFamilyInfo, ModelProviderInfo, ModelCapabilities } from '../types';
declare class ModelAggregationService {
    private modelFamilies;
    constructor();
    /**
     * Load and aggregate models by family from all providers
     */
    private loadModelFamilies;
    /**
     * Get all model families
     */
    getModelFamilies(): ModelFamilyInfo[];
    /**
     * Get specific model family by name
     */
    getModelFamily(family: string): ModelFamilyInfo | null;
    /**
     * Get providers for a specific model family
     */
    getProvidersForFamily(family: string): ModelProviderInfo[];
    /**
     * Filter model families by capabilities
     */
    filterByCapabilities(capabilities: Partial<ModelCapabilities>): ModelFamilyInfo[];
    /**
     * Get best provider for a family based on criteria
     */
    getBestProvider(family: string, criteria?: {
        prioritizePrice?: boolean;
        prioritizePerformance?: boolean;
        prioritizeAvailability?: boolean;
    }): ModelProviderInfo | null;
    /**
     * Search model families by name or description
     */
    searchModelFamilies(query: string): ModelFamilyInfo[];
    /**
     * Get model families sorted by price (lowest first)
     */
    getModelFamiliesByPrice(): ModelFamilyInfo[];
    /**
     * Refresh model families (reload from configs)
     */
    refresh(): void;
    /**
     * Get family display name
     */
    private getFamilyDisplayName;
    /**
     * Get family description
     */
    private getFamilyDescription;
    /**
     * Get base capabilities for a family
     */
    private getBaseCapabilities;
    /**
     * Merge capabilities (union operation)
     */
    private mergeCapabilities;
}
declare const _default: ModelAggregationService;
export default _default;
//# sourceMappingURL=ModelAggregationService.d.ts.map