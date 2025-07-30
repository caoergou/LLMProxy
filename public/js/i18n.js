// Simple i18n implementation
class I18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'zh';
        this.translations = {};
        this.loadTranslations();
    }

    loadTranslations() {
        this.translations = {
            zh: {
                // Header
                'app.title': 'API Proxy 管理面板',
                'app.description': '统一接口管理，集中加密管理多平台 API 密钥，智能选择最优 API',
                
                // Navigation tabs
                'nav.dashboard': '仪表板',
                'nav.keys': 'API 密钥',
                'nav.logs': '调用日志',
                'nav.settings': '设置',
                
                // Dashboard
                'dashboard.recent_calls': '最近调用',
                'dashboard.loading_stats': '加载统计数据中...',
                'dashboard.loading_calls': '加载最近调用记录中...',
                'dashboard.no_data': '暂无统计数据',
                'dashboard.no_calls': '暂无调用记录',
                'stats.total_calls': '总调用次数',
                'stats.total_cost': '总成本',
                'stats.avg_response_time': '平均响应时间',
                'stats.success_rate': '成功率',
                
                // API Keys
                'keys.title': 'API 密钥管理',
                'keys.add': '添加密钥',
                'keys.loading': '加载 API 密钥中...',
                'keys.no_keys': '暂无 API 密钥',
                'keys.name': '名称',
                'keys.provider': '提供商',
                'keys.cost_per_request': '成本/次',
                'keys.remaining_quota': '剩余额度',
                'keys.status': '状态',
                'keys.actions': '操作',
                'keys.active': '启用',
                'keys.inactive': '禁用',
                'keys.edit': '编辑',
                'keys.delete': '删除',
                'keys.unlimited': '无限制',
                
                // Key Modal
                'modal.add_key': '添加 API 密钥',
                'modal.edit_key': '编辑 API 密钥',
                'modal.provider': '提供商',
                'modal.select_provider': '选择提供商',
                'modal.key_name': '名称',
                'modal.key_name_placeholder': '为此密钥命名',
                'modal.api_key': 'API 密钥',
                'modal.api_key_placeholder': '输入 API 密钥',
                'modal.api_secret': 'API Secret',
                'modal.api_secret_placeholder': '输入 API Secret（如需要）',
                'modal.base_url': '基础 URL',
                'modal.base_url_placeholder': 'API 基础地址',
                'modal.cost_per_request': '每次调用成本',
                'modal.remaining_quota': '剩余额度',
                'modal.remaining_quota_placeholder': '-1 表示无限制',
                'modal.total_quota': '总额度',
                'modal.total_quota_placeholder': '-1 表示无限制',
                'modal.enable_key': '启用此密钥',
                'modal.cancel': '取消',
                'modal.save': '保存',
                
                // Logs
                'logs.title': '调用日志',
                'logs.time_range.1h': '最近 1 小时',
                'logs.time_range.24h': '最近 24 小时',
                'logs.time_range.7d': '最近 7 天',
                'logs.time_range.30d': '最近 30 天',
                'logs.loading': '加载调用日志中...',
                'logs.time': '时间',
                'logs.provider': '提供商',
                'logs.api_name': 'API 名称',
                'logs.endpoint': '端点',
                'logs.status': '状态',
                'logs.response_time': '响应时间',
                'logs.cost': '成本',
                
                // Settings
                'settings.title': '系统设置',
                'settings.server_port': '服务端口',
                'settings.server_port_note': '重启服务生效',
                'settings.encryption_key': '加密密钥',
                'settings.encryption_key_placeholder': '用于加密存储的密钥',
                'settings.encryption_key_note': '修改后需要重新配置所有 API 密钥',
                'settings.usage_title': '使用说明',
                'settings.unified_api': '统一接口调用：',
                'settings.unified_api_note': '支持的 provider: openai, anthropic, azure',
                'settings.proxy_api': '直接代理调用：',
                'settings.proxy_api_note': '自动选择最优 API 密钥，支持格式转换',
                'settings.language': '语言',
                
                // Messages
                'msg.loading_stats_failed': '加载统计数据失败',
                'msg.loading_keys_failed': '加载 API 密钥失败',
                'msg.loading_calls_failed': '加载调用日志失败',
                'msg.key_added': 'API 密钥添加成功',
                'msg.key_updated': 'API 密钥更新成功',
                'msg.key_deleted': 'API 密钥删除成功',
                'msg.operation_failed': '操作失败',
                'msg.delete_confirm': '确定要删除这个 API 密钥吗？',
                
                // Language selector
                'lang.chinese': '中文',
                'lang.english': 'English'
            },
            en: {
                // Header
                'app.title': 'API Proxy Management Panel',
                'app.description': 'Unified interface management, centralized encrypted management of multi-platform API keys, intelligent selection of optimal API',
                
                // Navigation tabs
                'nav.dashboard': 'Dashboard',
                'nav.keys': 'API Keys',
                'nav.logs': 'Call Logs',
                'nav.settings': 'Settings',
                
                // Dashboard
                'dashboard.recent_calls': 'Recent Calls',
                'dashboard.loading_stats': 'Loading statistics...',
                'dashboard.loading_calls': 'Loading recent call records...',
                'dashboard.no_data': 'No statistical data',
                'dashboard.no_calls': 'No call records',
                'stats.total_calls': 'Total Calls',
                'stats.total_cost': 'Total Cost',
                'stats.avg_response_time': 'Average Response Time',
                'stats.success_rate': 'Success Rate',
                
                // API Keys
                'keys.title': 'API Key Management',
                'keys.add': 'Add Key',
                'keys.loading': 'Loading API keys...',
                'keys.no_keys': 'No API keys',
                'keys.name': 'Name',
                'keys.provider': 'Provider',
                'keys.cost_per_request': 'Cost/Request',
                'keys.remaining_quota': 'Remaining Quota',
                'keys.status': 'Status',
                'keys.actions': 'Actions',
                'keys.active': 'Active',
                'keys.inactive': 'Inactive',
                'keys.edit': 'Edit',
                'keys.delete': 'Delete',
                'keys.unlimited': 'Unlimited',
                
                // Key Modal
                'modal.add_key': 'Add API Key',
                'modal.edit_key': 'Edit API Key',
                'modal.provider': 'Provider',
                'modal.select_provider': 'Select Provider',
                'modal.key_name': 'Name',
                'modal.key_name_placeholder': 'Name this key',
                'modal.api_key': 'API Key',
                'modal.api_key_placeholder': 'Enter API key',
                'modal.api_secret': 'API Secret',
                'modal.api_secret_placeholder': 'Enter API Secret (if required)',
                'modal.base_url': 'Base URL',
                'modal.base_url_placeholder': 'API base address',
                'modal.cost_per_request': 'Cost per Request',
                'modal.remaining_quota': 'Remaining Quota',
                'modal.remaining_quota_placeholder': '-1 means unlimited',
                'modal.total_quota': 'Total Quota',
                'modal.total_quota_placeholder': '-1 means unlimited',
                'modal.enable_key': 'Enable this key',
                'modal.cancel': 'Cancel',
                'modal.save': 'Save',
                
                // Logs
                'logs.title': 'Call Logs',
                'logs.time_range.1h': 'Last 1 hour',
                'logs.time_range.24h': 'Last 24 hours',
                'logs.time_range.7d': 'Last 7 days',
                'logs.time_range.30d': 'Last 30 days',
                'logs.loading': 'Loading call logs...',
                'logs.time': 'Time',
                'logs.provider': 'Provider',
                'logs.api_name': 'API Name',
                'logs.endpoint': 'Endpoint',
                'logs.status': 'Status',
                'logs.response_time': 'Response Time',
                'logs.cost': 'Cost',
                
                // Settings
                'settings.title': 'System Settings',
                'settings.server_port': 'Server Port',
                'settings.server_port_note': 'Restart service to take effect',
                'settings.encryption_key': 'Encryption Key',
                'settings.encryption_key_placeholder': 'Key for encrypted storage',
                'settings.encryption_key_note': 'All API keys need to be reconfigured after modification',
                'settings.usage_title': 'Usage Instructions',
                'settings.unified_api': 'Unified API Call:',
                'settings.unified_api_note': 'Supported providers: openai, anthropic, azure',
                'settings.proxy_api': 'Direct Proxy Call:',
                'settings.proxy_api_note': 'Automatically select optimal API key, supports format conversion',
                'settings.language': 'Language',
                
                // Messages
                'msg.loading_stats_failed': 'Failed to load statistics',
                'msg.loading_keys_failed': 'Failed to load API keys',
                'msg.loading_calls_failed': 'Failed to load call logs',
                'msg.key_added': 'API key added successfully',
                'msg.key_updated': 'API key updated successfully',
                'msg.key_deleted': 'API key deleted successfully',
                'msg.operation_failed': 'Operation failed',
                'msg.delete_confirm': 'Are you sure you want to delete this API key?',
                
                // Language selector
                'lang.chinese': '中文',
                'lang.english': 'English'
            }
        };
    }

    t(key, params = {}) {
        let translation = this.translations[this.currentLanguage]?.[key] || this.translations['zh'][key] || key;
        
        // Simple parameter replacement
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{{${param}}}`, params[param]);
        });
        
        return translation;
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        this.updateDOM();
        
        // Update HTML lang attribute
        document.documentElement.lang = lang;
    }

    updateDOM() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });

        // Update all elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Update all elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Update page title
        const titleElement = document.querySelector('title');
        if (titleElement) {
            titleElement.textContent = this.t('app.title');
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Global i18n instance
window.i18n = new I18n();