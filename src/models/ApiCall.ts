import Database from './Database';
import { ApiCallData, ApiStats, RecentCall, EndpointUsage, TimeRange, TokenUsageStats, PerformanceMetrics } from '../types';

class ApiCallModel {
    static create(callData: Omit<ApiCallData, 'id' | 'created_at'>): Promise<ApiCallData> {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            db.run(`INSERT INTO api_calls 
                    (api_key_id, endpoint, method, request_data, response_status, response_time, cost,
                     first_byte_time, tokens_prompt, tokens_completion, tokens_total,
                     request_size, response_size, model_used, provider_response_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [callData.api_key_id, callData.endpoint, callData.method,
                 JSON.stringify(callData.request_data), callData.response_status,
                 callData.response_time, callData.cost || 0,
                 callData.first_byte_time || null, callData.tokens_prompt || null,
                 callData.tokens_completion || null, callData.tokens_total || null,
                 callData.request_size || null, callData.response_size || null,
                 callData.model_used || null, callData.provider_response_time || null],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...callData } as ApiCallData);
                    }
                }
            );
        });
    }

    static getStats(timeRange: TimeRange = '24h'): Promise<ApiStats[]> {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            let timeFilter = '';
            
            switch(timeRange) {
                case '1h':
                    timeFilter = "datetime(ac.created_at) >= datetime('now', '-1 hour')";
                    break;
                case '24h':
                    timeFilter = "datetime(ac.created_at) >= datetime('now', '-1 day')";
                    break;
                case '7d':
                    timeFilter = "datetime(ac.created_at) >= datetime('now', '-7 days')";
                    break;
                case '30d':
                    timeFilter = "datetime(ac.created_at) >= datetime('now', '-30 days')";
                    break;
                default:
                    timeFilter = "1=1";
            }

            db.all(`SELECT 
                        ak.provider,
                        ak.name,
                        COUNT(*) as call_count,
                        AVG(ac.response_time) as avg_response_time,
                        SUM(ac.cost) as total_cost,
                        COUNT(CASE WHEN ac.response_status >= 200 AND ac.response_status < 300 THEN 1 END) as success_count,
                        COUNT(CASE WHEN ac.response_status >= 400 THEN 1 END) as error_count,
                        AVG(ac.first_byte_time) as avg_first_byte_time,
                        SUM(ac.tokens_total) as total_tokens,
                        AVG(ac.tokens_total) as avg_tokens_per_request,
                        AVG(ac.request_size) as avg_request_size,
                        AVG(ac.response_size) as avg_response_size
                    FROM api_calls ac
                    JOIN api_keys ak ON ac.api_key_id = ak.id
                    WHERE ${timeFilter}
                    GROUP BY ak.id, ak.provider, ak.name
                    ORDER BY total_cost DESC`, [], (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    // Calculate tokens per second for each provider
                    const enhancedStats = rows.map(row => ({
                        ...row,
                        tokens_per_second: row.total_tokens && row.avg_response_time ? 
                            (row.total_tokens / (row.avg_response_time * row.call_count / 1000)) : 0
                    }));
                    resolve(enhancedStats as ApiStats[]);
                }
            });
        });
    }

    static getRecentCalls(limit: number = 50): Promise<RecentCall[]> {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            db.all(`SELECT 
                        ac.*,
                        ak.provider,
                        ak.name as api_name
                    FROM api_calls ac
                    JOIN api_keys ak ON ac.api_key_id = ak.id
                    ORDER BY ac.created_at DESC
                    LIMIT ?`, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as RecentCall[]);
                }
            });
        });
    }

    static getUsageByEndpoint(timeRange: TimeRange = '24h'): Promise<EndpointUsage[]> {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            let timeFilter = '';
            
            switch(timeRange) {
                case '1h':
                    timeFilter = "datetime(created_at) >= datetime('now', '-1 hour')";
                    break;
                case '24h':
                    timeFilter = "datetime(created_at) >= datetime('now', '-1 day')";
                    break;
                case '7d':
                    timeFilter = "datetime(created_at) >= datetime('now', '-7 days')";
                    break;
                case '30d':
                    timeFilter = "datetime(created_at) >= datetime('now', '-30 days')";
                    break;
                default:
                    timeFilter = "1=1";
            }

            db.all(`SELECT 
                        endpoint,
                        method,
                        COUNT(*) as call_count,
                        AVG(response_time) as avg_response_time,
                        SUM(cost) as total_cost
                    FROM api_calls
                    WHERE ${timeFilter}
                    GROUP BY endpoint, method
                    ORDER BY call_count DESC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as EndpointUsage[]);
                }
            });
        });
    }

    static getTokenUsageStats(timeRange: TimeRange = '24h'): Promise<TokenUsageStats[]> {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            let timeFilter = '';
            
            switch(timeRange) {
                case '1h':
                    timeFilter = "datetime(ac.created_at) >= datetime('now', '-1 hour')";
                    break;
                case '24h':
                    timeFilter = "datetime(ac.created_at) >= datetime('now', '-1 day')";
                    break;
                case '7d':
                    timeFilter = "datetime(ac.created_at) >= datetime('now', '-7 days')";
                    break;
                case '30d':
                    timeFilter = "datetime(ac.created_at) >= datetime('now', '-30 days')";
                    break;
                default:
                    timeFilter = "1=1";
            }

            db.all(`SELECT 
                        ak.provider,
                        ak.name as api_key_name,
                        SUM(COALESCE(ac.tokens_total, 0)) as total_tokens,
                        SUM(COALESCE(ac.tokens_prompt, 0)) as prompt_tokens,
                        SUM(COALESCE(ac.tokens_completion, 0)) as completion_tokens,
                        AVG(ac.cost) as cost_per_token,
                        COUNT(*) as requests_count,
                        AVG(COALESCE(ac.tokens_total, 0)) as avg_tokens_per_request,
                        CASE WHEN SUM(COALESCE(ac.tokens_prompt, 0)) > 0 
                             THEN CAST(SUM(COALESCE(ac.tokens_completion, 0)) AS REAL) / SUM(COALESCE(ac.tokens_prompt, 0))
                             ELSE 0 END as token_efficiency
                    FROM api_calls ac
                    JOIN api_keys ak ON ac.api_key_id = ak.id
                    WHERE ${timeFilter} AND ac.tokens_total > 0
                    GROUP BY ak.id, ak.provider, ak.name
                    ORDER BY total_tokens DESC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as TokenUsageStats[]);
                }
            });
        });
    }

    static getPerformanceMetrics(timeRange: TimeRange = '24h'): Promise<PerformanceMetrics> {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            let timeFilter = '';
            
            switch(timeRange) {
                case '1h':
                    timeFilter = "datetime(created_at) >= datetime('now', '-1 hour')";
                    break;
                case '24h':
                    timeFilter = "datetime(created_at) >= datetime('now', '-1 day')";
                    break;
                case '7d':
                    timeFilter = "datetime(created_at) >= datetime('now', '-7 days')";
                    break;
                case '30d':
                    timeFilter = "datetime(created_at) >= datetime('now', '-30 days')";
                    break;
                default:
                    timeFilter = "1=1";
            }

            // Get basic metrics
            db.get(`SELECT 
                        AVG(response_time) as avg_response_time,
                        AVG(first_byte_time) as avg_first_byte_time,
                        COUNT(*) as total_requests,
                        COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as success_count,
                        COUNT(CASE WHEN response_status >= 400 THEN 1 END) as error_count,
                        SUM(COALESCE(tokens_total, 0)) as total_tokens,
                        SUM(response_time) as total_response_time_ms
                    FROM api_calls
                    WHERE ${timeFilter}`, [], (err, basicRow: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Get percentile metrics
                db.all(`SELECT response_time 
                        FROM api_calls 
                        WHERE ${timeFilter} AND response_time IS NOT NULL 
                        ORDER BY response_time`, [], (err, responseTimeRows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const responseTimes = responseTimeRows.map(row => row.response_time);
                    const p95Index = Math.floor(responseTimes.length * 0.95);
                    const p99Index = Math.floor(responseTimes.length * 0.99);

                    const totalRequests = basicRow.total_requests || 0;
                    const successRate = totalRequests > 0 ? (basicRow.success_count / totalRequests) * 100 : 0;
                    const errorRate = totalRequests > 0 ? (basicRow.error_count / totalRequests) * 100 : 0;
                    
                    // Calculate tokens per second
                    const tokensPerSecond = basicRow.total_tokens && basicRow.total_response_time_ms ? 
                        (basicRow.total_tokens / (basicRow.total_response_time_ms / 1000)) : 0;
                    
                    // Calculate throughput (requests per minute)
                    const timeRangeMinutes = timeRange === '1h' ? 60 : timeRange === '24h' ? 1440 : 
                                           timeRange === '7d' ? 10080 : 43200;
                    const throughputRPM = totalRequests / timeRangeMinutes;

                    const metrics: PerformanceMetrics = {
                        avg_response_time: basicRow.avg_response_time || 0,
                        avg_first_byte_time: basicRow.avg_first_byte_time || 0,
                        p95_response_time: responseTimes[p95Index] || 0,
                        p99_response_time: responseTimes[p99Index] || 0,
                        tokens_per_second: tokensPerSecond,
                        throughput_requests_per_minute: throughputRPM,
                        error_rate: errorRate,
                        success_rate: successRate
                    };

                    resolve(metrics);
                });
            });
        });
    }
}

export default ApiCallModel;