/**
 * 创建模拟 Step 上下文
 * 8 个 step-*.test.ts 共用 (body 100% 一致 dedup)
 *
 * 注意: step-import.test.ts 保留了 inline `createMockContext`,
 * 因为 ImportStep 测试需要 `workflowId` 字段 + `log: jest.fn()` + 实际 `setVariable` 写入,
 * 与基础 StepContext 形状不同. 不强行 dedup, 避免行为改变风险.
 */
export const createMockStepContext = (variables: Map<string, unknown> = new Map()) => ({
  variables,
  getVariable: <T>(key: string) => variables.get(key) as T | undefined,
  setVariable: <T>(_key: string, _value: T) => {},
  log: () => {},
  getCheckpoint: () => undefined,
  saveCheckpoint: () => {},
  emit: () => {},
});
