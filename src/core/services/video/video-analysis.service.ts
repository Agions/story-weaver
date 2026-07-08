/**
 * AI 视频分析服务 - Video Analysis Service（facade）
 *
 * 历史背景：本文件原为 436 行单类，承担配置 / 主分析编排 / 关键帧 / 场景 / 物体 /
 * 情感 / 摘要 / 统计 / 建议 / AbortController 生命周期十类职责。第 17 轮重构拆为
 * 9 个子模块（types / keyframes / scenes / objects / emotions / summary / stats /
 * suggestions / abort-registry），本 facade 保留所有对外公开 API 签名以保证
 * 调用方零改动。
 *
 * 拆分思路：
 * 1. 配置 / 常量集中在 types（场景描述字典、情感标签、物体类别、bbox / 置信度生成器）
 * 2. 关键帧 / 场景 / 物体 / 情感拆为独立模块（每个模块一个主函数 + 辅助纯函数）
 * 3. 摘要拆为 summary（AI 调用 + 默认摘要 + prompt + 分组）
 * 4. 统计拆为 stats（4 个独立计数 + 通用 countBy helper）
 * 5. 建议拆为 suggestions（4 个 builder + 顺序求值）
 * 6. AbortController 拆为 abort-registry（可复用注册表）
 * 7. 类主流程只剩"编排"——analyzeVideo 串接各阶段 + 取消 + 建议
 *
 * 公共方法挂载：原类有 extractKeyframes / detectScenes / detectObjects / analyzeEmotions
 * 4 个独立公共方法。重构后通过类字段绑定对应模块函数，保持 `videoAnalysisService.xxx()` API 完全兼容。
 */

import { aiService } from '@/core/services/ai/text/ai.service';
import type { VideoAnalysis, VideoInfo } from '@/shared/types';

import { AbortControllerRegistry } from './video-analysis-abort-registry';
import { analyzeEmotions } from './video-analysis-emotions';
import { extractKeyframes } from './video-analysis-keyframes';
import { detectObjects } from './video-analysis-objects';
import { detectScenes } from './video-analysis-scenes';
import { calculateStats } from './video-analysis-stats';
import { getSuggestions } from './video-analysis-suggestions';
import { generateSummary } from './video-analysis-summary';
import {
  DEFAULT_ANALYSIS_CONFIG,
  createEmptyAnalysis,
  type VideoAnalysisConfig,
} from './video-analysis-types';

// 重导出公共类型与常量，保持 `@/core/services/video/video-analysis.service` 一站式导入
export { DEFAULT_ANALYSIS_CONFIG, SCENE_TYPES } from './video-analysis-types';
export type { SceneType, VideoAnalysisConfig } from './video-analysis-types';

/**
 * AI 视频分析服务
 *
 * 内部维护：
 *   - abortRegistry: 跟踪所有进行中分析任务的 AbortController
 *
 * 子流程方法以类字段方式挂载（`extractKeyframes = extractKeyframes`），
 * 保持与原公共方法签名一致；分析编排走 analyzeVideo。
 */
class VideoAnalysisService {
  private abortRegistry = new AbortControllerRegistry();

  // ========== 子流程方法（类字段绑定，保持 API 兼容） ==========

  /** 均匀提取关键帧 */
  extractKeyframes = extractKeyframes;

  /** 场景检测 */
  detectScenes = detectScenes;

  /** 物体检测 */
  detectObjects = detectObjects;

  /** 情感分析 */
  analyzeEmotions = analyzeEmotions;

  /** AI 摘要（失败时回退到默认摘要） */
  generateSummary = generateSummary;

  // ========== 主流程编排 ==========

  /**
   * 完整的视频分析
   *
   * 编排顺序：关键帧 → 场景 → 物体 → 情感 → 摘要 → 统计
   * （与原 analyzeVideo 字节级一致，可由 config.* 开关禁用各阶段）
   */
  async analyzeVideo(
    videoInfo: VideoInfo,
    config: Partial<VideoAnalysisConfig> = {}
  ): Promise<VideoAnalysis> {
    const finalConfig = { ...DEFAULT_ANALYSIS_CONFIG, ...config };
    const result = createEmptyAnalysis(videoInfo);

    // 【v3.3 代码审查】移除无用 try/catch（no-useless-catch）：
    // 原 try { ... } catch (e) { throw e } 等价于直接执行 ...。
    // 异常透传由调用方 / 运行时错误边界统一处理。
    if (finalConfig.enableKeyframeExtraction) {
      result.keyframes = await this.extractKeyframes(videoInfo, finalConfig.maxKeyframes);
    }
    if (finalConfig.enableSceneDetection) {
      result.scenes = await this.detectScenes(videoInfo, finalConfig.sceneThreshold);
    }
    if (finalConfig.enableObjectDetection) {
      result.objects = await this.detectObjects(videoInfo, result.scenes);
    }
    if (finalConfig.enableEmotionAnalysis) {
      result.emotions = await this.analyzeEmotions(videoInfo, result.scenes);
    }
    if (finalConfig.enableContentSummary) {
      result.summary = await this.generateSummary(videoInfo, result, aiService);
    }
    result.stats = calculateStats(result);

    return result;
  }

  /**
   * 取消正在进行的分析
   *
   * 注意：当前实现中各阶段（关键帧 / 场景 / 物体 / 情感 / 摘要）内部未使用 AbortSignal，
   * 因此 cancelAnalysis 实际仅清理注册表。保留 API 以便后续接入真实可中断的实现。
   */
  cancelAnalysis(analysisId: string): void {
    this.abortRegistry.cancel(analysisId);
  }

  /**
   * 获取视频分析改进建议
   *
   * 行为与原 `VideoAnalysisService.getSuggestions` 字节级一致。
   */
  getSuggestions(analysis: VideoAnalysis): string[] {
    return getSuggestions(analysis);
  }
}

export const videoAnalysisService = new VideoAnalysisService();
export default videoAnalysisService;
