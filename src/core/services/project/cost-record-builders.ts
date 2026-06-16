/**
 * 成本记录构造器
 *
 * 把 4 个 recordXxxCost 方法里的"生成 ID → 算 cost → 构造 record 对象"
 * 重复骨架抽成纯函数。
 *
 * 行为完全保留：ID 命名规则仍为 `<type>_<timestamp>_<rand>`，
 * 时间戳使用 new Date().toISOString()，duration 单位保持毫秒。
 */

import { MODEL_COSTS, VIDEO_COSTS } from './cost.constants';
import type { CostRecord, CostRecordType } from './cost.types';

/** 默认 LLM 单价（USD/千 token），与原 recordLLMCost fallback 一致 */
const DEFAULT_LLM_PRICING = { input: 0.001, output: 0.003 };
/** 默认视频单价（USD/分钟），与原 recordVideoCost fallback 一致 */
const DEFAULT_VIDEO_COST_PER_MINUTE = 0.5;
/** 默认音频单价（USD/分钟），与原 recordAudioCost 一致 */
const DEFAULT_AUDIO_COST_PER_MINUTE = 0.06;
/** 默认存储单价（USD/GB），与原 recordStorageCost 一致 */
const DEFAULT_STORAGE_COST_PER_GB = 0.02;

/**
 * 生成成本记录 ID，与原实现逐字一致。
 * 格式：`<type>_<timestamp>_<5位随机字符>`。
 */
function generateCostRecordId(type: CostRecordType): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  return `${type}_${timestamp}_${randomSuffix}`;
}

/**
 * 计算 LLM 调用成本：按 (输入+输出) token 数 × 单价。
 */
function calculateLLMCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_COSTS[model] ?? DEFAULT_LLM_PRICING;
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}

/** 计算视频生成成本：时长(秒) × 单价(USD/分钟) */
function calculateVideoCost(provider: string, durationSeconds: number): number {
  const costPerMinute = VIDEO_COSTS[provider] ?? DEFAULT_VIDEO_COST_PER_MINUTE;
  return (durationSeconds / 60) * costPerMinute;
}

/** 计算音频生成成本：时长(秒) × 0.06 USD/分钟 */
function calculateAudioCost(durationSeconds: number): number {
  return (durationSeconds / 60) * DEFAULT_AUDIO_COST_PER_MINUTE;
}

/** 计算存储成本：大小(MB) × 0.02 USD/GB */
function calculateStorageCost(sizeMB: number): number {
  return (sizeMB / 1024) * DEFAULT_STORAGE_COST_PER_GB;
}

/** 构造一条 LLM 成本记录（输入/输出 token 类型） */
export function buildLLMCostRecord(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  metadata?: Record<string, unknown>
): CostRecord {
  return {
    id: generateCostRecordId('llm'),
    type: 'llm',
    provider,
    model,
    inputTokens,
    outputTokens,
    cost: calculateLLMCost(model, inputTokens, outputTokens),
    timestamp: new Date().toISOString(),
    metadata,
  };
}

/** 构造一条视频成本记录（duration 入参为秒，内部转毫秒保持向后兼容） */
export function buildVideoCostRecord(
  provider: string,
  durationSeconds: number,
  resolution: string,
  metadata?: Record<string, unknown>
): CostRecord {
  return {
    id: generateCostRecordId('video'),
    type: 'video',
    provider,
    cost: calculateVideoCost(provider, durationSeconds),
    duration: durationSeconds * 1000,
    timestamp: new Date().toISOString(),
    metadata: { ...metadata, resolution },
  };
}

/** 构造一条音频成本记录 */
export function buildAudioCostRecord(
  provider: string,
  durationSeconds: number,
  metadata?: Record<string, unknown>
): CostRecord {
  return {
    id: generateCostRecordId('audio'),
    type: 'audio',
    provider,
    cost: calculateAudioCost(durationSeconds),
    duration: durationSeconds * 1000,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

/** 构造一条存储成本记录 */
export function buildStorageCostRecord(
  provider: string,
  sizeMB: number,
  metadata?: Record<string, unknown>
): CostRecord {
  return {
    id: generateCostRecordId('storage'),
    type: 'storage',
    provider,
    cost: calculateStorageCost(sizeMB),
    timestamp: new Date().toISOString(),
    metadata: { ...metadata, sizeMB },
  };
}
