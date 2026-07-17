/**
 * Pipeline Step 共享 Helpers
 * ==========================
 * 消除 step-*.ts 中 8L catch block + 3L reportProgress 的跨文件重复。
 */

import type {
  PipelineContext,
  PipelineStep,
  PipelineStepId,
  RetryPolicy,
  StepInput,
  StepOutput,
} from './pipeline-types';
import { CONTEXT_KEY, QualityGateDecision, StepStatus } from './pipeline-types';

/**
 * 从 StepInput 提取 PipelineContext。
 *
 * 引擎通过 CONTEXT_KEY(Symbol) 挂载上下文，此函数提供类型安全的访问。
 * 若上下文不存在（如测试中手动构造的 StepInput），返回 undefined。
 *
 * @example
 * ```ts
 * const context = getContext(input);
 * context?.setVariable('key', value);
 * ```
 */
export function getContext(input: StepInput): PipelineContext | undefined {
  // 新方式：引擎通过 Symbol key 挂载（非枚举，spread 不可见）
  if (input[CONTEXT_KEY]) {
    return input[CONTEXT_KEY];
  }
  // 旧方式（兼容）：直接从 input.context 读取
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (input as any).context as PipelineContext | undefined;
}

/** 所有 step 共用的默认重试策略 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 2,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
};

/** 标准化失败结果（所有 step 的 catch block 共用） */
export function createFailedStepResult(
  stepId: PipelineStepId | string,
  startTime: number,
  errorMsg: string
) {
  return {
    stepId: stepId as PipelineStepId,
    status: StepStatus.FAILED,
    data: undefined,
    error: errorMsg,
    startTime,
    endTime: Date.now(),
    retryCount: 0,
  };
}

/** 标准化进度上报（所有 step 的 reportProgress 共用） */
export function reportStepProgress(
  stepId: string,
  onProgress: PipelineStep['onProgress'],
  progress: number,
  message: string
): void {
  onProgress?.({ stepId: stepId as PipelineStepId, progress, message });
}

/**
 * 标准化成功结果。所有 step 共用的 stepId/status/qualityGate/startTime/endTime/retryCount 字段，
 * 只传入 step-specific 的 data 和 metrics。
 */
export function createSuccessStepResult(
  stepId: PipelineStepId | string,
  startTime: number,
  data: unknown,
  metrics?: Partial<StepOutput['metrics']>
): StepOutput {
  return {
    stepId: stepId as PipelineStepId,
    status: StepStatus.COMPLETED,
    data,
    metrics: metrics
      ? { durationMs: Date.now() - startTime, ...metrics }
      : { durationMs: Date.now() - startTime },
    qualityGate: QualityGateDecision.PASS,
    startTime,
    endTime: Date.now(),
    retryCount: 0,
  };
}
