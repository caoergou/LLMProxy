"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApiKey_1 = __importDefault(require("../models/ApiKey"));
const ApiCall_1 = __importDefault(require("../models/ApiCall"));
const OpenAIUnifiedService_1 = __importDefault(require("../services/OpenAIUnifiedService"));
const ModelRegistry_1 = __importDefault(require("../services/ModelRegistry"));
const ModelAggregationService_1 = __importDefault(require("../services/ModelAggregationService"));
const ProviderConfigLoader_1 = __importDefault(require("../utils/ProviderConfigLoader"));
const router = (0, express_1.Router)();
// API Keys management
router.get('/keys', async (req, res) => {
    try {
        const keys = await ApiKey_1.default.getAll();
        res.json({ success: true, data: keys });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/keys', async (req, res) => {
    try {
        const newKey = await ApiKey_1.default.create(req.body);
        res.json({ success: true, data: newKey });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.put('/keys/:id', async (req, res) => {
    try {
        const result = await ApiKey_1.default.update(parseInt(req.params.id), req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.delete('/keys/:id', async (req, res) => {
    try {
        const result = await ApiKey_1.default.delete(parseInt(req.params.id));
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Provider templates - updated to use config loader
router.get('/providers', async (req, res) => {
    try {
        const providers = ProviderConfigLoader_1.default.getAllProviders();
        res.json({ success: true, data: providers });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get provider capabilities and supported models
router.get('/providers/capabilities', async (req, res) => {
    try {
        const providers = ProviderConfigLoader_1.default.getAllProviders();
        const capabilities = providers.map(provider => {
            const models = ModelRegistry_1.default.getDetailedModels(provider.provider);
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ========================================
// OpenAI-Compliant Unified Endpoints
// ========================================
// Primary chat completions endpoint - fully OpenAI compatible with streaming support
router.post('/v1/chat/completions', async (req, res) => {
    try {
        const openaiRequest = req.body;
        const preferredProvider = req.query.provider;
        // Check if streaming is requested
        if (openaiRequest.stream) {
            const result = await OpenAIUnifiedService_1.default.chatCompletionsStream(openaiRequest, res, {
                preferredProvider
            });
            if (!result.success && result.error) {
                if (!res.headersSent) {
                    const status = result.error?.error?.type === 'invalid_request_error' ? 400 : 500;
                    res.status(status).json(result.error);
                }
            }
            // For streaming, response is handled in the service method
        }
        else {
            const result = await OpenAIUnifiedService_1.default.chatCompletions(openaiRequest, {
                preferredProvider
            });
            if (result.success) {
                res.json(result.data);
            }
            else {
                const status = result.error?.error?.type === 'invalid_request_error' ? 400 : 500;
                res.status(status).json(result.error);
            }
        }
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                error: {
                    message: error.message,
                    type: 'server_error'
                }
            });
        }
    }
});
// Get available models - OpenAI compatible
router.get('/v1/models', async (req, res) => {
    try {
        const result = await OpenAIUnifiedService_1.default.getModels();
        if (result.success) {
            res.json(result.data);
        }
        else {
            res.status(500).json({
                error: {
                    message: result.error,
                    type: 'server_error'
                }
            });
        }
    }
    catch (error) {
        res.status(500).json({
            error: {
                message: error.message,
                type: 'server_error'
            }
        });
    }
});
// Get specific model information - OpenAI compatible
router.get('/v1/models/:model', async (req, res) => {
    try {
        const modelId = req.params.model;
        const result = await OpenAIUnifiedService_1.default.getModel(modelId);
        if (result.success) {
            res.json(result.data);
        }
        else {
            const status = result.error?.error?.type === 'invalid_request_error' ? 404 : 500;
            res.status(status).json(result.error);
        }
    }
    catch (error) {
        res.status(500).json({
            error: {
                message: error.message,
                type: 'server_error'
            }
        });
    }
});
// Get detailed model information with capabilities (extension)
router.get('/v1/models/detailed', async (req, res) => {
    try {
        const provider = req.query.provider;
        const result = await OpenAIUnifiedService_1.default.getDetailedModels(provider);
        if (result.success) {
            res.json(result.data);
        }
        else {
            res.status(500).json({
                error: {
                    message: result.error,
                    type: 'server_error'
                }
            });
        }
    }
    catch (error) {
        res.status(500).json({
            error: {
                message: error.message,
                type: 'server_error'
            }
        });
    }
});
// ========================================
// Legacy and Administrative Endpoints
// ========================================
// Statistics and monitoring
router.get('/stats', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const stats = await ApiCall_1.default.getStats(timeRange);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/calls/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const calls = await ApiCall_1.default.getRecentCalls(limit);
        res.json({ success: true, data: calls });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/usage/endpoints', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const usage = await ApiCall_1.default.getUsageByEndpoint(timeRange);
        res.json({ success: true, data: usage });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// New enhanced analytics endpoints
router.get('/analytics/performance', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const metrics = await ApiCall_1.default.getPerformanceMetrics(timeRange);
        res.json({ success: true, data: metrics });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/analytics/tokens', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const stats = await ApiCall_1.default.getTokenUsageStats(timeRange);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/analytics/hourly', async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const metrics = await ApiCall_1.default.getHourlyMetrics(hours);
        res.json({ success: true, data: metrics });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Health check
router.get('/health', (req, res) => {
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
router.get('/models-view', async (req, res) => {
    try {
        const { reasoning, function_calling, vision, code_generation, multimodal, streaming, min_context_length, search } = req.query;
        let families = ModelAggregationService_1.default.getModelFamilies();
        // Apply search filter
        if (search) {
            families = ModelAggregationService_1.default.searchModelFamilies(search);
        }
        // Apply capability filters
        const capabilities = {};
        if (reasoning === 'true')
            capabilities.reasoning = true;
        if (function_calling === 'true')
            capabilities.function_calling = true;
        if (vision === 'true')
            capabilities.vision = true;
        if (code_generation === 'true')
            capabilities.code_generation = true;
        if (multimodal === 'true')
            capabilities.multimodal = true;
        if (streaming === 'true')
            capabilities.streaming = true;
        if (min_context_length)
            capabilities.context_length = parseInt(min_context_length);
        if (Object.keys(capabilities).length > 0) {
            families = ModelAggregationService_1.default.filterByCapabilities(capabilities);
        }
        res.json({ success: true, data: families });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get specific model family details
router.get('/models-view/:family', async (req, res) => {
    try {
        const family = req.params.family;
        const familyInfo = ModelAggregationService_1.default.getModelFamily(family);
        if (!familyInfo) {
            res.status(404).json({
                success: false,
                error: `Model family '${family}' not found`
            });
            return;
        }
        res.json({ success: true, data: familyInfo });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get providers for a specific model family
router.get('/models-view/:family/providers', async (req, res) => {
    try {
        const family = req.params.family;
        const { sort_by = 'price', // price, performance, availability
        order = 'asc' // asc, desc
         } = req.query;
        const providers = ModelAggregationService_1.default.getProvidersForFamily(family);
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get best provider recommendation for a model family
router.get('/models-view/:family/best-provider', async (req, res) => {
    try {
        const family = req.params.family;
        const { criteria = 'price' // price, performance, availability
         } = req.query;
        const criteriaMap = {
            price: { prioritizePrice: true },
            performance: { prioritizePerformance: true },
            availability: { prioritizeAvailability: true }
        };
        const selectedCriteria = criteriaMap[criteria] || criteriaMap.price;
        const bestProvider = ModelAggregationService_1.default.getBestProvider(family, selectedCriteria);
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
                criteria: criteria
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=api.js.map