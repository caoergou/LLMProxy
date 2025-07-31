import { ApiKeyData } from '../types';
declare class ApiKeyModel {
    static getAll(): Promise<ApiKeyData[]>;
    static getById(id: number): Promise<ApiKeyData | null>;
    static getActiveByProvider(provider: string): Promise<ApiKeyData[]>;
    static create(keyData: Omit<ApiKeyData, 'id' | 'created_at' | 'updated_at'>): Promise<ApiKeyData>;
    static update(id: number, keyData: Partial<ApiKeyData>): Promise<{
        changes: number;
    }>;
    static delete(id: number): Promise<{
        changes: number;
    }>;
    static updateQuota(id: number, remainingQuota: number): Promise<{
        changes: number;
    }>;
}
export default ApiKeyModel;
//# sourceMappingURL=ApiKey.d.ts.map