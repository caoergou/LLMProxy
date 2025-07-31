import { ProviderConfig } from '../types';
declare class ProviderConfigLoader {
    private configPath;
    private providers;
    constructor();
    private loadProviders;
    private validateProviderConfig;
    getAllProviders(): ProviderConfig[];
    getProvider(providerId: string): ProviderConfig | undefined;
    getProviderNames(): string[];
    hasProvider(providerId: string): boolean;
    getFormatAdapters(): Record<string, string | undefined>;
    buildHeaders(providerId: string, apiKey: string): Record<string, string>;
    reload(): void;
}
declare const _default: ProviderConfigLoader;
export default _default;
//# sourceMappingURL=ProviderConfigLoader.d.ts.map