const Database = require('../models/Database');

class ApiCallModel {
    static create(callData) {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            db.run(`INSERT INTO api_calls 
                    (api_key_id, endpoint, method, request_data, response_status, response_time, cost)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [callData.api_key_id, callData.endpoint, callData.method,
                 JSON.stringify(callData.request_data), callData.response_status,
                 callData.response_time, callData.cost || 0],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...callData });
                    }
                }
            );
        });
    }

    static getStats(timeRange = '24h') {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
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
                    resolve(rows);
                }
            });
        });
    }

    static getRecentCalls(limit = 50) {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
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
                    resolve(rows);
                }
            });
        });
    }

    static getUsageByEndpoint(timeRange = '24h') {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
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
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = ApiCallModel;