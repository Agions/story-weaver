/**
 * 视频脚本流水线服务 - Manga Pipeline Service（facade）
 *
 * 历史背景：本文件原为 325 行单类，承担 4 类型 + 4 阶段编排 + AbortController 生命周期
 * + 进度推送 + 取消包装 + 2 个独立方法。第 20 轮重构拆为 8 个子模块
 * （types / progress / stage-images / stage-audio / stage-lipsync / stage-compose /
 * orchestrator / extra），本 facade 保留所有对外公开 API 签名以保证 1 个外部调用方
 * + 1 个测试文件零改动。
 *
 * 拆分思路：
 * 1. 4 类型 + 阶段进度百分比 + 默认配置常量集中在 types
 * 2. 进度推送从类成员收敛到 ProgressEmitter 独立类
 * 3. 4 阶段各自拆为 stage-*.ts 模块（images / audio / lipsync / compose）
 * 4. 取消检查（3 处 if signal.aborted 重复）抽为 ensureNotAborted 工具
 * 5. failed / completed 包装 + cancelled 判定抽为 orchestrator 工具
 * 6. generateFromImages + generateTalkingVideo 抽到 extra
 * 7. 类主流程只剩"编排 + 状态管理"——内部状态 emitter / 取消时 abort
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

// 重导出公共类型，保持 `@/core/services/domain/manga-pipeline.service` 一站式导入
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
   * 编排顺序：images → audio → lipsync → compose（由 runPipeline 内部完成）
   * AbortController 生命周期由本方法管理，外部 options.signal 优先。
   */
  async generateFromNovel(
    novelContent: string,
    scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[],
    options: { signal?: AbortSignal } = {}
  ): Promise<PipelineResult> {
    this.abortController = new AbortController();
    return runPipeline(
      novelContent,
      scenes,
      this.config,
      { signal: options.signal || this.abortController.signal },
      this.emitter
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
