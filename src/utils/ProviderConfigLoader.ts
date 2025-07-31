import * as fs from 'fs';
import * as path from 'path';
import { ProviderConfig } from '../types';

class ProviderConfigLoader {
    private configPath: string;
    private providers: Map<string, ProviderConfig>;

    constructor() {
        this.configPath = path.join(__dirname, '../../configs/providers');
        this.providers = new Map();
        this.loadProviders();
    }

    private loadProviders(): void {
        try {
            if (!fs.existsSync(this.configPath)) {
                console.error('Provider config directory not found:', this.configPath);
                return;
            }

            const files = fs.readdirSync(this.configPath).filter(file => file.endsWith('.json'));
            
            for (const file of files) {
                try {
                    const filePath = path.join(this.configPath, file);
                    const configData: ProviderConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    // Validate required fields
                    if (!this.validateProviderConfig(configData)) {
                        console.error(`Invalid provider config in ${file}`);
                        continue;
                    }
                    
                    this.providers.set(configData.provider, configData);
                    console.log(`Loaded provider config: ${configData.provider}`);
                } catch (error) {
                    console.error(`Error loading provider config ${file}:`, (error as Error).message);
                }
            }
        } catch (error) {
            console.error('Error loading provider configs:', (error as Error).message);
        }
    }

    private validateProviderConfig(config: any): config is ProviderConfig {
        const requiredFields = ['provider', 'name', 'base_url', 'auth_type'];
        const optionalFields = ['request_format', 'response_format'];
        
        // Check required fields
        const hasRequiredFields = requiredFields.every(field => config.hasOwnProperty(field));
        
        // Check optional fields (if present, they must be valid)
        const hasValidOptionalFields = optionalFields.every(field => 
            !config.hasOwnProperty(field) || typeof config[field] === 'string'
        );
        
        return hasRequiredFields && hasValidOptionalFields;
    }

    getAllProviders(): ProviderConfig[] {
        return Array.from(this.providers.values());
    }

    getProvider(providerId: string): ProviderConfig | undefined {
        return this.providers.get(providerId);
    }

    getProviderNames(): string[] {
        return Array.from(this.providers.keys());
    }

    hasProvider(providerId: string): boolean {
        return this.providers.has(providerId);
    }

    getFormatAdapters(): Record<string, string | undefined> {
        const adapters: Record<string, string | undefined> = {};
        for (const [providerId, config] of this.providers) {
            adapters[providerId] = config.request_format;
        }
        return adapters;
    }

    buildHeaders(providerId: string, apiKey: string): Record<string, string> {
        const provider = this.getProvider(providerId);
        if (!provider || !provider.headers) {
            return {};
        }

        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(provider.headers)) {
            headers[key] = value.replace('{{api_key}}', apiKey);
        }
        return headers;
    }

    // Reload configs (useful for development/testing)
    reload(): void {
        this.providers.clear();
        this.loadProviders();
    }
}

export default new ProviderConfigLoader();