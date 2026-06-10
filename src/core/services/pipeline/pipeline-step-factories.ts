/**
 * Pipeline 步骤工厂（消除 7 段重复代码）
 *
 * 原 pipeline.service.ts 中 createImportStep / createAnalysisStep /
 * createScriptStep / createStoryboardStep / createCharacterStep /
 * createRenderStep / createExportStep 七个工厂方法体 100% 相同，
 * 唯一的差别是 name 和 stepId 字段——典型可消除重复。
 *
 * 拆出后保留所有具名导出（外部 import 路径不变），实现由
 * createGenericStep 工厂函数统一生成。
 *
 * 注意：
 *   - 每个 step.execute() 都是"日志+原样返回 input"——这是占位实现，
 *     实际业务由对应服务（scriptImportService / novel-analyze.service
 *     / ai.service / storyboard.service / character.service /
 *     render-queue.service / review-export.service）注入。
 *   - 保留 7 个具名导出 + 原签名，避免破坏测试与调用方。
 */

import { v4 as uuidv4 } from 'uuid';

import type { PipelineContext, PipelineStep } from './pipeline.types';

/**
 * 通用步骤工厂
 *
 * @param stepId   步骤业务类型 ID（对应 PIPELINE_STEP_IDS 之一）
 * @param name     步骤中文显示名
 * @param onProgress 可选的进度回调（由 Pipeline 在编排时调用）
 * @returns        一个"日志占位 + 原样返回 input"的步骤定义
 */
function createGenericStep(
  stepId: PipelineStep['stepId'],
  name: string,
  onProgress?: (progress: number, message?: string) => void
): PipelineStep {
  return {
    id: uuidv4(),
    name,
    stepId,
    onProgress,
    async execute(input: unknown, context: PipelineContext): Promise<unknown> {
      context.log(`Starting ${name} step`);
      // 真实业务由对应服务注入（参见各 stepId 对应的 service 实现）。
      return input;
    },
  };
}

/** 创建导入步骤 */
export function createImportStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return createGenericStep('import', '导入', config?.onProgress);
}

/** 创建 AI 解析步骤 */
export function createAnalysisStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return createGenericStep('analysis', 'AI解析', config?.onProgress);
}

/** 创建剧本生成步骤 */
export function createScriptStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return createGenericStep('script', '剧本生成', config?.onProgress);
}

/** 创建分镜生成步骤 */
export function createStoryboardStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return createGenericStep('storyboard', '分镜生成', config?.onProgress);
}

/** 创建角色生成步骤 */
export function createCharacterStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return createGenericStep('character', '角色生成', config?.onProgress);
}

/** 创建渲染步骤 */
export function createRenderStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return createGenericStep('render', '渲染', config?.onProgress);
}

/** 创建导出步骤 */
export function createExportStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return createGenericStep('export', '导出', config?.onProgress);
}

/** 步骤 ID 列表（按业务顺序：导入→分析→脚本→分镜→角色→渲染→导出） */
export const PIPELINE_STEP_IDS = [
  'import',
  'analysis',
  'script',
  'storyboard',
  'character',
  'render',
  'export',
] as const;
