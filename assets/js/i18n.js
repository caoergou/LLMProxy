// Internationalization (i18n) Module
class I18n {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = {
      en: {
        // Navigation
        'page-title': 'LLM Proxy - Unified AI API Management',
        
        // Hero Section
        'hero-title': 'Unified AI API Management',
        'hero-subtitle': 'Lightweight local service providing unified interface for multiple AI providers with encrypted key management and intelligent API selection.',
        'btn-download': 'Download',
        'btn-learn-more': 'Learn More',
        
        // Features Section
        'features-title': 'Key Features',
        'features-subtitle': 'Everything you need to manage multiple AI APIs efficiently',
        
        'feature-unified-title': 'Unified OpenAI Interface',
        'feature-unified-desc': 'Fully compatible with OpenAI API, supports official client libraries',
        
        'feature-smart-title': 'Intelligent Provider Selection',
        'feature-smart-desc': 'Automatically selects optimal API keys based on cost, quota, and response time',
        
        'feature-mapping-title': 'Transparent Model Mapping',
        'feature-mapping-desc': 'Automatically maps OpenAI models to corresponding models from different providers',
        
        'feature-security-title': 'Encrypted Storage',
        'feature-security-desc': 'Local encrypted storage of API keys for maximum security',
        
        'feature-monitoring-title': 'Real-time Monitoring',
        'feature-monitoring-desc': 'Track API call statistics, costs, and performance metrics',
        
        'feature-desktop-title': 'Desktop Application',
        'feature-desktop-desc': 'Cross-platform desktop app based on Tauri with excellent performance',
        
        // Providers Section
        'providers-title': 'Supported AI Providers',
        'providers-subtitle': 'Connect to leading AI services through a single interface',
        
        // Download Section
        'download-title': 'Get Started',
        'download-subtitle': 'Choose your preferred installation method',
        'download-recommended': 'Recommended',
        
        'download-desktop-title': 'Desktop Application',
        'download-desktop-desc': 'Cross-platform desktop app that automatically manages the backend service.',
        
        'download-docker-title': 'Docker',
        'download-docker-desc': 'Quick deployment with Docker and docker-compose.',
        
        'download-manual-title': 'Manual Installation',
        'download-manual-desc': 'Traditional Node.js installation for development or custom setups.',
        
        // Usage Section
        'usage-title': 'Usage Examples',
        'usage-subtitle': 'Get started with these simple examples',
        
        // Footer
        'footer-description': 'Unified AI API management made simple.',
        'footer-links-title': 'Links',
        'footer-github': 'GitHub',
        'footer-releases': 'Releases',
        'footer-docs': 'Documentation',
        'footer-issues': 'Issues',
        'footer-community-title': 'Community',
        'footer-contributing': 'Contributing',
        'footer-discussions': 'Discussions',
        'footer-copyright': '© 2024 LLM Proxy. Licensed under MIT License.'
      },
      zh: {
        // Navigation
        'page-title': 'LLM Proxy - 统一 AI API 管理',
        
        // Hero Section
        'hero-title': '统一 AI API 管理',
        'hero-subtitle': '轻量级本地服务，提供统一接口供多个 AI 服务商调用，具备加密密钥管理和智能 API 选择功能。',
        'btn-download': '立即下载',
        'btn-learn-more': '了解更多',
        
        // Features Section
        'features-title': '核心特性',
        'features-subtitle': '高效管理多个 AI API 所需的一切功能',
        
        'feature-unified-title': '统一 OpenAI 接口',
        'feature-unified-desc': '完全兼容 OpenAI API，支持官方客户端库',
        
        'feature-smart-title': '智能提供商选择',
        'feature-smart-desc': '基于成本、额度和响应时间自动选择最优 API 密钥',
        
        'feature-mapping-title': '透明模型映射',
        'feature-mapping-desc': '自动将 OpenAI 模型映射到不同提供商的对应模型',
        
        'feature-security-title': '加密存储',
        'feature-security-desc': '本地加密存储 API 密钥，确保最大安全性',
        
        'feature-monitoring-title': '实时监控',
        'feature-monitoring-desc': '跟踪 API 调用统计、成本和性能指标',
        
        'feature-desktop-title': '桌面应用',
        'feature-desktop-desc': '基于 Tauri 的跨平台桌面应用，性能卓越',
        
        // Providers Section
        'providers-title': '支持的 AI 服务商',
        'providers-subtitle': '通过单一接口连接领先的 AI 服务',
        
        // Download Section
        'download-title': '快速开始',
        'download-subtitle': '选择您偏好的安装方式',
        'download-recommended': '推荐',
        
        'download-desktop-title': '桌面应用',
        'download-desktop-desc': '跨平台桌面应用，自动管理后端服务。',
        
        'download-docker-title': 'Docker',
        'download-docker-desc': '使用 Docker 和 docker-compose 快速部署。',
        
        'download-manual-title': '手动安装',
        'download-manual-desc': '适用于开发或自定义设置的传统 Node.js 安装。',
        
        // Usage Section
        'usage-title': '使用示例',
        'usage-subtitle': '通过这些简单示例快速入门',
        
        // Footer
        'footer-description': '让 AI API 统一管理变得简单。',
        'footer-links-title': '链接',
        'footer-github': 'GitHub',
        'footer-releases': '发布版本',
        'footer-docs': '文档',
        'footer-issues': '问题反馈',
        'footer-community-title': '社区',
        'footer-contributing': '贡献指南',
        'footer-discussions': '讨论',
        'footer-copyright': '© 2024 LLM Proxy. 采用 MIT 许可证。'
      }
    };
  }

  detectLanguage() {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl && this.translations[langFromUrl]) {
      return langFromUrl;
    }

    // Check localStorage
    const savedLang = localStorage.getItem('language');
    if (savedLang && this.translations[savedLang]) {
      return savedLang;
    }

    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    
    // Check for Chinese variants
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    
    // Default to English for other languages
    return 'en';
  }

  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`Language '${lang}' not supported`);
      return;
    }
    
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update document language
    document.documentElement.lang = lang;
    
    // Update page content
    this.updatePageContent();
    
    // Update URL parameter without reloading
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  translate(key) {
    const translation = this.translations[this.currentLanguage]?.[key];
    if (!translation) {
      console.warn(`Translation missing for key '${key}' in language '${this.currentLanguage}'`);
      return key;
    }
    return translation;
  }

  updatePageContent() {
    // Update all elements with IDs that match translation keys
    Object.keys(this.translations[this.currentLanguage]).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.textContent = this.translate(key);
      }
    });

    // Update page title
    document.title = this.translate('page-title');
    
    // Update language selector
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.value = this.currentLanguage;
    }
  }

  // Shorthand method
  t(key) {
    return this.translate(key);
  }
}

// Initialize i18n
const i18n = new I18n();

// Export for global use
window.i18n = i18n;