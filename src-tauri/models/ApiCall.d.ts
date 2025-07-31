import { ApiCallData, ApiStats, RecentCall, EndpointUsage, TimeRange, PerformanceMetrics, TokenUsageStats } from '../types';
declare class ApiCallModel {
    static create(callData: Omit<ApiCallData, 'id' | 'created_at'>): Promise<ApiCallData>;
    static getStats(timeRange?: TimeRange): Promise<ApiStats[]>;
    static getRecentCalls(limit?: number): Promise<RecentCall[]>;
    static getUsageByEndpoint(timeRange?: TimeRange): Promise<EndpointUsage[]>;
    static getPerformanceMetrics(timeRange?: TimeRange): Promise<PerformanceMetrics[]>;
    static getTokenUsageStats(timeRange?: TimeRange): Promise<TokenUsageStats[]>;
    static getHourlyMetrics(hours?: number): Promise<any[]>;
}
export default ApiCallModel;
//# sourceMappingURL=ApiCall.d.ts.map