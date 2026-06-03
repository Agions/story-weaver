/**
 * 成本追踪 - 定价常量
 * 拆出常量以减小 cost.service.ts 体积
 */

/**
 * LLM 模型定价 (USD per 1K tokens)
 */
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-5': { input: 0.005, output: 0.015 },
  'gpt-5-mini': { input: 0.0005, output: 0.0015 },

  // Anthropic
  'claude-4-sonnet': { input: 0.003, output: 0.015 },
  'claude-4-opus': { input: 0.015, output: 0.075 },

  // 百度
  'ernie-5.0': { input: 0.0012, output: 0.0012 },
  'ernie-speed': { input: 0.0001, output: 0.0001 },

  // 阿里
  'qwen-max': { input: 0.002, output: 0.006 },
  'qwen-plus': { input: 0.0008, output: 0.002 },
  'qwen-turbo': { input: 0.0003, output: 0.0006 },

  // 月之暗面
  'kimi-k2.5': { input: 0.001, output: 0.003 },

  // 智谱
  'glm-5': { input: 0.001, output: 0.003 },

  // MiniMax
  'minimax-m2.5': { input: 0.001, output: 0.003 },
};

/**
 * 视频生成定价 (USD per minute)
 */
export const VIDEO_COSTS: Record<string, number> = {
  vidu: 0.5,
  seedance: 0.4,
  kling: 0.3,
  local: 0, // 本地免费
};
