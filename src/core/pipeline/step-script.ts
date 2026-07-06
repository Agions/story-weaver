import { aiService } from '@/core/services/ai/text/ai.service';
import { logger } from '@/core/utils/logger';

import { BasePipelineStep } from './base-pipeline-step';
import {
  PipelineStepId,
  StepInput,
  RetryPolicy,
  StepProgressEvent,
  PipelineExecutionMode,
} from './pipeline.types';
import type { ImportOutput } from './step-import';

// ========== 配置与输出接口 ==========

export interface ScriptStepConfig {
  id?: string;
  name?: string;
  stepId?: PipelineStepId;
  mode?: PipelineExecutionMode;
  retryPolicy?: RetryPolicy;
  dependencies?: PipelineStepId[];
  parallelKeys?: string[];
  onProgress?: (event: StepProgressEvent) => void;
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

// ========== ScriptStep 实现 ==========

export class ScriptStep extends BasePipelineStep {
  private model: string;
  private provider: string;
  private lastTokenCount = 0;

  constructor(config?: ScriptStepConfig) {
    super({
      ...config,
      id: config?.id ?? 'step-script',
      name: config?.name ?? '剧本生成',
      stepId: config?.stepId ?? PipelineStepId.SCRIPT,
      dependencies: config?.dependencies ?? [PipelineStepId.IMPORT, PipelineStepId.ANALYSIS],
    });
    this.model = config?.model ?? 'glm-5';
    this.provider = config?.provider ?? 'zhipu';
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = input.context;
    logger.info(`[ScriptStep] Generating script for workflow ${input.workflowId}`);

    const analysisResult = context.getVariable<ImportOutput>('analysisResult');
    const chapters = context.getVariable<ImportOutput['chapters']>('chapters');

    if (!chapters || chapters.length === 0) {
      throw new Error('No content to generate script from');
    }

    this.reportProgress(10, '正在构建剧本生成提示词...');

    const prompt = this.buildScriptPrompt(chapters, analysisResult);

    this.reportProgress(30, '正在生成剧本结构...');

    const scriptContent = await aiService.generate(prompt, {
      model: this.model,
      provider: this.provider,
      max_tokens: 8192,
    });

    this.reportProgress(70, '正在解析生成结果...');

    const scriptOutput = this.parseScriptOutput(scriptContent, chapters);

    this.reportProgress(90, '剧本生成完成');

    context.setVariable('scriptOutput', scriptOutput);
    context.setVariable('scenes', scriptOutput.scenes);

    logger.success(`[ScriptStep] Script generated: ${scriptOutput.scenes.length} scenes`);

    return scriptOutput;
  }

  protected computeMetrics(result: unknown): Record<string, unknown> {
    if (typeof result === 'string') {
      return { tokensUsed: result.length };
    }
    if (result && typeof result === 'object' && 'scenes' in (result as Record<string, unknown>)) {
      const r = result as { scenes: unknown[] };
      return { framesProcessed: r.scenes.length };
    }
    return {};
  }

  private buildScriptPrompt(
    chapters: ImportOutput['chapters'],
    analysisResult?: ImportOutput
  ): string {
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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          title?: string;
          scenes?: Array<{
            id?: string;
            title?: string;
            description?: string;
            dialogue?: string;
            narration?: string;
            duration?: number;
            shots?: number;
          }>;
        };
        return {
          title: parsed.title || '未命名剧本',
          scenes: (parsed.scenes ?? []).map((s, idx) => ({
            id: s.id || `scene-${idx}`,
            title: s.title || `场景${idx + 1}`,
            description: s.description || '',
            dialogue: s.dialogue || '',
            narration: s.narration,
            duration: s.duration,
            shots: s.shots,
          })),
          totalDuration: (parsed.scenes ?? []).reduce((sum, s) => sum + (s.duration || 30), 0) || 0,
        };
      }
    } catch {
      logger.warn('[ScriptStep] Failed to parse JSON, using fallback');
    }

    const scenes: ScriptOutput['scenes'] = [];
    const lines = content.split('\n').filter((l) => l.trim());

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
      scenes:
        scenes.length > 0
          ? scenes
          : [
              {
                id: 'scene-1',
                title: '场景1',
                description: content.slice(0, 200),
                dialogue: '',
                duration: 60,
                shots: 3,
              },
            ],
      totalDuration: scenes.reduce((sum, s) => sum + (s.duration ?? 30), 0),
    };
  }
}

// ========== 工厂函数 ==========

export function createScriptStep(config?: ScriptStepConfig): ScriptStep {
  return new ScriptStep(config);
}

export default ScriptStep;
