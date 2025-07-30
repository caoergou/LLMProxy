const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
    }

    init() {
        const dbPath = path.join(__dirname, '../../data/api_proxy.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        // API Keys table
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL,
                name TEXT NOT NULL,
                api_key TEXT NOT NULL,
                api_secret TEXT,
                base_url TEXT NOT NULL,
                cost_per_request REAL DEFAULT 0,
                remaining_quota INTEGER DEFAULT -1,
                total_quota INTEGER DEFAULT -1,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // API Calls table for tracking usage
            this.db.run(`CREATE TABLE IF NOT EXISTS api_calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_id INTEGER,
                endpoint TEXT NOT NULL,
                method TEXT NOT NULL,
                request_data TEXT,
                response_status INTEGER,
                response_time INTEGER,
                cost REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
            )`);

            // Provider Templates table
            this.db.run(`CREATE TABLE IF NOT EXISTS provider_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                base_url TEXT NOT NULL,
                auth_type TEXT NOT NULL,
                request_format TEXT,
                response_format TEXT,
                cost_per_request REAL DEFAULT 0,
                endpoints TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Error creating provider_templates table:', err);
                } else {
                    this.seedProviderTemplates();
                }
            });
        });
    }

    seedProviderTemplates() {
        const providers = [
                {
                    provider: 'openai',
                    name: 'OpenAI',
                    base_url: 'https://api.openai.com/v1',
                    auth_type: 'bearer',
                    request_format: 'openai',
                    response_format: 'openai',
                    cost_per_request: 0.002,
                    endpoints: JSON.stringify(['/chat/completions', '/completions', '/embeddings'])
                },
                {
                    provider: 'anthropic',
                    name: 'Anthropic Claude',
                    base_url: 'https://api.anthropic.com',
                    auth_type: 'header',
                    request_format: 'anthropic',
                    response_format: 'anthropic',
                    cost_per_request: 0.003,
                    endpoints: JSON.stringify(['/v1/messages'])
                },
                {
                    provider: 'azure',
                    name: 'Azure OpenAI',
                    base_url: 'https://your-resource.openai.azure.com',
                    auth_type: 'api-key',
                    request_format: 'openai',
                    response_format: 'openai',
                    cost_per_request: 0.002,
                    endpoints: JSON.stringify(['/openai/deployments/{deployment-name}/chat/completions'])
                }
            ];

            providers.forEach(provider => {
                this.db.run(`INSERT OR IGNORE INTO provider_templates 
                    (provider, name, base_url, auth_type, request_format, response_format, cost_per_request, endpoints)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [provider.provider, provider.name, provider.base_url, provider.auth_type, 
                     provider.request_format, provider.response_format, provider.cost_per_request, provider.endpoints],
                    (err) => {
                        if (err) {
                            console.error('Error seeding provider template:', err);
                        }
                    }
                );
            });
        }, 100);
    }

    getDb() {
        return this.db;
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = new Database();