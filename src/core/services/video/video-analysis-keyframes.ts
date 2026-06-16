/**
 * 视频关键帧提取
 * @module core/services/video/video-analysis-keyframes
 *
 * 提取自原 `VideoAnalysisService.extractKeyframes`。
 * 行为字节级一致：按 `duration / (count + 1)` 间隔均匀采样。
 */

import { v4 as uuidv4 } from 'uuid';

import type { Keyframe, VideoInfo } from '@/shared/types';
import { formatTime } from '@/shared/utils';

/**
 * 均匀提取 count 个关键帧
 *
 * @param videoInfo 视频元信息
 * @param count 期望关键帧数（默认 10）
 * @returns Keyframe 数组，thumbnail 留空由前端 Canvas 生成
 */
export function extractKeyframes(videoInfo: VideoInfo, count: number = 10): Keyframe[] {
  const keyframes: Keyframe[] = [];
  const duration = videoInfo.duration!;
  const interval = duration / (count + 1);

  for (let i = 1; i <= count; i++) {
    const timestamp = Math.round(interval * i);
    keyframes.push({
      id: uuidv4(),
      timestamp,
      thumbnail: '', // 缩略图由前端使用 Canvas 生成
      description: `第 ${i} 个关键帧于 ${formatTime(timestamp)}`,
    });
  }

  return keyframes;
}
