import { Database as SQLiteDatabase } from 'sqlite3';
import * as path from 'path';
import ProviderConfigLoader from '../utils/ProviderConfigLoader';

class Database {
    private db: SQLiteDatabase | null = null;

    init(): void {
        // Use environment variable for database path if set (for Tauri), otherwise use default
        const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/api_proxy.db');
        
        // Ensure directory exists
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        this.db = new SQLiteDatabase(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database at:', dbPath);
                this.createTables();
            }
        });
    }

    private createTables(): void {
        if (!this.db) return;
        
        // API Keys table
        this.db.serialize(() => {
            this.db!.run(`CREATE TABLE IF NOT EXISTS api_keys (
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
            this.db!.run(`CREATE TABLE IF NOT EXISTS api_calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_id INTEGER,
                endpoint TEXT NOT NULL,
                method TEXT NOT NULL,
                request_data TEXT,
                response_status INTEGER,
                response_time INTEGER,
                cost REAL DEFAULT 0,
                first_token_latency INTEGER DEFAULT 0,
                total_tokens INTEGER DEFAULT 0,
                prompt_tokens INTEGER DEFAULT 0,
                completion_tokens INTEGER DEFAULT 0,
                tokens_per_second REAL DEFAULT 0,
                model_name TEXT,
                provider_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
            )`, (err) => {
                if (err) {
                    console.error('Error creating api_calls table:', err);
                } else {
                    this.migrateApiCallsTable();
                }
            });

            // Provider Templates table
            this.db!.run(`CREATE TABLE IF NOT EXISTS provider_templates (
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

    private seedProviderTemplates(): void {
        if (!this.db) return;
        
        // Load providers from configuration files
        const providers = ProviderConfigLoader.getAllProviders().map(config => ({
            provider: config.provider,
            name: config.name,
            base_url: config.base_url,
            auth_type: config.auth_type,
            request_format: config.request_format,
            response_format: config.response_format,
            cost_per_request: config.cost_per_request,
            endpoints: JSON.stringify(config.endpoints)
        }));

        providers.forEach(provider => {
            this.db!.run(`INSERT OR IGNORE INTO provider_templates 
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
    }

    private migrateApiCallsTable(): void {
        if (!this.db) return;
        
        // Check if new columns exist and add them if they don't
        const newColumns = [
            'first_token_latency INTEGER DEFAULT 0',
            'total_tokens INTEGER DEFAULT 0', 
            'prompt_tokens INTEGER DEFAULT 0',
            'completion_tokens INTEGER DEFAULT 0',
            'tokens_per_second REAL DEFAULT 0',
            'model_name TEXT',
            'provider_name TEXT'
        ];

        newColumns.forEach(columnDef => {
            const columnName = columnDef.split(' ')[0];
            this.db!.run(`ALTER TABLE api_calls ADD COLUMN ${columnDef}`, (err: any) => {
                if (err) {
                    if (err.message.includes('duplicate column name')) {
                        console.warn(`Column ${columnName} already exists. Skipping.`);
                    } else {
                        console.error(`Error adding column ${columnName}:`, err);
                    }
                }
            });
        });
    }

    getDb(): SQLiteDatabase | null {
        return this.db;
    }

    close(): void {
        if (this.db) {
            this.db.close();
        }
    }
}

export default new Database();