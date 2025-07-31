// Type definitions for the API Proxy application

export interface ApiKeyData {
  id?: number;
  provider: string;
  name: string;
  api_key: string;
  api_secret?: string;
  base_url: string;
  cost_per_request?: number;
  remaining_quota?: number;
  total_quota?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCallData {
  id?: number;
  api_key_id: number;
  endpoint: string;
  method: string;
  request_data: any;
  response_status: number;
  response_time: number;
  cost?: number;
  first_token_latency?: number;
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  tokens_per_second?: number;
  model_name?: string;
  provider_name?: string;
  created_at?: string;
}

export interface ModelCapabilities {
  reasoning: boolean;
  function_calling: boolean;
  vision: boolean;
  code_generation: boolean;
  multimodal: boolean;
  streaming: boolean;
  context_length: number;
}

export interface ModelPricing {
  input_price: number;
  output_price: number;
  currency: string;
  billing_unit: string;
}

export interface ModelPerformance {
  avg_response_time: number;
  availability: number;
}

export interface ModelLimits {
  max_tokens: number;
  rpm_limit: number;
  tpm_limit: number;
}

export interface ExtendedModelInfo {
  name: string;
  display_name: string;
  model_family: string;
  description: string;
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
  performance: ModelPerformance;
  limits: ModelLimits;
}

export interface ProviderConfig {
  provider: string;
  name: string;
  display_name?: string;
  description?: string;
  base_url: string;
  auth_type: string;
  request_format?: string;
  response_format?: string;
  cost_per_request?: number;
  endpoints?: any;
  headers?: Record<string, string>;
  models?: ExtendedModelInfo[];
  icon?: string;
  real_icon_url?: string;
  website?: string;
  documentation?: string;
  console_url?: string;
  registration_guide?: string; // markdown content
  promotions?: string; // markdown content
  additional_info?: string; // markdown content
}

export interface ProxyResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  provider: string;
  api_key_name: string;
  response_time: number;
  cost?: number;
}

export interface ApiStats {
  provider: string;
  name: string;
  call_count: number;
  avg_response_time: number;
  total_cost: number;
  success_count: number;
  error_count: number;
}

export interface RecentCall {
  id: number;
  api_key_id: number;
  endpoint: string;
  method: string;
  request_data: string;
  response_status: number;
  response_time: number;
  cost: number;
  created_at: string;
  provider: string;
  api_name: string;
}

export interface EndpointUsage {
  endpoint: string;
  method: string;
  call_count: number;
  avg_response_time: number;
  total_cost: number;
}

export type TimeRange = '1h' | '24h' | '7d' | '30d';

export interface PerformanceMetrics {
  avg_first_token_latency: number;
  avg_tokens_per_second: number;
  total_tokens_consumed: number;
  avg_response_time: number;
  request_count: number;
  provider: string;
  model_name?: string;
  time_period: string;
}

export interface TokenUsageStats {
  provider: string;
  model_name: string;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_requests: number;
  avg_tokens_per_request: number;
  cost_per_token: number;
  total_cost: number;
}

export interface RealTimeMetrics {
  current_tps: number;
  active_requests: number;
  avg_latency_1min: number;
  total_tokens_last_hour: number;
  error_rate_last_hour: number;
  cost_last_hour: number;
}

export interface ModelFamilyInfo {
  family: string;
  display_name: string;
  description: string;
  capabilities: ModelCapabilities;
  providers: ModelProviderInfo[];
}

export interface ModelProviderInfo {
  provider: string;
  provider_name: string;
  model_name: string;
  display_name: string;
  pricing: ModelPricing;
  performance: ModelPerformance;
  limits: ModelLimits;
  icon?: string;
}

export interface ModelViewResponse {
  success: boolean;
  data: ModelFamilyInfo[];
}

export interface ModelFamilyDetailResponse {
  success: boolean;
  data: ModelFamilyInfo;
}