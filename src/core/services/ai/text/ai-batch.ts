/**
 * AI 批量生成
 *
 * 把 batchGenerate 的"按并发数分批 + 进度回调"骨架抽出来。
 * 行为与原 batchGenerate 完全一致。
 */

import { concurrentLimit } from '@/core/utils/concurrency';

interface BatchGenerateOptions {
  /** 模型 ID */
  model: string;
  /** Provider ID */
  provider: string;
  /** 采样温度 */
  temperature?: number;
  /** 最大 token 数 */
  max_tokens?: number;
  /** 并发数，默认 3 */
  concurrency?: number;
  /** 进度回调：completed / total */
  onProgress?: (completed: number, total: number) => void;
}

/** 默认并发数 */
const DEFAULT_BATCH_CONCURRENCY = 3;

/**
 * 批量调用 generate，保持输入 prompts 的索引顺序返回结果。
 * 内部复用 core/utils/concurrency 的并发控制工具。
 */
export async function batchGenerate(
  prompts: string[],
  options: BatchGenerateOptions,
  generate: (prompt: string, options: BatchGenerateOptions) => Promise<string>
): Promise<string[]> {
  const concurrency = options.concurrency ?? DEFAULT_BATCH_CONCURRENCY;
  let completed = 0;

  const { results, errors } = await concurrentLimit(prompts, concurrency, async (prompt) => {
    const result = await generate(prompt, options);
    completed += 1;
    options.onProgress?.(completed, prompts.length);
    return result;
  });

  // 任一失败 → 把第一条错误抛出（与原行为一致：原实现无 try/catch，
  // Promise.all 内的 reject 会直接抛）
  if (errors.length > 0) {
    throw errors[0].error;
  }

  return results as string[];
}
