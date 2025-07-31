"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = require("sqlite3");
const path = __importStar(require("path"));
const ProviderConfigLoader_1 = __importDefault(require("../utils/ProviderConfigLoader"));
class Database {
    constructor() {
        this.db = null;
    }
    init() {
        // Use environment variable for database path if set (for Tauri), otherwise use default
        const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/api_proxy.db');
        // Ensure directory exists
        const dbDir = path.dirname(dbPath);
        const fs = require('fs');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        this.db = new sqlite3_1.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            }
            else {
                console.log('Connected to SQLite database at:', dbPath);
                this.createTables();
            }
        });
    }
    createTables() {
        if (!this.db)
            return;
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
                }
                else {
                    this.migrateApiCallsTable();
                }
            });
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
                }
                else {
                    this.seedProviderTemplates();
                }
            });
        });
    }
    seedProviderTemplates() {
        if (!this.db)
            return;
        // Load providers from configuration files
        const providers = ProviderConfigLoader_1.default.getAllProviders().map(config => ({
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
            this.db.run(`INSERT OR IGNORE INTO provider_templates 
                (provider, name, base_url, auth_type, request_format, response_format, cost_per_request, endpoints)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [provider.provider, provider.name, provider.base_url, provider.auth_type,
                provider.request_format, provider.response_format, provider.cost_per_request, provider.endpoints], (err) => {
                if (err) {
                    console.error('Error seeding provider template:', err);
                }
            });
        });
    }
    migrateApiCallsTable() {
        if (!this.db)
            return;
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
            this.db.run(`ALTER TABLE api_calls ADD COLUMN ${columnDef}`, (err) => {
                if (err) {
                    if (err.message.includes('duplicate column name')) {
                        console.warn(`Column ${columnName} already exists. Skipping.`);
                    }
                    else {
                        console.error(`Error adding column ${columnName}:`, err);
                    }
                }
            });
        });
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
exports.default = new Database();
//# sourceMappingURL=Database.js.map