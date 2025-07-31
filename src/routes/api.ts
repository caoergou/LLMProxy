import { Router, Request, Response } from 'express';
import ApiKeyModel from '../models/ApiKey';
import ApiCallModel from '../models/ApiCall';
import ProxyService from '../services/ProxyService';
import OpenAIUnifiedService from '../services/OpenAIUnifiedService';
import ModelRegistry from '../services/ModelRegistry';
import Database from '../models/Database';
import ProviderConfigLoader from '../utils/ProviderConfigLoader';
import { TimeRange } from '../types';

const router = Router();

// API Keys management
router.get('/keys', async (req: Request, res: Response) => {
    try {
        const keys = await ApiKeyModel.getAll();
        res.json({ success: true, data: keys });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

router.post('/keys', async (req: Request, res: Response) => {
    try {
        const newKey = await ApiKeyModel.create(req.body);
        res.json({ success: true, data: newKey });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

router.put('/keys/:id', async (req: Request, res: Response) => {
    try {
        const result = await ApiKeyModel.update(parseInt(req.params.id), req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

router.delete('/keys/:id', async (req: Request, res: Response) => {
    try {
        const result = await ApiKeyModel.delete(parseInt(req.params.id));
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Provider templates - updated to use config loader
router.get('/providers', async (req: Request, res: Response) => {
    try {
        const providers = ProviderConfigLoader.getAllProviders();
        res.json({ success: true, data: providers });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Get provider configurations for frontend (backward compatibility)
router.get('/provider-configs', async (req: Request, res: Response) => {
    try {
        const providers = ProviderConfigLoader.getAllProviders();
        // Return only necessary info for frontend
        const frontendProviders = providers.map(provider => ({
            provider: provider.provider,
            name: provider.name,
            display_name: provider.display_name,
            base_url: provider.base_url,
            cost_per_request: provider.cost_per_request,
            models: provider.models || [],
            icon: provider.icon || '🤖'
        }));
        res.json({ success: true, data: frontendProviders });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Get provider capabilities and supported models
router.get('/providers/capabilities', async (req: Request, res: Response) => {
    try {
        const providers = ProviderConfigLoader.getAllProviders();
        const capabilities = providers.map(provider => {
            const models = ModelRegistry.getDetailedModels(provider.provider);
            return {
                provider: provider.provider,
                name: provider.name,
                display_name: provider.display_name,
                icon: provider.icon || '🤖',
                models: models.map(model => ({
                    openai_id: model.openai_id,
                    provider_id: model.provider_id,
                    display_name: model.display_name,
                    description: model.description,
                    capabilities: model.capabilities,
                    cost_per_1k_tokens: model.cost_per_1k_tokens
                })),
                supported_features: {
                    chat_completions: models.some(m => m.capabilities.supports_chat),
                    completions: models.some(m => m.capabilities.supports_completion),
                    embeddings: models.some(m => m.capabilities.supports_embedding),
                    function_calling: models.some(m => m.capabilities.supports_function_calling),
                    streaming: models.some(m => m.capabilities.supports_streaming)
                }
            };
        });
        
        res.json({ success: true, data: capabilities });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Legacy proxy endpoint - maintained for backward compatibility
router.use('/proxy/:provider', async (req: Request, res: Response) => {
    try {
        const provider = req.params.provider;
        const endpoint = req.path.replace(`/proxy/${provider}`, ''); // Extract the path after /proxy/:provider
        const method = req.method;
        const data = req.body;
        const headers = req.headers as Record<string, string>;

        const result = await ProxyService.proxyRequest(provider, endpoint, method, data, headers);
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(result.status || 500).json({ 
                error: result.error,
                provider: result.provider,
                api_key_name: result.api_key_name
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// ========================================
// OpenAI-Compliant Unified Endpoints
// ========================================

// Primary chat completions endpoint - fully OpenAI compatible
router.post('/v1/chat/completions', async (req: Request, res: Response) => {
    try {
        const openaiRequest = req.body;
        const preferredProvider = req.query.provider as string;
        
        const result = await OpenAIUnifiedService.chatCompletions(openaiRequest, {
            preferredProvider
        });
        
        if (result.success) {
            res.json(result.data);
        } else {
            const status = result.error?.error?.type === 'invalid_request_error' ? 400 : 500;
            res.status(status).json(result.error);
        }
    } catch (error) {
        res.status(500).json({
            error: {
                message: (error as Error).message,
                type: 'server_error'
            }
        });
    }
});

// Alternative endpoint for backward compatibility
router.post('/chat/completions', async (req: Request, res: Response) => {
    try {
        const openaiRequest = req.body;
        const preferredProvider = req.query.provider as string;
        
        const result = await OpenAIUnifiedService.chatCompletions(openaiRequest, {
            preferredProvider
        });
        
        if (result.success) {
            res.json(result.data);
        } else {
            const status = result.error?.error?.type === 'invalid_request_error' ? 400 : 500;
            res.status(status).json(result.error);
        }
    } catch (error) {
        res.status(500).json({
            error: {
                message: (error as Error).message,
                type: 'server_error'
            }
        });
    }
});

// Get available models - OpenAI compatible
router.get('/v1/models', async (req: Request, res: Response) => {
    try {
        const result = await OpenAIUnifiedService.getModels();
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({
                error: {
                    message: result.error,
                    type: 'server_error'
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            error: {
                message: (error as Error).message,
                type: 'server_error'
            }
        });
    }
});

// Alternative endpoint for backward compatibility
router.get('/models', async (req: Request, res: Response) => {
    try {
        const result = await OpenAIUnifiedService.getModels();
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({
                error: {
                    message: result.error,
                    type: 'server_error'
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            error: {
                message: (error as Error).message,
                type: 'server_error'
            }
        });
    }
});

// Get specific model information - OpenAI compatible
router.get('/v1/models/:model', async (req: Request, res: Response) => {
    try {
        const modelId = req.params.model;
        const result = await OpenAIUnifiedService.getModel(modelId);
        
        if (result.success) {
            res.json(result.data);
        } else {
            const status = result.error?.error?.type === 'invalid_request_error' ? 404 : 500;
            res.status(status).json(result.error);
        }
    } catch (error) {
        res.status(500).json({
            error: {
                message: (error as Error).message,
                type: 'server_error'
            }
        });
    }
});

// Get detailed model information with capabilities (extension)
router.get('/v1/models/detailed', async (req: Request, res: Response) => {
    try {
        const provider = req.query.provider as string;
        const result = await OpenAIUnifiedService.getDetailedModels(provider);
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({
                error: {
                    message: result.error,
                    type: 'server_error'
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            error: {
                message: (error as Error).message,
                type: 'server_error'
            }
        });
    }
});

// ========================================
// Legacy and Administrative Endpoints
// ========================================

// Statistics and monitoring
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const timeRange = (req.query.timeRange as TimeRange) || '24h';
        const stats = await ApiCallModel.getStats(timeRange);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

router.get('/calls/recent', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const calls = await ApiCallModel.getRecentCalls(limit);
        res.json({ success: true, data: calls });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

router.get('/usage/endpoints', async (req: Request, res: Response) => {
    try {
        const timeRange = (req.query.timeRange as TimeRange) || '24h';
        const usage = await ApiCallModel.getUsageByEndpoint(timeRange);
        res.json({ success: true, data: usage });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
    res.json({ 
        success: true, 
        message: 'API Proxy is healthy',
        timestamp: new Date().toISOString()
    });
});

export default router;