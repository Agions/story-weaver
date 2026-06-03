/**
 * Pipeline 步骤3：剧本生成 (Script Generation)
 * 
 * 基于分析结果生成结构化视频剧本
 */

import { aiService } from '@/core/services/ai.service';
import { logger } from '@/core/utils/logger';

import type {
  PipelineStep,
  StepInput,
  StepOutput,
  StepProgressEvent,
  RetryPolicy,
} from './pipeline.types';
import { PipelineStepId, StepStatus, QualityGateDecision , PipelineExecutionMode } from './pipeline.types';
import type { ImportOutput } from './step-import';

export interface ScriptStepConfig extends Partial<PipelineStep> {
  model?: string;
  provider?: string;
}

export interface ScriptOutput {
  title: string;
  scenes: Array<{
    id: string;
    title: string;
    description: string;
    dialogue: string;
    narration?: string;
    duration?: number;
    shots?: number;
  }>;
  totalDuration: number;
}

export class ScriptStep implements PipelineStep {
  readonly id: string;
  readonly name: string;
  readonly stepId: PipelineStepId;
  readonly mode = PipelineExecutionMode.SEQUENCE;
  readonly retryPolicy: RetryPolicy;
  readonly dependencies = [PipelineStepId.IMPORT, PipelineStepId.ANALYSIS];
  onProgress?: (event: StepProgressEvent) => void;

  private model: string;
  private provider: string;

  constructor(config?: ScriptStepConfig) {
    this.id = config?.id ?? 'step-script';
    this.name = config?.name ?? '剧本生成';
    this.stepId = PipelineStepId.SCRIPT;
    this.retryPolicy = config?.retryPolicy ?? {
      maxRetries: 2,
      initialDelayMs: 2000,
      backoffMultiplier: 2,
      maxDelayMs: 10000,
    };
    this.model = config?.model ?? 'glm-5';
    this.provider = config?.provider ?? 'zhipu';
  }

  async execute(input: StepInput): Promise<StepOutput> {
    const startTime = Date.now();
    const context = input.context;

    logger.info(`[ScriptStep] Generating script for workflow ${input.workflowId}`);

    try {
      // 获取分析结果
      const analysisResult = context.getVariable<ImportOutput>('analysisResult');
      const chapters = context.getVariable<ImportOutput['chapters']>('chapters');

      if (!chapters || chapters.length === 0) {
        throw new Error('No content to generate script from');
      }

      this.reportProgress(10, '正在构建剧本生成提示词...');

      // 构建提示词
      const prompt = this.buildScriptPrompt(chapters, analysisResult);

      this.reportProgress(30, '正在生成剧本结构...');

      // 调用 AI 生成
      const scriptContent = await aiService.generate(prompt, {
        model: this.model,
        provider: this.provider,
        max_tokens: 8192,
      });

      this.reportProgress(70, '正在解析生成结果...');

      // 解析 AI 返回的剧本
      const scriptOutput = this.parseScriptOutput(scriptContent, chapters);

      this.reportProgress(90, '剧本生成完成');

      // 保存到上下文
      context.setVariable('scriptOutput', scriptOutput);
      context.setVariable('scenes', scriptOutput.scenes);

      logger.success(`[ScriptStep] Script generated: ${scriptOutput.scenes.length} scenes`);

      return {
        stepId: this.stepId,
        status: StepStatus.COMPLETED,
        data: scriptOutput,
        metrics: {
          durationMs: Date.now() - startTime,
          tokensUsed: scriptContent.length,
        },
        qualityGate: QualityGateDecision.PASS,
        startTime,
        endTime: Date.now(),
        retryCount: 0,
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[ScriptStep] Script generation failed: ${errorMsg}`);

      return {
        stepId: this.stepId,
        status: StepStatus.FAILED,
        data: undefined,
        error: errorMsg,
        startTime,
        endTime: Date.now(),
        retryCount: 0,
      };
    }
  }

  private reportProgress(progress: number, message: string): void {
    this.onProgress?.({ stepId: this.stepId, progress, message });
  }

  private buildScriptPrompt(chapters: ImportOutput['chapters'], analysisResult?: ImportOutput): string {
    const genre = analysisResult?.metadata?.title ?? '通用';
    const sceneCount = chapters.length;

    return `你是专业的漫剧剧本作家。请根据以下故事内容生成适合AI漫剧制作的剧本。

## 故事概要
类型: ${genre}
总章节数: ${sceneCount}

## 内容
${chapters.map((ch, i) => `【第${i + 1}章】${ch.title}\n${ch.content.slice(0, 500)}...`).join('\n\n')}

## 输出要求
请生成JSON格式的剧本，包含以下字段：
- title: 剧本标题
- scenes[]: 场景数组，每个场景包含：
  - id: 场景ID
  - title: 场景标题
  - description: 场景描述（视觉画面）
  - dialogue: 对话内容
  - narration: 旁白（可选）
  - duration: 预计时长（秒）
  - shots: 镜头数量

## 格式要求
- 每个场景控制在50-200字描述
- 对话要符合角色性格
- 场景描述要包含：人物、动作、环境、光影
- 总时长建议5-15分钟`;
  }

  private parseScriptOutput(content: string, _chapters: ImportOutput['chapters']): ScriptOutput {
    try {
      // 尝试解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || '未命名剧本',
          scenes: parsed.scenes || [],
          totalDuration: parsed.scenes?.reduce((sum: number, s: { duration?: number }) => sum + (s.duration || 30), 0) || 0,
        };
      }
    } catch {
      logger.warn('[ScriptStep] Failed to parse JSON, using fallback');
    }

    // Fallback：按行解析
    const scenes: ScriptOutput['scenes'] = [];
    const lines = content.split('\n').filter(l => l.trim());

    lines.forEach((line, idx) => {
      if (line.includes('：') || line.includes(':')) {
        scenes.push({
          id: `scene-${idx}`,
          title: `场景${idx + 1}`,
          description: line,
          dialogue: '',
          duration: 30,
          shots: 2,
        });
      }
    });

    return {
      title: '剧本',
      scenes: scenes.length > 0 ? scenes : [{
        id: 'scene-1',
        title: '场景1',
        description: content.slice(0, 200),
        dialogue: '',
        duration: 60,
        shots: 3,
      }],
      totalDuration: scenes.reduce((sum, s) => sum + (s.duration ?? 30), 0),
    };
  }
}

export function createScriptStep(config?: ScriptStepConfig): ScriptStep {
  return new ScriptStep(config);
}

export default ScriptStep;
