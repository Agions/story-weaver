/**
 * 创建模拟 Step 上下文
 * 8 个 step-*.test.ts 共用 (body 100% 一致 dedup)
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
