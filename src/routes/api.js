const express = require('express');
const router = express.Router();
const ApiKeyModel = require('../models/ApiKey');
const ApiCallModel = require('../models/ApiCall');
const ProxyService = require('../services/ProxyService');
const Database = require('../models/Database');
const ProviderConfigLoader = require('../utils/ProviderConfigLoader');

// API Keys management
router.get('/keys', async (req, res) => {
    try {
        const keys = await ApiKeyModel.getAll();
        res.json({ success: true, data: keys });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/keys', async (req, res) => {
    try {
        const newKey = await ApiKeyModel.create(req.body);
        res.json({ success: true, data: newKey });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/keys/:id', async (req, res) => {
    try {
        const result = await ApiKeyModel.update(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/keys/:id', async (req, res) => {
    try {
        const result = await ApiKeyModel.delete(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Provider templates - updated to use config loader
router.get('/providers', async (req, res) => {
    try {
        const providers = ProviderConfigLoader.getAllProviders();
        res.json({ success: true, data: providers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get provider configurations for frontend
router.get('/provider-configs', async (req, res) => {
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
        res.status(500).json({ success: false, error: error.message });
    }
});

// Proxy requests - handle with middleware approach
router.all('/proxy/:provider', async (req, res) => {
    try {
        const provider = req.params.provider;
        const endpoint = req.url;
        const method = req.method;
        const data = req.body;
        const headers = req.headers;

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
        res.status(500).json({ success: false, error: error.message });
    }
});

// Universal chat completion endpoint
router.post('/chat/completions', async (req, res) => {
    try {
        const data = req.body;
        const provider = req.query.provider || 'openai'; // Default to OpenAI
        
        const result = await ProxyService.proxyRequest(provider, '/chat/completions', 'POST', data, req.headers);
        
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
        res.status(500).json({ success: false, error: error.message });
    }
});

// Statistics and monitoring
router.get('/stats', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const stats = await ApiCallModel.getStats(timeRange);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/calls/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const calls = await ApiCallModel.getRecentCalls(limit);
        res.json({ success: true, data: calls });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/usage/endpoints', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const usage = await ApiCallModel.getUsageByEndpoint(timeRange);
        res.json({ success: true, data: usage });
    } catch (error) {
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

// ========= OpenAI-Compatible v1 API Endpoints =========

// Get all available models across all providers (OpenAI-compatible)
router.get('/v1/models', async (req, res) => {
    try {
        const providers = ProviderConfigLoader.getAllProviders();
        const models = [];
        
        // Aggregate all models from all providers
        for (const provider of providers) {
            if (provider.models) {
                for (const model of provider.models) {
                    models.push({
                        id: model.name,
                        object: 'model',
                        created: Date.now(),
                        owned_by: provider.provider,
                        permission: [],
                        root: model.name,
                        parent: null,
                        // Additional metadata
                        provider: provider.provider,
                        display_name: model.display_name,
                        description: model.description,
                        provider_name: provider.display_name
                    });
                }
            }
        }
        
        res.json({
            object: 'list',
            data: models
        });
    } catch (error) {
        res.status(500).json({ 
            error: {
                message: error.message,
                type: 'api_error',
                code: 'internal_server_error'
            }
        });
    }
});

// OpenAI-compatible chat completions endpoint
router.post('/v1/chat/completions', async (req, res) => {
    try {
        const data = req.body;
        
        // Determine provider based on model name
        const provider = await ProxyService.getProviderForModel(data.model);
        if (!provider) {
            return res.status(400).json({
                error: {
                    message: `Model '${data.model}' not found`,
                    type: 'invalid_request_error',
                    code: 'model_not_found'
                }
            });
        }
        
        const result = await ProxyService.proxyRequest(provider, '/chat/completions', 'POST', data, req.headers);
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(result.status || 500).json({ 
                error: {
                    message: result.error,
                    type: 'api_error',
                    code: 'provider_error',
                    provider: result.provider,
                    api_key_name: result.api_key_name
                }
            });
        }
    } catch (error) {
        res.status(500).json({ 
            error: {
                message: error.message,
                type: 'api_error',
                code: 'internal_server_error'
            }
        });
    }
});

// OpenAI-compatible completions endpoint (legacy)
router.post('/v1/completions', async (req, res) => {
    try {
        const data = req.body;
        
        // Determine provider based on model name
        const provider = await ProxyService.getProviderForModel(data.model);
        if (!provider) {
            return res.status(400).json({
                error: {
                    message: `Model '${data.model}' not found`,
                    type: 'invalid_request_error',
                    code: 'model_not_found'
                }
            });
        }
        
        const result = await ProxyService.proxyRequest(provider, '/completions', 'POST', data, req.headers);
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(result.status || 500).json({ 
                error: {
                    message: result.error,
                    type: 'api_error',
                    code: 'provider_error',
                    provider: result.provider,
                    api_key_name: result.api_key_name
                }
            });
        }
    } catch (error) {
        res.status(500).json({ 
            error: {
                message: error.message,
                type: 'api_error',
                code: 'internal_server_error'
            }
        });
    }
});

module.exports = router;