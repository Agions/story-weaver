/**
 * AI Provider 统一接口
 * 定义所有 AI provider 必须实现的方法
 */

export interface AIProviderConfig {
  baseURL: string;
  apiKey: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string;
  name?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  stop?: string | string[];
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason?: string;
  }>;
}

export interface AIProvider {
  readonly name: string;
  readonly config: AIProviderConfig;

  // 聊天补全
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  
  // 流式聊天补全
  streamChat(
    request: ChatCompletionRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void>;

  // 图像生成
  generateImage?(prompt: string, options?: ImageGenOptions): Promise<ImageGenResponse>;
  
  // 文本转语音
  textToSpeech?(text: string, options?: TTSOptions): Promise<TTSResponse>;
  
  // 健康检查
  healthCheck(): Promise<boolean>;
}

export interface ImageGenOptions {
  model?: string;
  width?: number;
  height?: number;
  quality?: 'standard' | 'hd';
  style?: string;
  negative_prompt?: string;
}

export interface ImageGenResponse {
  image_url: string;
  revised_prompt?: string;
  model: string;
}

export interface TTSOptions {
  model?: string;
  voice?: string;
  speed?: number;
  format?: 'mp3' | 'wav' | 'ogg';
}

export interface TTSResponse {
  audio_url: string;
  duration?: number;
  model: string;
}
