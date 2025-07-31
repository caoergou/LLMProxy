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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ProviderConfigLoader {
    constructor() {
        this.configPath = path.join(__dirname, '../../configs/providers');
        this.providers = new Map();
        this.loadProviders();
    }
    loadProviders() {
        try {
            if (!fs.existsSync(this.configPath)) {
                console.error('Provider config directory not found:', this.configPath);
                return;
            }
            const files = fs.readdirSync(this.configPath).filter(file => file.endsWith('.json'));
            for (const file of files) {
                try {
                    const filePath = path.join(this.configPath, file);
                    const configData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    // Validate required fields
                    if (!this.validateProviderConfig(configData)) {
                        console.error(`Invalid provider config in ${file}`);
                        continue;
                    }
                    this.providers.set(configData.provider, configData);
                    console.log(`Loaded provider config: ${configData.provider}`);
                }
                catch (error) {
                    console.error(`Error loading provider config ${file}:`, error.message);
                }
            }
        }
        catch (error) {
            console.error('Error loading provider configs:', error.message);
        }
    }
    validateProviderConfig(config) {
        const requiredFields = ['provider', 'name', 'base_url', 'auth_type'];
        const optionalFields = ['request_format', 'response_format'];
        // Check required fields
        const hasRequiredFields = requiredFields.every(field => config.hasOwnProperty(field));
        // Check optional fields (if present, they must be valid)
        const hasValidOptionalFields = optionalFields.every(field => !config.hasOwnProperty(field) || typeof config[field] === 'string');
        return hasRequiredFields && hasValidOptionalFields;
    }
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    getProvider(providerId) {
        return this.providers.get(providerId);
    }
    getProviderNames() {
        return Array.from(this.providers.keys());
    }
    hasProvider(providerId) {
        return this.providers.has(providerId);
    }
    getFormatAdapters() {
        const adapters = {};
        for (const [providerId, config] of this.providers) {
            adapters[providerId] = config.request_format;
        }
        return adapters;
    }
    buildHeaders(providerId, apiKey) {
        const provider = this.getProvider(providerId);
        if (!provider || !provider.headers) {
            return {};
        }
        const headers = {};
        for (const [key, value] of Object.entries(provider.headers)) {
            headers[key] = value.replace('{{api_key}}', apiKey);
        }
        return headers;
    }
    // Reload configs (useful for development/testing)
    reload() {
        this.providers.clear();
        this.loadProviders();
    }
}
exports.default = new ProviderConfigLoader();
//# sourceMappingURL=ProviderConfigLoader.js.map