/**
 * Video Service Facade
 * ====================
 * 统一对外的"视频处理"门面，把 4 个子模块的纯函数 + 内部循环编排成完整服务。
 *
 * 内部按职责拆分到 4 个 sibling 文件：
 * - video-constants.ts                : 全部常量 / 字典
 * - ffmpeg-command-builder.ts         : 流式 builder
 * - video-info-extractor.ts           : File → VideoInfo (DOM)
 * - thumbnail-capture.ts              : video 帧 → dataURL (Canvas)
 * - video-ffmpeg-operations.ts        : 4 个 ffmpeg CLI 操作
 * - duration-formatter.ts             : 时长格式化
 *
 * 设计原则：
 * 1. 公共方法签名保持与原代码完全一致，测试零修改
 * 2. extractKeyframes / detectScenes / analyzeVideo 这 3 个方法
 *    内部用 `this.xxx` 调用同类其它方法 —— 这样测试可以用
 *    `jest.spyOn(videoService, 'generateThumbnail')` 拦截
 * 3. 私有方法 / 内部 helper 一律下沉到纯函数模块
 * 4. 单例导出 `videoService` (兼容 core facade 转发)
 */

import { v4 as uuidv4 } from 'uuid';

import { logger } from '@/core/utils/logger';
import type { VideoInfo, VideoAnalysis, VideoScene, Keyframe } from '@/shared/types';
import { formatFileSize } from '@/shared/utils';

import { formatVideoDuration } from './duration-formatter';
import { captureVideoFrameAsDataURL } from './thumbnail-capture';
import {
  DEFAULT_KEYFRAME_COUNT,
  DEFAULT_SCENE_DURATION_SEC,
  DEFAULT_SCENE_DETECTION_THRESHOLD,
  DEFAULT_THUMBNAIL_WIDTH,
} from './video-constants';
import {
  exportVideo,
  clipVideo,
  mergeVideos,
  addSubtitles,
  convertFormat,
  type VideoExportOptions,
  type SubtitleStyle,
} from './video-ffmpeg-operations';
import { extractVideoInfoFromFile } from './video-info-extractor';

class VideoService {
  /**
   * Get video information (DOM-driven File → VideoInfo)
   */
  async getVideoInfo(file: File): Promise<VideoInfo> {
    return extractVideoInfoFromFile(file);
  }

  /**
   * Generate thumbnail at a specific timestamp
   */
  async generateThumbnail(
    videoPath: string,
    timestamp: number = 0,
    width: number = DEFAULT_THUMBNAIL_WIDTH
  ): Promise<string> {
    return captureVideoFrameAsDataURL(videoPath, timestamp, width);
  }

  /**
   * Extract keyframes (evenly distributed)
   * 内部循环里调 this.generateThumbnail 以便测试可 spy
   */
  async extractKeyframes(
    videoPath: string,
    duration: number,
    count: number = DEFAULT_KEYFRAME_COUNT
  ): Promise<Keyframe[]> {
    const keyframes: Keyframe[] = [];
    const interval = duration / (count + 1);

    for (let i = 1; i <= count; i++) {
      const timestamp = Math.round(interval * i);
      try {
        const thumbnail = await this.generateThumbnail(videoPath, timestamp);
        keyframes.push({
          id: uuidv4(),
          timestamp,
          thumbnail,
          description: `Keyframe ${i}`,
        });
      } catch (error) {
        logger.error(`Failed to extract keyframe ${i}:`, error);
      }
    }

    return keyframes;
  }

  /**
   * Detect scenes (fixed-window cut)
   * 内部循环里调 this.generateThumbnail 以便测试可 spy
   */
  async detectScenes(
    videoPath: string,
    duration: number,
    _threshold: number = DEFAULT_SCENE_DETECTION_THRESHOLD
  ): Promise<VideoScene[]> {
    const scenes: VideoScene[] = [];
    const sceneDuration = DEFAULT_SCENE_DURATION_SEC;
    const sceneCount = Math.floor(duration / sceneDuration);

    for (let i = 0; i < sceneCount; i++) {
      const startTime = i * sceneDuration;
      const endTime = Math.min((i + 1) * sceneDuration, duration);

      try {
        const thumbnail = await this.generateThumbnail(videoPath, startTime);
        scenes.push({
          id: uuidv4(),
          startTime,
          endTime,
          thumbnail,
          description: `Scene ${i + 1}`,
          tags: [`scene${i + 1}`],
        });
      } catch (error) {
        logger.error(`Failed to detect scene ${i}:`, error);
      }
    }

    return scenes;
  }

  /**
   * Analyze video: keyframes + scenes + summary
   * 内部用 this.extractKeyframes / this.detectScenes 以便测试可 spy
   */
  async analyzeVideo(videoInfo: VideoInfo): Promise<VideoAnalysis> {
    const [keyframes, scenes] = await Promise.all([
      this.extractKeyframes(videoInfo.path!, videoInfo.duration!, DEFAULT_KEYFRAME_COUNT),
      this.detectScenes(videoInfo.path!, videoInfo.duration!),
    ]);

    return {
      id: uuidv4(),
      videoId: videoInfo.id,
      scenes,
      keyframes,
      objects: [],
      emotions: [],
      summary: `Video duration ${formatVideoDuration(videoInfo.duration!)}, resolution ${videoInfo!.width}x${videoInfo!.height}, contains ${scenes.length} scenes.`,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate preview (placeholder: returns input path as-is)
   */
  async generatePreview(videoPath: string, _startTime: number, _endTime: number): Promise<string> {
    return videoPath;
  }

  /**
   * Export video with quality/resolution/subtitle options
   */
  async exportVideo(
    inputPath: string,
    outputPath: string,
    options: VideoExportOptions
  ): Promise<string> {
    return exportVideo(inputPath, outputPath, options);
  }

  /**
   * Clip video between start/end
   */
  async clipVideo(
    inputPath: string,
    outputPath: string,
    startTime: number,
    endTime: number
  ): Promise<string> {
    return clipVideo(inputPath, outputPath, startTime, endTime);
  }

  /**
   * Merge multiple videos via concat demuxer
   */
  async mergeVideos(inputPaths: string[], outputPath: string): Promise<string> {
    return mergeVideos(inputPaths, outputPath);
  }

  /**
   * Burn subtitles into video
   */
  async addSubtitles(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    style?: SubtitleStyle
  ): Promise<string> {
    return addSubtitles(videoPath, subtitlePath, outputPath, style);
  }

  /**
   * Convert video to a different container format
   */
  async convertFormat(inputPath: string, outputPath: string, format: string): Promise<string> {
    return convertFormat(inputPath, outputPath, format);
  }

  /**
   * Format duration (mm:ss or hh:mm:ss)
   * Currently unused — suppress unused error.
   */
  public _formatDuration(seconds: number): string {
    return formatVideoDuration(seconds);
  }

  /**
   * Format file size (delegates to shared/utils)
   */
  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }
}

export const videoService = new VideoService();
export default videoService;
