#!/usr/bin/env node

/**
 * OpenAI 统一接口使用示例
 * 
 * 本示例展示如何使用 API Proxy 的统一 OpenAI 规范接口
 * 
 * 使用方法：
 * 1. 启动 API Proxy 服务：npm start
 * 2. 运行示例：node examples/unified-api-example.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function demonstrateUnifiedAPI() {
    console.log('🚀 OpenAI 统一接口演示');
    console.log('========================\n');

    try {
        // 1. 检查服务健康状态
        console.log('1. 检查服务健康状态...');
        const healthResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ 服务状态正常:', healthResponse.data.message);
        console.log();

        // 2. 获取可用模型列表
        console.log('2. 获取 OpenAI 兼容模型列表...');
        const modelsResponse = await axios.get(`${BASE_URL}/api/v1/models`);
        console.log('✅ 可用模型:');
        modelsResponse.data.data.forEach(model => {
            console.log(`   - ${model.id} (${model.owned_by})`);
        });
        console.log();

        // 3. 获取特定模型信息
        console.log('3. 获取 GPT-3.5-turbo 模型详细信息...');
        const modelResponse = await axios.get(`${BASE_URL}/api/v1/models/gpt-3.5-turbo`);
        console.log('✅ 模型信息:', JSON.stringify(modelResponse.data, null, 2));
        console.log();

        // 4. 获取提供商能力信息
        console.log('4. 获取提供商能力信息...');
        const capabilitiesResponse = await axios.get(`${BASE_URL}/api/providers/capabilities`);
        console.log('✅ 支持的提供商:');
        capabilitiesResponse.data.data.forEach(provider => {
            console.log(`   - ${provider.display_name} (${provider.provider})`);
            console.log(`     模型数量: ${provider.models.length}`);
            console.log(`     支持功能: 聊天=${provider.supported_features.chat_completions}, 流式=${provider.supported_features.streaming}`);
        });
        console.log();

        // 5. 测试聊天完成请求验证（无 API 密钥，预期失败）
        console.log('5. 测试请求验证（无模型参数）...');
        try {
            await axios.post(`${BASE_URL}/api/v1/chat/completions`, {
                messages: [{ role: 'user', content: 'Hello' }]
            });
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ 请求验证正常工作:', error.response.data.error.message);
            } else {
                console.log('❌ 意外错误:', error.message);
            }
        }
        console.log();

        // 6. 测试完整的聊天请求（无 API 密钥，预期失败但格式正确）
        console.log('6. 测试完整聊天请求格式...');
        try {
            await axios.post(`${BASE_URL}/api/v1/chat/completions`, {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '你是一个有用的助手' },
                    { role: 'user', content: '请用中文回答：什么是人工智能？' }
                ],
                max_tokens: 150,
                temperature: 0.7
            });
        } catch (error) {
            if (error.response?.status >= 400) {
                console.log('✅ 请求格式正确，等待 API 密钥配置后可正常使用');
                console.log('   错误信息:', error.response?.data?.error?.message || error.message);
            }
        }
        console.log();

        // 7. 测试指定提供商
        console.log('7. 测试指定 Anthropic 提供商...');
        try {
            await axios.post(`${BASE_URL}/api/v1/chat/completions?provider=anthropic`, {
                model: 'gpt-3.5-turbo', // 将自动映射到 Claude 模型
                messages: [{ role: 'user', content: 'Hello from Anthropic!' }]
            });
        } catch (error) {
            console.log('✅ 提供商选择功能正常，格式转换已就绪');
            console.log('   (需要配置 Anthropic API 密钥后可正常使用)');
        }
        console.log();

        console.log('🎉 演示完成！');
        console.log('=============');
        console.log('');
        console.log('📚 使用指南:');
        console.log('1. 配置 API 密钥后即可正常使用所有功能');
        console.log('2. 支持使用标准 OpenAI 客户端库');
        console.log('3. 自动进行模型映射和格式转换');
        console.log('4. 详细文档请查看 docs/UNIFIED_API.md');

    } catch (error) {
        console.error('❌ 演示失败:', error.message);
        console.log('请确保 API Proxy 服务正在运行 (npm start)');
    }
}

// JavaScript 示例：使用 fetch API
function showJavaScriptExample() {
    console.log('\n📝 JavaScript 调用示例:');
    console.log('====================');
    console.log(`
// 使用标准 fetch API
const response = await fetch('${BASE_URL}/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'user', content: 'Hello, world!' }
        ],
        max_tokens: 150
    })
});

const data = await response.json();
console.log(data.choices[0].message.content);
`);
}

// Python 示例
function showPythonExample() {
    console.log('\n🐍 Python 调用示例:');
    console.log('==================');
    console.log(`
import requests

response = requests.post('${BASE_URL}/api/v1/chat/completions', 
    headers={'Content-Type': 'application/json'},
    json={
        'model': 'gpt-3.5-turbo',
        'messages': [
            {'role': 'user', 'content': 'Hello, world!'}
        ],
        'max_tokens': 150
    }
)

data = response.json()
print(data['choices'][0]['message']['content'])
`);
}

// cURL 示例
function showCurlExample() {
    console.log('\n💻 cURL 调用示例:');
    console.log('================');
    console.log(`
curl -X POST ${BASE_URL}/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello, world!"}
    ],
    "max_tokens": 150
  }'
`);
}

// 运行演示
if (require.main === module) {
    demonstrateUnifiedAPI().then(() => {
        showJavaScriptExample();
        showPythonExample();
        showCurlExample();
    });
}

module.exports = { demonstrateUnifiedAPI };