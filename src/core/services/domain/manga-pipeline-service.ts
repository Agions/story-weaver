/**
 * 视频脚本流水线服务 - Manga Pipeline Service（facade）
 *
 * 内部基于 PipelineEngine 统一编排，对外 API 保持不变。
 * 4 阶段（images → audio → lipsync → compose）以 PipelineStep 形式
 * 注册到 PipelineEngine，复用引擎的 cancel / checkpoint / event 能力。
 *
 * @module core/services/domain/manga-pipeline-service
 */

import {
  generateFromImages as runGenerateFromImages,
  generateTalkingVideo as runGenerateTalkingVideo,
} from './manga-pipeline-extra';
import { runPipeline } from './manga-pipeline-orchestrator';
import { ProgressEmitter } from './manga-pipeline-progress';
import {
  type PipelineConfig,
  type PipelineProgress,
  type PipelineResult,
  type PipelineScene,
} from './manga-pipeline-types';

// 重导出公共类型，保持 `@/core/services/domain/manga-pipeline-service` 一站式导入
export type {
  PipelineConfig,
  PipelineProgress,
  PipelineResult,
  PipelineScene,
} from './manga-pipeline-types';

/**
 * 视频脚本流水线服务
 *
 * 内部维护：
 *   - config: 流水线配置
 *   - emitter: 进度推送器
 *   - abortController: 当前运行管线的 AbortController
 */
export class MangaPipelineService {
  private config: PipelineConfig;
  private emitter = new ProgressEmitter();
  private abortController?: AbortController;

  constructor(config: PipelineConfig = {}) {
    this.config = config;
  }

  /** 设置进度回调 */
  onProgress(callback: (progress: PipelineProgress) => void): void {
    this.emitter.setCallback(callback);
  }

  /** 取消当前流水线执行 */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * 从小说内容生成完整流水线
   *
   * 编排顺序：images → audio → lipsync → compose
   * AbortController 生命周期由本方法管理，外部 options.signal 优先。
   */
  async generateFromNovel(
    novelContent: string,
    scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[],
    options: { signal?: AbortSignal } = {}
  ): Promise<PipelineResult> {
    this.abortController = new AbortController();
    const signal = options.signal || this.abortController.signal;

    return runPipeline(
      novelContent,
      scenes,
      this.config,
      { signal },
      this.emitter.getCallback()
    );
  }

  /**
   * 从图像生成视频（独立轻量入口）
   */
  async generateFromImages(
    images: { url: string; prompt: string }[],
    options: { signal?: AbortSignal } = {}
  ): Promise<Awaited<ReturnType<typeof runGenerateFromImages>>> {
    return runGenerateFromImages(images, this.config, options, this.emitter);
  }

  /** 生成口型视频（单行委托） */
  generateTalkingVideo(imageUrl: string, audioUrl: string) {
    return runGenerateTalkingVideo(imageUrl, audioUrl);
  }
}

// 单例导出
export const mangaPipelineService = new MangaPipelineService();
export default mangaPipelineService;
