import { saveCheckpoint, loadCheckpoint, hasCheckpoint } from './checkpoint';

/**
 * 检查点管理器 — 封装检查点策略（何时跳过/恢复/保存）
 *
 * 参数使用 unknown 类型，避免与 StepInput/StepOutput 的两套定义冲突。
 */
export class CheckpointManager {
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /** 检查步骤是否已完成（可直接跳过） */
  async shouldSkip(stepId: string): Promise<boolean> {
    if (!this.enabled) return false;
    return hasCheckpoint(stepId);
  }

  /** 恢复检查点数据（仅 resume 模式） */
  async restore(stepId: string, context: unknown, isResume: boolean): Promise<unknown | null> {
    if (!this.enabled || !isResume) return null;
    const checkpoint = await loadCheckpoint(stepId);
    if (checkpoint?.completed) {
      return {
        ...(context as Record<string, unknown>),
        ...(checkpoint.data as Record<string, unknown>),
      };
    }
    return null;
  }

  /** 保存步骤结果到检查点 */
  async save(stepId: string, data: unknown): Promise<void> {
    if (!this.enabled) return;
    await saveCheckpoint(stepId, data);
  }
}
