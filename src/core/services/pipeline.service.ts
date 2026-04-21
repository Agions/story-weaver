/**
 * Pipeline Service - 简化的线性流程执行引擎
 * 
 * 替代 n8n 工作流引擎，提供简化的线性流程执行
 * 流程：导入 → 分析 → 脚本 → 分镜 → 角色 → 渲染 → 导出
 */

import { v4 as uuidv4 } from 'uuid';

// ========== 类型定义 ==========

export type PipelineStepId = 
  | 'import'
  | 'analysis'
  | 'script'
  | 'storyboard'
  | 'character'
  | 'render'
  | 'export';

export type PipelineStatus = 
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'error';

export interface PipelineStep {
  id: string;
  name: string;
  stepId: PipelineStepId;
  execute(input: unknown, context: PipelineContext): Promise<unknown>;
  onProgress?: (progress: number, message?: string) => void;
}

export interface PipelineContext {
  workflowId: string;
  episodeId?: string;
  projectId?: string;
  getVariable: (name: string) => unknown;
  setVariable: (name: string, value: unknown) => void;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
}

export interface PipelineResult {
  workflowId: string;
  status: PipelineStatus;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  steps: PipelineStepResult[];
}

export interface PipelineStepResult {
  stepId: string;
  name: string;
  status: PipelineStatus;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface PipelineConfig {
  workflowId?: string;
  projectId?: string;
  episodeId?: string;
  steps: PipelineStep[];
  onStepChange?: (step: PipelineStep) => void;
  onProgress?: (stepId: string, progress: number, message?: string) => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: string, step?: PipelineStep) => void;
}

// ========== Pipeline Service ==========

export class PipelineService {
  private workflows: Map<string, Pipeline> = new Map();

  /**
   * 创建新流程
   */
  createPipeline(config: Omit<PipelineConfig, 'onStepChange' | 'onProgress' | 'onComplete' | 'onError'>): string {
    const workflowId = config.workflowId || uuidv4();
    const pipeline = new Pipeline(workflowId, config);
    this.workflows.set(workflowId, pipeline);
    return workflowId;
  }

  /**
   * 获取流程
   */
  getPipeline(workflowId: string): Pipeline | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * 运行流程
   */
  async runPipeline(
    workflowId: string,
    initialInput: unknown,
    callbacks?: {
      onStepChange?: (step: PipelineStep) => void;
      onProgress?: (stepId: string, progress: number, message?: string) => void;
      onComplete?: (result: PipelineResult) => void;
      onError?: (error: string, step?: PipelineStep) => void;
    }
  ): Promise<PipelineResult> {
    const pipeline = this.workflows.get(workflowId);
    if (!pipeline) {
      throw new Error(`Pipeline ${workflowId} not found`);
    }
    return pipeline.run(initialInput, callbacks);
  }

  /**
   * 暂停流程
   */
  pausePipeline(workflowId: string): boolean {
    const pipeline = this.workflows.get(workflowId);
    if (pipeline) {
      pipeline.pause();
      return true;
    }
    return false;
  }

  /**
   * 恢复流程
   */
  resumePipeline(workflowId: string): boolean {
    const pipeline = this.workflows.get(workflowId);
    if (pipeline) {
      pipeline.resume();
      return true;
    }
    return false;
  }

  /**
   * 取消流程
   */
  cancelPipeline(workflowId: string): boolean {
    const pipeline = this.workflows.get(workflowId);
    if (pipeline) {
      pipeline.cancel();
      return true;
    }
    return false;
  }

  /**
   * 获取流程状态
   */
  getPipelineStatus(workflowId: string): PipelineStatus | undefined {
    return this.workflows.get(workflowId)?.status;
  }

  /**
   * 删除流程
   */
  deletePipeline(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  /**
   * 获取所有流程
   */
  getAllPipelines(): Pipeline[] {
    return Array.from(this.workflows.values());
  }
}

// ========== Pipeline Class ==========

class Pipeline {
  readonly workflowId: string;
  readonly config: PipelineConfig;
  status: PipelineStatus = 'idle';
  result?: PipelineResult;
  
  private variables: Map<string, unknown> = new Map();
  private stepResults: Map<string, PipelineStepResult> = new Map();
  private cancelled = false;
  private paused = false;
  private pauseResolve?: () => void;

  constructor(workflowId: string, config: PipelineConfig) {
    this.workflowId = workflowId;
    this.config = config;
  }

  /**
   * 运行流程
   */
  async run(
    initialInput: unknown,
    callbacks?: {
      onStepChange?: (step: PipelineStep) => void;
      onProgress?: (stepId: string, progress: number, message?: string) => void;
      onComplete?: (result: PipelineResult) => void;
      onError?: (error: string, step?: PipelineStep) => void;
    }
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    this.status = 'running';
    this.result = {
      workflowId: this.workflowId,
      status: 'running',
      startTime,
      steps: []
    };

    const context: PipelineContext = {
      workflowId: this.workflowId,
      episodeId: this.config.episodeId,
      projectId: this.config.projectId,
      getVariable: (name) => this.variables.get(name),
      setVariable: (name, value) => this.variables.set(name, value),
      log: (message, level = 'info') => {
        console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](`[Pipeline ${this.workflowId}] ${message}`);
      }
    };

    let currentInput = initialInput;
    const totalSteps = this.config.steps.length;

    for (let i = 0; i < this.config.steps.length; i++) {
      // Check for cancellation
      if (this.cancelled) {
        this.status = 'idle';
        this.result.status = 'idle';
        return this.result;
      }

      // Handle pause
      while (this.paused) {
        await new Promise<void>((resolve) => {
          this.pauseResolve = resolve;
        });
      }

      const step = this.config.steps[i];
      const stepStartTime = Date.now();
      const progress = Math.round(((i + 1) / totalSteps) * 100);

      callbacks?.onStepChange?.(step);
      this.config.onStepChange?.(step);

      const stepResult: PipelineStepResult = {
        stepId: step.id,
        name: step.name,
        status: 'running',
        startTime: stepStartTime
      };

      try {
        step.onProgress?.(progress, `执行中: ${step.name}`);
        callbacks?.onProgress?.(step.stepId, progress, `执行中: ${step.name}`);
        this.config.onProgress?.(step.stepId, progress, `执行中: ${step.name}`);

        const output = await step.execute(currentInput, context);
        currentInput = output;

        stepResult.status = 'completed';
        stepResult.output = output;
        stepResult.endTime = Date.now();
        stepResult.duration = stepResult.endTime - stepResult.startTime;

        context.log(`Step ${step.name} completed`);
      } catch (error) {
        stepResult.status = 'error';
        stepResult.error = error instanceof Error ? error.message : String(error);
        stepResult.endTime = Date.now();
        stepResult.duration = stepResult.endTime - stepResult.startTime;

        this.status = 'error';
        this.result.status = 'error';
        this.result.error = stepResult.error;
        this.result.steps.push(stepResult);

        callbacks?.onError?.(stepResult.error, step);
        this.config.onError?.(stepResult.error, step);

        return this.result;
      }

      this.stepResults.set(step.id, stepResult);
      this.result.steps.push(stepResult);
    }

    this.status = 'completed';
    this.result.status = 'completed';
    this.result.endTime = Date.now();
    this.result.output = currentInput;

    callbacks?.onComplete?.(this.result);
    this.config.onComplete?.(this.result);

    return this.result;
  }

  /**
   * 暂停流程
   */
  pause(): void {
    if (this.status === 'running') {
      this.paused = true;
      this.status = 'paused';
    }
  }

  /**
   * 恢复流程
   */
  resume(): void {
    if (this.status === 'paused' && this.paused) {
      this.paused = false;
      this.status = 'running';
      if (this.pauseResolve) {
        this.pauseResolve();
        this.pauseResolve = undefined;
      }
    }
  }

  /**
   * 取消流程
   */
  cancel(): void {
    this.cancelled = true;
    this.paused = false;
    this.status = 'idle';
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = undefined;
    }
  }

  /**
   * 获取变量
   */
  getVariable(name: string): unknown {
    return this.variables.get(name);
  }

  /**
   * 设置变量
   */
  setVariable(name: string, value: unknown): void {
    this.variables.set(name, value);
  }

  /**
   * 获取步骤结果
   */
  getStepResult(stepId: string): PipelineStepResult | undefined {
    return this.stepResults.get(stepId);
  }
}

// ========== 预设步骤工厂 ==========

export const PIPELINE_STEP_IDS: Record<PipelineStepId, PipelineStepId> = {
  import: 'import',
  analysis: 'analysis',
  script: 'script',
  storyboard: 'storyboard',
  character: 'character',
  render: 'render',
  export: 'export'
};

/**
 * 创建导入步骤
 */
export function createImportStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return {
    id: uuidv4(),
    name: '导入',
    stepId: 'import',
    onProgress: config?.onProgress,
    async execute(input: unknown, context: PipelineContext): Promise<unknown> {
      context.log('Starting import step');
      // Import logic handled by scriptImportService
      return input;
    }
  };
}

/**
 * 创建分析步骤
 */
export function createAnalysisStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return {
    id: uuidv4(),
    name: 'AI解析',
    stepId: 'analysis',
    onProgress: config?.onProgress,
    async execute(input: unknown, context: PipelineContext): Promise<unknown> {
      context.log('Starting analysis step');
      // Analysis logic handled by novel-analyze.service or story-analysis.service
      return input;
    }
  };
}

/**
 * 创建脚本生成步骤
 */
export function createScriptStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return {
    id: uuidv4(),
    name: '剧本生成',
    stepId: 'script',
    onProgress: config?.onProgress,
    async execute(input: unknown, context: PipelineContext): Promise<unknown> {
      context.log('Starting script generation step');
      // Script generation logic handled by ai.service
      return input;
    }
  };
}

/**
 * 创建分镜生成步骤
 */
export function createStoryboardStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return {
    id: uuidv4(),
    name: '分镜生成',
    stepId: 'storyboard',
    onProgress: config?.onProgress,
    async execute(input: unknown, context: PipelineContext): Promise<unknown> {
      context.log('Starting storyboard generation step');
      // Storyboard logic handled by storyboard.service
      return input;
    }
  };
}

/**
 * 创建角色生成步骤
 */
export function createCharacterStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return {
    id: uuidv4(),
    name: '角色生成',
    stepId: 'character',
    onProgress: config?.onProgress,
    async execute(input: unknown, context: PipelineContext): Promise<unknown> {
      context.log('Starting character generation step');
      // Character logic handled by character.service
      return input;
    }
  };
}

/**
 * 创建渲染步骤
 */
export function createRenderStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return {
    id: uuidv4(),
    name: '渲染',
    stepId: 'render',
    onProgress: config?.onProgress,
    async execute(input: unknown, context: PipelineContext): Promise<unknown> {
      context.log('Starting render step');
      // Render logic handled by render-queue.service or manga-pipeline.service
      return input;
    }
  };
}

/**
 * 创建导出步骤
 */
export function createExportStep(config?: {
  onProgress?: (progress: number, message?: string) => void;
}): PipelineStep {
  return {
    id: uuidv4(),
    name: '导出',
    stepId: 'export',
    onProgress: config?.onProgress,
    async execute(input: unknown, context: PipelineContext): Promise<unknown> {
      context.log('Starting export step');
      // Export logic handled by review-export.service or project-import-export.service
      return input;
    }
  };
}

/**
 * 创建完整流水线（默认7步）
 */
export function createDefaultPipeline(config?: {
  onStepChange?: (step: PipelineStep) => void;
  onProgress?: (stepId: string, progress: number, message?: string) => void;
}): PipelineStep[] {
  return [
    createImportStep({ onProgress: (p, m) => config?.onProgress?.('import', p, m) }),
    createAnalysisStep({ onProgress: (p, m) => config?.onProgress?.('analysis', p, m) }),
    createScriptStep({ onProgress: (p, m) => config?.onProgress?.('script', p, m) }),
    createStoryboardStep({ onProgress: (p, m) => config?.onProgress?.('storyboard', p, m) }),
    createCharacterStep({ onProgress: (p, m) => config?.onProgress?.('character', p, m) }),
    createRenderStep({ onProgress: (p, m) => config?.onProgress?.('render', p, m) }),
    createExportStep({ onProgress: (p, m) => config?.onProgress?.('export', p, m) }),
  ];
}

// ========== Singleton Export ==========

let pipelineServiceInstance: PipelineService | null = null;

export function getPipelineService(): PipelineService {
  if (!pipelineServiceInstance) {
    pipelineServiceInstance = new PipelineService();
  }
  return pipelineServiceInstance;
}

export default PipelineService;
