/**
 * Story Weaver Pipeline 统一入口
 *
 * 精简版：删除死代码 PipelineService（运行时从未被外部消费）。
 * 仅保留 PipelineEngine 和枚举常量导出。
 * Step output 类型改为各自 step 文件内部 export，外部直接使用
 * @/core/pipeline/step-<name> 导入，避免 barrel 膨胀。
 */

export { PipelineEngine, createPipelineEngine } from './pipeline-engine';
export { PipelineStepId, PipelineExecutionMode, PipelineStatus } from './pipeline.types';
