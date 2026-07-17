/**
 * AI 模型配置中心（facade）
 *
 * 按职责拆分为 3 个子模块：
 * - model-providers.ts: 提供商配置
 * - model-catalog.ts: 模型目录
 * - model-utils.ts: 查询工具函数
 */

// 提供商配置
export { MODEL_PROVIDERS } from './model-providers';

// 模型目录
export { AI_MODELS } from './model-catalog';

// 查询工具
export {
  MODEL_RECOMMENDATIONS,
  getModelById,
  getModelsByProvider,
  getModelsByCategory,
  getRecommendedModels,
} from './model-utils';
