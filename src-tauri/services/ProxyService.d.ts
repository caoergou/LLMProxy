import { ProxyResult } from '../types';
declare class ProxyService {
    private formatAdapters;
    private providerConfig;
    constructor();
    proxyRequest(provider: string, endpoint: string, method: string, data: any, headers?: Record<string, string>): Promise<ProxyResult>;
    private selectOptimalApiKey;
    private buildHeaders;
    private adaptRequestFormat;
    private adaptResponseFormat;
    private adaptOpenAIFormat;
    private adaptAnthropicFormat;
    private adaptAzureFormat;
    private logApiCall;
    getSupportedProviders(): import("../types").ProviderConfig[];
    isProviderSupported(providerId: string): boolean;
}
declare const _default: ProxyService;
export default _default;
//# sourceMappingURL=ProxyService.d.ts.map