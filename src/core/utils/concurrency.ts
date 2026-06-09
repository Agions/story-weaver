/**
 * 并发控制工具
 *
 * 之前 novel.service / novel-analyze.service / scene-analyzer.service
 * 各自内嵌了一份相同的 `concurrentLimit` 实现（3 处复制粘贴）。
 * 提取为统一工具，业务行为不变。
 */

/**
 * 批量并发执行任务的结果。
 * - `results`：与输入 items 等长的结果数组（成功位置写入结果，失败位置保持 undefined）
 * - `errors`：所有失败项的列表（含原始 item、错误、index）
 */
export interface ConcurrentLimitResult<T, R> {
  results: R[];
  errors: Array<{ item: T; error: unknown; index: number }>;
}

/**
 * 并发执行异步任务并限制批次大小。
 *
 * 实现要点：
 * 1. 按 `concurrency` 切片为多批，每批内部并发跑（Promise.all）
 * 2. 任一任务失败不中断整批，错误单独收集
 * 3. 返回的 results 按全局 index 写入，调用方可按位置取结果
 *
 * @example
 * const { results, errors } = await concurrentLimit(items, 5, async (item) => {
 *   return await doWork(item);
 * });
 */
export async function concurrentLimit<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T, index: number) => Promise<R>
): Promise<ConcurrentLimitResult<T, R>> {
  const results: R[] = new Array(items.length);
  const errors: Array<{ item: T; error: unknown; index: number }> = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map((item, batchIndex) => {
      const globalIndex = i + batchIndex;
      return processor(item, globalIndex)
        .then((result) => ({
          success: true as const,
          result,
          index: globalIndex,
          item: undefined as unknown as T,
        }))
        .catch((error) => ({ success: false as const, error, item, index: globalIndex }));
    });

    const batchResults = await Promise.all(batchPromises);

    for (const batchResult of batchResults) {
      if ('error' in batchResult && batchResult.success === false) {
        errors.push({ item: batchResult.item, error: batchResult.error, index: batchResult.index });
      } else if ('result' in batchResult) {
        results[batchResult.index] = batchResult.result;
      }
    }
  }

  return { results, errors };
}
