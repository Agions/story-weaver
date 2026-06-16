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

/**
 * 生成成本记录 ID，与原实现逐字一致。
 * 格式：`<type>_<timestamp>_<5位随机字符>`。
 */
function generateCostRecordId(type: CostRecordType): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  return `${type}_${timestamp}_${randomSuffix}`;
}

/** 构造一条 LLM 成本记录（输入/输出 token 类型） */
export function buildLLMCostRecord(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  metadata?: Record<string, unknown>
): CostRecord {
  const pricing = MODEL_COSTS[model] ?? { input: 0.001, output: 0.003 };
  return {
    id: generateCostRecordId('llm'),
    type: 'llm',
    provider,
    model,
    inputTokens,
    outputTokens,
    cost: (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output,
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
  const costPerMinute = VIDEO_COSTS[provider] ?? 0.5;
  return {
    id: generateCostRecordId('video'),
    type: 'video',
    provider,
    cost: (durationSeconds / 60) * costPerMinute,
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
    cost: (durationSeconds / 60) * 0.06,
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
    cost: (sizeMB / 1024) * 0.02,
    timestamp: new Date().toISOString(),
    metadata: { ...metadata, sizeMB },
  };
}
