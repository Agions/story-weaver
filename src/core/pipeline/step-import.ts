import { novelService } from '@/core/services/ai/text/novel-service';
import { logger } from '@/core/utils/logger';

import { BasePipelineStep } from './base-pipeline-step';
import { PipelineStepId, PipelineStep, StepInput, PipelineExecutionMode } from './pipeline-types';
import { getContext } from './step-helpers';

export const IMPORT_STEP_CONFIG = {
  id: 'step-import',
  name: '导入与解析',
  stepId: PipelineStepId.IMPORT,
  mode: PipelineExecutionMode.SEQUENCE,
};

export interface ImportInput {
  rawContent: string;
  sourceType: 'novel' | 'script' | 'prompt';
  filename?: string;
  language?: 'zh' | 'en';
  [key: string]: unknown;
}

export interface ImportOutput {
  chapters: Array<{ id: string; title: string; content: string; wordCount: number }>;
  metadata: {
    title: string;
    author?: string;
    wordCount: number;
    chapterCount: number;
    language: string;
  };
  rawContent: string;
  [key: string]: unknown;
}

// ========== ImportStep 实现 ==========

export class ImportStep extends BasePipelineStep {
  constructor(config?: Partial<PipelineStep>) {
    super({
      ...config,
      id: config?.id ?? IMPORT_STEP_CONFIG.id,
      name: config?.name ?? IMPORT_STEP_CONFIG.name,
      stepId: config?.stepId ?? PipelineStepId.IMPORT,
    });
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = getContext(input)!;
    logger.info(`[ImportStep] Starting import for workflow ${input.workflowId}`);

    const importInput =
      (input.prevStepOutputs?.get(this.stepId)?.data as ImportInput) ??
      context.getVariable<ImportInput>('importInput');

    if (!importInput?.rawContent) {
      throw new Error('No content to import');
    }

    this.reportProgress(10, '正在识别内容格式...');

    const detectedType = this.detectContentType(importInput.rawContent);
    this.reportProgress(30, '正在解析内容结构...');

    let result: ImportOutput;

    if (importInput.sourceType === 'novel' || detectedType === 'novel') {
      const parseResult = await novelService.parseNovel(importInput.rawContent, {});
      result = {
        chapters: parseResult.chapters.map((ch, idx) => ({
          id: ch.id ?? `ch-${idx}`,
          title: ch.title || `第${idx + 1}章`,
          content: ch.content,
          wordCount: ch.wordCount,
        })),
        metadata: {
          title: parseResult.title || importInput.filename || '未命名',
          author: parseResult.author,
          wordCount: parseResult.totalWords,
          chapterCount: parseResult.chapters.length,
          language: importInput.language || 'zh',
        },
        rawContent: importInput.rawContent,
      };
    } else {
      result = {
        chapters: [
          {
            id: 'ch-1',
            title: importInput.filename || '内容',
            content: importInput.rawContent,
            wordCount: importInput.rawContent.length,
          },
        ],
        metadata: {
          title: importInput.filename || '未命名',
          wordCount: importInput.rawContent.length,
          chapterCount: 1,
          language: importInput.language || 'zh',
        },
        rawContent: importInput.rawContent,
      };
    }

    this.reportProgress(90, '解析完成');

    context.setVariable('chapters', result.chapters);
    context.setVariable('projectMetadata', result.metadata);
    context.setVariable('rawContent', result.rawContent);

    logger.success(`[ImportStep] Import completed: ${result.chapters.length} chapters`);

    return result;
  }

  protected computeMetrics(result: unknown): Record<string, unknown> {
    return this.computeCountMetric(result, 'chapters');
  }

  private detectContentType(content: string): 'novel' | 'script' | 'prompt' {
    const trimmed = content.trim();
    if (/第[一二三四五六七八九十\d]+场|第\s*\d+\s*场/.test(trimmed)) return 'script';
    if (/^(\/|#)/.test(trimmed)) return 'prompt';
    return 'novel';
  }
}

// ========== 工厂函数 ==========

export function createImportStep(config?: Partial<PipelineStep>): ImportStep {
  return new ImportStep(config);
}

export default ImportStep;
