import Database from './Database';
import { ApiCallData, ApiStats, RecentCall, EndpointUsage, TimeRange, PerformanceMetrics, TokenUsageStats } from '../types';

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
                     first_token_latency, total_tokens, prompt_tokens, completion_tokens, tokens_per_second, model_name, provider_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [callData.api_key_id, callData.endpoint, callData.method,
                 JSON.stringify(callData.request_data), callData.response_status,
                 callData.response_time, callData.cost || 0,
                 callData.first_token_latency || 0, callData.total_tokens || 0, 
                 callData.prompt_tokens || 0, callData.completion_tokens || 0,
                 callData.tokens_per_second || 0, callData.model_name || null, callData.provider_name || null],
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
                        COUNT(CASE WHEN ac.response_status >= 400 THEN 1 END) as error_count
                    FROM api_calls ac
                    JOIN api_keys ak ON ac.api_key_id = ak.id
                    WHERE ${timeFilter}
                    GROUP BY ak.id, ak.provider, ak.name
                    ORDER BY total_cost DESC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as ApiStats[]);
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

    static getPerformanceMetrics(timeRange: TimeRange = '24h'): Promise<PerformanceMetrics[]> {
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
                        COALESCE(ac.provider_name, ak.provider) as provider,
                        ac.model_name,
                        AVG(ac.first_token_latency) as avg_first_token_latency,
                        AVG(ac.tokens_per_second) as avg_tokens_per_second,
                        SUM(ac.total_tokens) as total_tokens_consumed,
                        AVG(ac.response_time) as avg_response_time,
                        COUNT(*) as request_count,
                        ? as time_period
                    FROM api_calls ac
                    LEFT JOIN api_keys ak ON ac.api_key_id = ak.id
                    WHERE ${timeFilter} AND ac.response_status >= 200 AND ac.response_status < 300
                    GROUP BY COALESCE(ac.provider_name, ak.provider), ac.model_name
                    ORDER BY total_tokens_consumed DESC`, [timeRange], (err: any, rows: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as PerformanceMetrics[]);
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
                        COALESCE(ac.provider_name, ak.provider) as provider,
                        COALESCE(ac.model_name, 'unknown') as model_name,
                        SUM(ac.total_tokens) as total_tokens,
                        SUM(ac.prompt_tokens) as prompt_tokens,
                        SUM(ac.completion_tokens) as completion_tokens,
                        COUNT(*) as total_requests,
                        CASE WHEN COUNT(*) > 0 THEN SUM(ac.total_tokens) / COUNT(*) ELSE 0 END as avg_tokens_per_request,
                        CASE WHEN SUM(ac.total_tokens) > 0 THEN SUM(ac.cost) / SUM(ac.total_tokens) ELSE 0 END as cost_per_token,
                        SUM(ac.cost) as total_cost
                    FROM api_calls ac
                    LEFT JOIN api_keys ak ON ac.api_key_id = ak.id
                    WHERE ${timeFilter} AND ac.response_status >= 200 AND ac.response_status < 300
                    GROUP BY COALESCE(ac.provider_name, ak.provider), COALESCE(ac.model_name, 'unknown')
                    ORDER BY total_tokens DESC`, [], (err: any, rows: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as TokenUsageStats[]);
                }
            });
        });
    }

    static getHourlyMetrics(hours: number = 24): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }

            db.all(`SELECT 
                        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
                        COUNT(*) as request_count,
                        SUM(total_tokens) as total_tokens,
                        AVG(response_time) as avg_response_time,
                        AVG(first_token_latency) as avg_first_token_latency,
                        SUM(cost) as total_cost,
                        COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as success_count,
                        COUNT(CASE WHEN response_status >= 400 THEN 1 END) as error_count
                    FROM api_calls
                    WHERE datetime(created_at) >= datetime('now', ?)
                    GROUP BY strftime('%Y-%m-%d %H:00:00', created_at)
                    ORDER BY hour`, [`-${hours} hours`], (err: any, rows: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

export default ApiCallModel;