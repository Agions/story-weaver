/**
 * Pipeline 步骤执行辅助
 *
 * 从 AutoPipelineEngine 中抽离：
 * - executeWithTimeout：Promise.race 风格的超时控制
 * - buildStepInput：合并前序依赖输出 + 全局输入
 *
 * 单一职责：步骤输入构造与执行超时控制。
 */

import type { StepOutput } from './autonomous.types';
import type { PipelineStep, StepInput } from './pipeline-types';

/**
 * 用 Promise 包装 step.execute，附带超时拒绝。
 * 行为与原 executeWithTimeout 逐字一致：
 * - 超时错误消息：`Step ${step.name} timed out after ${step.timeout}ms`
 * - 成功/失败都清理 timer
 */
export function executeStepWithTimeout(step: PipelineStep, input: StepInput): Promise<StepOutput> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Step ${step.name} timed out after ${step.timeout}ms`));
    }, step.timeout);

    step
      .execute(input)
      .then((output) => {
        clearTimeout(timer);
        resolve(output);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * 把"前序依赖步骤的输出" + "全局输入"合并为步骤输入。
 *
 * 合并顺序：
 * 1. 遍历 step.dependencies，从 context 取出每个 dep 的输出并浅合并
 * 2. 再把全局输入（context['__input__']）浅合并到 input（可覆盖 dep 输出）
 *
 * 行为与原 buildStepInput 逐字一致。
 */
export function buildStepInput(step: PipelineStep, context: Map<string, unknown>): StepInput {
  const input: StepInput = {};

  if (step.dependencies) {
    for (const depId of step.dependencies) {
      const depOutput = context.get(depId);
      if (depOutput && typeof depOutput === 'object') {
        Object.assign(input, depOutput);
      }
    }
  }

  const globalInput = context.get('__input__');
  if (globalInput && typeof globalInput === 'object') {
    Object.assign(input, globalInput);
  }

  return input;
}
