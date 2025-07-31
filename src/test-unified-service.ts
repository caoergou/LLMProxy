#!/usr/bin/env node

/**
 * Simple test script to verify the OpenAI unified service functionality
 */

import { exec } from 'child_process';
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
}

class OpenAIUnifiedServiceTester {
  private results: TestResult[] = [];
  private serverProcess: any = null;

  async runTests(): Promise<void> {
    console.log('🚀 Starting OpenAI Unified Service Tests');
    console.log('=====================================\n');

    try {
      // Start the server
      await this.startServer();
      await this.waitForServer();

      // Run tests
      await this.testHealthEndpoint();
      await this.testModelsEndpoint();
      await this.testModelDetailEndpoint();
      await this.testProviderCapabilities();
      await this.testChatCompletionsValidation();

      // Print results
      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      if (this.serverProcess) {
        this.serverProcess.kill();
      }
    }
  }

  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serverProcess = exec('npm start', { cwd: process.cwd() });
      
      this.serverProcess.stdout?.on('data', (data: string) => {
        if (data.includes('running on port')) {
          resolve();
        }
      });

      this.serverProcess.stderr?.on('data', (data: string) => {
        console.error('Server error:', data);
      });

      setTimeout(() => {
        reject(new Error('Server failed to start within timeout'));
      }, 10000);
    });
  }

  private async waitForServer(): Promise<void> {
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.get(`${BASE_URL}/api/health`);
        return;
      } catch (error) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Server not responding after retries');
  }

  private async testHealthEndpoint(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/api/health`);
      
      if (response.status === 200 && response.data.success) {
        this.results.push({
          name: 'Health Endpoint',
          success: true,
          message: 'Health endpoint returns success',
          duration: Date.now() - startTime
        });
      } else {
        throw new Error('Health endpoint returned unexpected response');
      }
    } catch (error) {
      this.results.push({
        name: 'Health Endpoint',
        success: false,
        message: (error as Error).message,
        duration: Date.now() - startTime
      });
    }
  }

  private async testModelsEndpoint(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/models`);
      
      if (response.status === 200 && 
          response.data.object === 'list' && 
          Array.isArray(response.data.data) &&
          response.data.data.length > 0) {
        
        const hasValidModel = response.data.data.some((model: any) => 
          model.id && model.object === 'model' && model.owned_by
        );
        
        if (hasValidModel) {
          this.results.push({
            name: 'Models Endpoint',
            success: true,
            message: `Found ${response.data.data.length} models`,
            duration: Date.now() - startTime
          });
        } else {
          throw new Error('Models endpoint returned invalid model format');
        }
      } else {
        throw new Error('Models endpoint returned unexpected format');
      }
    } catch (error) {
      this.results.push({
        name: 'Models Endpoint',
        success: false,
        message: (error as Error).message,
        duration: Date.now() - startTime
      });
    }
  }

  private async testModelDetailEndpoint(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/models/gpt-3.5-turbo`);
      
      if (response.status === 200 && 
          response.data.id === 'gpt-3.5-turbo' &&
          response.data.object === 'model') {
        this.results.push({
          name: 'Model Detail Endpoint',
          success: true,
          message: 'Model detail endpoint returns correct format',
          duration: Date.now() - startTime
        });
      } else {
        throw new Error('Model detail endpoint returned unexpected format');
      }
    } catch (error) {
      this.results.push({
        name: 'Model Detail Endpoint',
        success: false,
        message: (error as Error).message,
        duration: Date.now() - startTime
      });
    }
  }

  private async testProviderCapabilities(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/api/providers/capabilities`);
      
      if (response.status === 200 && 
          response.data.success &&
          Array.isArray(response.data.data) &&
          response.data.data.length > 0) {
        
        const hasValidProvider = response.data.data.some((provider: any) => 
          provider.provider && 
          provider.name && 
          Array.isArray(provider.models) &&
          provider.supported_features
        );
        
        if (hasValidProvider) {
          this.results.push({
            name: 'Provider Capabilities',
            success: true,
            message: `Found ${response.data.data.length} providers with capabilities`,
            duration: Date.now() - startTime
          });
        } else {
          throw new Error('Provider capabilities returned invalid format');
        }
      } else {
        throw new Error('Provider capabilities endpoint returned unexpected format');
      }
    } catch (error) {
      this.results.push({
        name: 'Provider Capabilities',
        success: false,
        message: (error as Error).message,
        duration: Date.now() - startTime
      });
    }
  }

  private async testChatCompletionsValidation(): Promise<void> {
    const startTime = Date.now();
    try {
      // Test invalid request (no model)
      const invalidResponse = await axios.post(`${BASE_URL}/api/v1/chat/completions`, {
        messages: [{ role: 'user', content: 'Hello' }]
      }).catch(err => err.response);
      
      if (invalidResponse.status === 400 && 
          invalidResponse.data.error &&
          invalidResponse.data.error.type === 'invalid_request_error') {
        this.results.push({
          name: 'Chat Completions Validation',
          success: true,
          message: 'Properly validates invalid requests',
          duration: Date.now() - startTime
        });
      } else {
        throw new Error('Chat completions validation did not return expected error');
      }
    } catch (error) {
      this.results.push({
        name: 'Chat Completions Validation',
        success: false,
        message: (error as Error).message,
        duration: Date.now() - startTime
      });
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results');
    console.log('================');
    
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`${status} ${result.name} (${duration}) - ${result.message}`);
    });
    
    console.log(`\n📈 Summary: ${successCount}/${totalCount} tests passed`);
    
    if (successCount === totalCount) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️  Some tests failed');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new OpenAIUnifiedServiceTester();
  tester.runTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default OpenAIUnifiedServiceTester;