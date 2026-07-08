import { logger } from '@/core/utils/logger';

import { BasePipelineStep } from './base-pipeline-step';
import { PipelineStepId, PipelineStep, StepInput } from './pipeline.types';
import type { ImportOutput } from './step-import';

// ========== AnalysisStep 实现 ==========

export class AnalysisStep extends BasePipelineStep {
  constructor(config?: Partial<PipelineStep>) {
    super({
      ...config,
      id: config?.id ?? 'step-analysis',
      name: config?.name ?? 'AI分析',
      stepId: config?.stepId ?? PipelineStepId.ANALYSIS,
      dependencies: config?.dependencies ?? [PipelineStepId.IMPORT],
    });
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = input.context;
    logger.info(`[AnalysisStep] Analyzing content for workflow ${input.workflowId}`);

    const chapters = context.getVariable<ImportOutput['chapters']>('chapters');
    const metadata = context.getVariable<ImportOutput['metadata']>('projectMetadata');

    if (!chapters || chapters.length === 0) {
      throw new Error('No chapters to analyze');
    }

    this.reportProgress(20, '正在识别角色...');

    const characterCount = await this.estimateCharacterCount(chapters);

    this.reportProgress(50, '正在识别场景...');

    const sceneCount = this.estimateSceneCount(chapters);

    this.reportProgress(80, '正在生成分析报告...');

    const analysisResult = {
      totalChapters: chapters.length,
      estimatedCharacters: characterCount,
      estimatedScenes: sceneCount,
      chaptersSummary: chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        wordCount: ch.wordCount,
      })),
      genre: metadata?.title || '通用',
      language: metadata?.language || 'zh',
    };

    context.setVariable('analysisResult', analysisResult);
    context.setVariable('estimatedCharacters', characterCount);
    context.setVariable('estimatedScenes', sceneCount);

    logger.success(
      `[AnalysisStep] Analysis completed: ${characterCount} characters, ${sceneCount} scenes`
    );

    return analysisResult;
  }

  protected computeMetrics(result: unknown): Record<string, unknown> {
    return this.computeNumericMetric(result, 'estimatedScenes');
  }

  private estimateCharacterCount(chapters: ImportOutput['chapters']): number {
    const allContent = chapters.map((ch) => ch.content).join('');
    const namePatterns = [/[A-Z][a-z]{1,20}/g, /[\u4e00-\u9fa5]{2,4}/g];
    const names = new Set<string>();
    for (const pattern of namePatterns) {
      const matches = allContent.match(pattern);
      if (matches) {
        matches.forEach((n) => names.add(n));
      }
    }
    return Math.min(names.size, 20);
  }

  private estimateSceneCount(chapters: ImportOutput['chapters']): number {
    return chapters.reduce((sum, ch) => {
      const sceneMarkers = ch.content.match(/第.*?(章|节|幕)/g);
      return sum + (sceneMarkers?.length || 1);
    }, 0);
  }
}

// ========== 工厂函数 ==========

export function createAnalysisStep(config?: Partial<PipelineStep>): AnalysisStep {
  return new AnalysisStep(config);
}

export default AnalysisStep;
