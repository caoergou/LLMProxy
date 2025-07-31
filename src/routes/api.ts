import { Router, Request, Response } from 'express';
import ApiKeyModel from '../models/ApiKey';
import ApiCallModel from '../models/ApiCall';
import ProxyService from '../services/ProxyService';
import OpenAIUnifiedService from '../services/OpenAIUnifiedService';
import ModelRegistry from '../services/ModelRegistry';
import ModelAggregationService from '../services/ModelAggregationService';
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



// ========================================
// OpenAI-Compliant Unified Endpoints
// ========================================

// Primary chat completions endpoint - fully OpenAI compatible with streaming support
router.post('/v1/chat/completions', async (req: Request, res: Response) => {
    try {
        const openaiRequest = req.body;
        const preferredProvider = req.query.provider as string;
        
        // Check if streaming is requested
        if (openaiRequest.stream) {
            const result = await OpenAIUnifiedService.chatCompletionsStream(openaiRequest, res, {
                preferredProvider
            });
            
            if (!result.success && result.error) {
                if (!res.headersSent) {
                    const status = result.error?.error?.type === 'invalid_request_error' ? 400 : 500;
                    res.status(status).json(result.error);
                }
            }
            // For streaming, response is handled in the service method
        } else {
            const result = await OpenAIUnifiedService.chatCompletions(openaiRequest, {
                preferredProvider
            });
            
            if (result.success) {
                res.json(result.data);
            } else {
                const status = result.error?.error?.type === 'invalid_request_error' ? 400 : 500;
                res.status(status).json(result.error);
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                error: {
                    message: (error as Error).message,
                    type: 'server_error'
                }
            });
        }
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

// New enhanced analytics endpoints
router.get('/analytics/performance', async (req: Request, res: Response) => {
    try {
        const timeRange = (req.query.timeRange as TimeRange) || '24h';
        const metrics = await ApiCallModel.getPerformanceMetrics(timeRange);
        res.json({ success: true, data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

router.get('/analytics/tokens', async (req: Request, res: Response) => {
    try {
        const timeRange = (req.query.timeRange as TimeRange) || '24h';
        const stats = await ApiCallModel.getTokenUsageStats(timeRange);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

router.get('/analytics/hourly', async (req: Request, res: Response) => {
    try {
        const hours = parseInt(req.query.hours as string) || 24;
        const metrics = await ApiCallModel.getHourlyMetrics(hours);
        res.json({ success: true, data: metrics });
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

// ========================================
// Model-Centric View Endpoints
// ========================================

// Get models-view - model-centric listing
router.get('/models-view', async (req: Request, res: Response) => {
    try {
        const { 
            reasoning, 
            function_calling, 
            vision, 
            code_generation, 
            multimodal, 
            streaming,
            min_context_length,
            search
        } = req.query;

        let families = ModelAggregationService.getModelFamilies();

        // Apply search filter
        if (search) {
            families = ModelAggregationService.searchModelFamilies(search as string);
        }

        // Apply capability filters
        const capabilities: any = {};
        if (reasoning === 'true') capabilities.reasoning = true;
        if (function_calling === 'true') capabilities.function_calling = true;
        if (vision === 'true') capabilities.vision = true;
        if (code_generation === 'true') capabilities.code_generation = true;
        if (multimodal === 'true') capabilities.multimodal = true;
        if (streaming === 'true') capabilities.streaming = true;
        if (min_context_length) capabilities.context_length = parseInt(min_context_length as string);

        if (Object.keys(capabilities).length > 0) {
            families = ModelAggregationService.filterByCapabilities(capabilities);
        }

        res.json({ success: true, data: families });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Get specific model family details
router.get('/models-view/:family', async (req: Request, res: Response) => {
    try {
        const family = req.params.family;
        const familyInfo = ModelAggregationService.getModelFamily(family);
        
        if (!familyInfo) {
            res.status(404).json({ 
                success: false, 
                error: `Model family '${family}' not found` 
            });
            return;
        }

        res.json({ success: true, data: familyInfo });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Get providers for a specific model family
router.get('/models-view/:family/providers', async (req: Request, res: Response) => {
    try {
        const family = req.params.family;
        const { 
            sort_by = 'price',  // price, performance, availability
            order = 'asc'       // asc, desc
        } = req.query;

        const providers = ModelAggregationService.getProvidersForFamily(family);
        
        if (providers.length === 0) {
            res.status(404).json({ 
                success: false, 
                error: `No providers found for model family '${family}'` 
            });
            return;
        }

        // Sort providers based on criteria
        let sortedProviders = [...providers];
        
        switch (sort_by) {
            case 'price':
                sortedProviders.sort((a, b) => {
                    const compare = a.pricing.input_price - b.pricing.input_price;
                    return order === 'desc' ? -compare : compare;
                });
                break;
            case 'performance':
                sortedProviders.sort((a, b) => {
                    const compare = a.performance.avg_response_time - b.performance.avg_response_time;
                    return order === 'desc' ? -compare : compare;
                });
                break;
            case 'availability':
                sortedProviders.sort((a, b) => {
                    const compare = a.performance.availability - b.performance.availability;
                    return order === 'desc' ? -compare : compare;
                });
                break;
        }

        res.json({ 
            success: true, 
            data: {
                family,
                providers: sortedProviders,
                sort_by,
                order
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

// Get best provider recommendation for a model family
router.get('/models-view/:family/best-provider', async (req: Request, res: Response) => {
    try {
        const family = req.params.family;
        const { 
            criteria = 'price'  // price, performance, availability
        } = req.query;

        const criteriaMap = {
            price: { prioritizePrice: true },
            performance: { prioritizePerformance: true },
            availability: { prioritizeAvailability: true }
        };

        const selectedCriteria = criteriaMap[criteria as keyof typeof criteriaMap] || criteriaMap.price;
        const bestProvider = ModelAggregationService.getBestProvider(family, selectedCriteria);
        
        if (!bestProvider) {
            res.status(404).json({ 
                success: false, 
                error: `No providers found for model family '${family}'` 
            });
            return;
        }

        res.json({ 
            success: true, 
            data: {
                family,
                recommended_provider: bestProvider,
                criteria: criteria as string
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

export default router;