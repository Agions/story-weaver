/**
 * AI Service Types
 * Re-exports shared AI types used across the application
 */

import type {
  AIModel,
  AIModelSettings,
  ScriptData,
  VideoAnalysis,
  ScriptSegment,
  Scene,
  Keyframe,
} from '@/core/types';

// Re-export from core/types for convenience
export type { AIModel, AIModelSettings, ScriptData, VideoAnalysis, ScriptSegment, Scene, Keyframe };

// API 响应类型
export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// 流式响应回调
export interface StreamCallbacks {
  onChunk: (content: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

// 请求配置
export interface RequestConfig {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Mock 配置选项
export interface MockConfig {
  delay?: number;
  content?: string;
  shouldFail?: boolean;
  errorMessage?: string;
}
