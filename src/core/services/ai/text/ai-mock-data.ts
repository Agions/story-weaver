/**
 * AI Mock 数据生成器
 *
 * 把 AIService 中 4 个生成 mock 数据的纯方法剥离：
 * - generateMockScenes：按 30 秒切分场景
 * - generateMockKeyframes：按 5 秒切分关键帧
 * - parseScriptSegments：按段落解析脚本片段
 * - estimateDuration：按字数估算时长（150 字/分钟）
 *
 * 这些都是无副作用的纯函数，独立可测。
 */

import type { Keyframe, VideoScene, ScriptSegment } from './ai-service-types';

/** 默认场景切分间隔（秒） */
const SCENE_INTERVAL_SECONDS = 30;
/** 默认关键帧切分间隔（秒） */
const KEYFRAME_INTERVAL_SECONDS = 5;
/** 场景最大数量上限 */
const MAX_SCENE_COUNT = 10;
/** 关键帧最大数量上限 */
const MAX_KEYFRAME_COUNT = 20;
/** 中文朗读速度估算：150 字/分钟 */
const CHINESE_WORDS_PER_MINUTE = 150;

/**
 * 按固定间隔把视频时长切分为若干场景。
 * 行为与原 generateMockScenes 完全一致：最多 10 个场景，每个 30 秒。
 */
export function generateMockScenes(durationSeconds: number): VideoScene[] {
  const sceneCount = Math.min(
    Math.floor(durationSeconds / SCENE_INTERVAL_SECONDS),
    MAX_SCENE_COUNT
  );
  const scenes: VideoScene[] = [];

  for (let i = 0; i < sceneCount; i++) {
    scenes.push({
      id: `scene_${i + 1}`,
      startTime: i * SCENE_INTERVAL_SECONDS,
      endTime: Math.min((i + 1) * SCENE_INTERVAL_SECONDS, durationSeconds),
      thumbnail: '',
      description: `场景 ${i + 1}`,
      tags: [`场景${i + 1}`],
    });
  }

  return scenes;
}

/**
 * 按固定间隔把视频时长切分为若干关键帧。
 * 行为与原 generateMockKeyframes 完全一致：最多 20 个，每 5 秒一个。
 */
export function generateMockKeyframes(durationSeconds: number): Keyframe[] {
  const count = Math.min(
    Math.floor(durationSeconds / KEYFRAME_INTERVAL_SECONDS),
    MAX_KEYFRAME_COUNT
  );
  const keyframes: Keyframe[] = [];

  for (let i = 0; i < count; i++) {
    keyframes.push({
      id: `kf_${i + 1}`,
      timestamp: i * KEYFRAME_INTERVAL_SECONDS,
      thumbnail: '',
      description: `关键帧 ${i + 1}`,
    });
  }

  return keyframes;
}

/**
 * 按空行分段把脚本文本解析成 ScriptSegment 数组。
 * 行为与原 parseScriptSegments 完全一致：
 * - 第一段 → 'narration'
 * - 最后一段 → 'narration'
 * - 中间段 → 'dialogue'
 * - 每段默认时长 30 秒
 */
export function parseScriptSegments(content: string): ScriptSegment[] {
  const paragraphs = content.split('\n\n').filter((p) => p.trim());

  return paragraphs.map((paragraph, index) => ({
    id: `seg_${index + 1}`,
    startTime: index * SCENE_INTERVAL_SECONDS,
    endTime: (index + 1) * SCENE_INTERVAL_SECONDS,
    content: paragraph.trim(),
    type: index === 0 ? 'narration' : index === paragraphs.length - 1 ? 'narration' : 'dialogue',
  }));
}

/**
 * 按字数估算时长（秒）。向上取整。
 */
export function estimateDuration(wordCount: number): number {
  return Math.ceil(wordCount / CHINESE_WORDS_PER_MINUTE);
}
