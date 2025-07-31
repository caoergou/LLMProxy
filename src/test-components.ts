import ModelRegistry from './services/ModelRegistry';
import { FormatAdapterFactory } from './services/FormatAdapter';
import ProviderConfigLoader from './utils/ProviderConfigLoader';

console.log('🧪 Testing OpenAI Unified Service Components');
console.log('============================================\n');

// Test ModelRegistry
console.log('1. Testing Model Registry...');
try {
  const models = ModelRegistry.getOpenAIModels();
  console.log(`✅ Found ${models.length} OpenAI models`);
  
  const gpt35 = ModelRegistry.getModelByOpenAIId('gpt-3.5-turbo');
  if (gpt35) {
    console.log(`✅ GPT-3.5-turbo model found: ${gpt35.display_name}`);
  } else {
    console.log('❌ GPT-3.5-turbo model not found');
  }
  
  const supportsChat = ModelRegistry.validateCapability('gpt-3.5-turbo', 'supports_chat');
  console.log(`✅ GPT-3.5-turbo supports chat: ${supportsChat}`);
  
  const providers = ModelRegistry.getProvidersForModel('gpt-3.5-turbo');
  console.log(`✅ Providers for GPT-3.5-turbo: ${providers.join(', ')}`);
  
} catch (error) {
  console.log('❌ ModelRegistry test failed:', (error as Error).message);
}

console.log('\n2. Testing Format Adapters...');
try {
  const supportedProviders = FormatAdapterFactory.getSupportedProviders();
  console.log(`✅ Supported providers: ${supportedProviders.join(', ')}`);
  
  // Test OpenAI adapter
  const openaiConfig = ProviderConfigLoader.getProvider('openai');
  if (openaiConfig) {
    const openaiAdapter = FormatAdapterFactory.getAdapter('openai', openaiConfig);
    if (openaiAdapter) {
      console.log('✅ OpenAI adapter created successfully');
      
      const testRequest = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };
      
      const adaptedRequest = openaiAdapter.adaptRequest(testRequest);
      console.log('✅ OpenAI request adaptation successful');
    }
  }
  
  // Test Anthropic adapter
  const anthropicConfig = ProviderConfigLoader.getProvider('anthropic');
  if (anthropicConfig) {
    const anthropicAdapter = FormatAdapterFactory.getAdapter('anthropic', anthropicConfig);
    if (anthropicAdapter) {
      console.log('✅ Anthropic adapter created successfully');
      
      const testRequest = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };
      
      const adaptedRequest = anthropicAdapter.adaptRequest(testRequest);
      console.log('✅ Anthropic request adaptation successful');
      console.log(`   - Mapped model: ${adaptedRequest.model}`);
    }
  }
  
} catch (error) {
  console.log('❌ FormatAdapter test failed:', (error as Error).message);
}

console.log('\n3. Testing Provider Config Loader...');
try {
  const allProviders = ProviderConfigLoader.getAllProviders();
  console.log(`✅ Loaded ${allProviders.length} provider configurations`);
  
  allProviders.forEach(provider => {
    console.log(`   - ${provider.name} (${provider.provider})`);
  });
  
  const openaiHeaders = ProviderConfigLoader.buildHeaders('openai', 'test-key');
  console.log('✅ OpenAI headers built successfully');
  
} catch (error) {
  console.log('❌ ProviderConfigLoader test failed:', (error as Error).message);
}

console.log('\n4. Testing Model Mapping...');
try {
  const anthropicConfig = ProviderConfigLoader.getProvider('anthropic');
  if (anthropicConfig) {
    const adapter = FormatAdapterFactory.getAdapter('anthropic', anthropicConfig);
    if (adapter) {
      const mappedModel = adapter.mapModelName('gpt-3.5-turbo');
      console.log(`✅ GPT-3.5-turbo maps to: ${mappedModel}`);
      
      const reverseMapped = adapter.reverseMapModelName(mappedModel);
      console.log(`✅ ${mappedModel} reverse maps to: ${reverseMapped}`);
    }
  }
} catch (error) {
  console.log('❌ Model mapping test failed:', (error as Error).message);
}

console.log('\n🎉 Component testing completed!');
console.log('==================================');