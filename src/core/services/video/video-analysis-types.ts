/**
 * 视频分析服务共享类型与常量
 * @module core/services/video/video-analysis-types
 *
 * 提取自原 video-analysis.service.ts 中散落的 interface / const / 场景描述字典 / 物体类别表。
 * 其它子模块（keyframes / scenes / objects / emotions / summary / stats / suggestions /
 * abort-registry）共用这套类型 + 字典。
 */

import { v4 as uuidv4 } from 'uuid';

import type { VideoAnalysis, VideoInfo } from '@/shared/types';

/** 视频分析配置 */
export interface VideoAnalysisConfig {
  enableSceneDetection: boolean; // 场景检测
  enableObjectDetection: boolean; // 物体识别
  enableEmotionAnalysis: boolean; // 情感分析
  enableContentSummary: boolean; // 内容摘要
  enableKeyframeExtraction: boolean; // 关键帧提取
  sceneThreshold: number; // 场景切换阈值
  maxKeyframes: number; // 最大关键帧数
}

/** 默认配置（与原 DEFAULT_ANALYSIS_CONFIG 字节级一致） */
export const DEFAULT_ANALYSIS_CONFIG: VideoAnalysisConfig = {
  enableSceneDetection: true,
  enableObjectDetection: true,
  enableEmotionAnalysis: true,
  enableContentSummary: true,
  enableKeyframeExtraction: true,
  sceneThreshold: 0.3,
  maxKeyframes: 10,
};

/** 预定义场景类型（与原 SCENE_TYPES 字面量完全一致） */
export const SCENE_TYPES = [
  'intro', // 开场
  'dialogue', // 对话
  'action', // 动作
  'narration', // 叙述
  'transition', // 转场
  'explanation', // 讲解
  'demo', // 演示
  'conclusion', // 结尾
  'background', // 背景
  'highlight', // 高光
] as const;

export type SceneType = (typeof SCENE_TYPES)[number];

/** 场景类型 → 中文描述字典（与原 getSceneDescription 内联表字节级一致） */
export const SCENE_DESCRIPTIONS: Record<SceneType, string> = {
  intro: '视频开场部分，通常用于介绍主题',
  dialogue: '对话场景，包含人物交流',
  action: '动作场景，展示具体行为',
  narration: '叙述场景，画外音或旁白',
  transition: '转场过渡',
  explanation: '讲解说明，解释内容',
  demo: '演示展示，操作示范',
  conclusion: '结尾总结，回顾要点',
  background: '背景画面',
  highlight: '精彩高光时刻',
};

/** 场景类型未知时的兜底文案 */
export const UNKNOWN_SCENE_DESCRIPTION = '未知场景类型';

/** 情感标签表（与原 analyzeEmotions 内联 emotionsList 字节级一致） */
export const EMOTION_LABELS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fear'] as const;
type EmotionLabel = (typeof EMOTION_LABELS)[number];

/** 物体类别表（与原 detectObjects 内联 objectCategories 字节级一致） */
export const OBJECT_CATEGORIES = ['人物', '物品', '文字', '背景', '动物', '车辆'] as const;

/** 常见物体表（与原 detectObjects 内联 commonObjects 字节级一致） */
export const COMMON_OBJECTS = [
  '人物',
  '人脸',
  '文字',
  '手机',
  '电脑',
  '书本',
  '桌子',
  '椅子',
  '窗户',
  '门',
  '杯子',
  '衣服',
] as const;

/** 场景检测平均时长（与原 detectScenes 内联 avgSceneDuration = 30 一致） */
export const SCENE_AVG_DURATION_SECONDS = 30;

/** 物体检测置信度随机生成（与原 detectObjects 内联 0.5 + 0.5 一致） */
export function generateObjectConfidence(): number {
  return 0.5 + Math.random() * 0.5;
}

/** 物体检测随机 bbox 生成（与原 detectObjects 内联 bbox 字节级一致） */
export function generateRandomBbox(): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.random() * 0.8,
    y: Math.random() * 0.8,
    width: 0.1 + Math.random() * 0.3,
    height: 0.1 + Math.random() * 0.3,
  };
}

/** 场景检测置信度随机生成（与原 0.7 + 0.3 一致） */
export function generateSceneConfidence(): number {
  return 0.7 + Math.random() * 0.3;
}

/** 场景类型从数组中按 index 循环取样（与原 detectScenes 内联一致） */
export function pickSceneTypeByIndex(
  index: number,
  samples: readonly SceneType[] = SCENE_TYPES.slice(0, 5)
): SceneType {
  return samples[index % samples.length] as SceneType;
}

/**
 * 构造一个空 VideoAnalysis（不包含任何分析数据，但 id / videoId / createdAt / stats 已就绪）
 *
 * @param videoInfo 当前视频元信息
 * @param analysisId 可选 id（默认 uuidv4）
 */
export function createEmptyAnalysis(videoInfo: VideoInfo, analysisId?: string): VideoAnalysis {
  return {
    id: analysisId ?? uuidv4(),
    videoId: videoInfo.id,
    scenes: [],
    keyframes: [],
    objects: [],
    emotions: [],
    summary: '',
    stats: {
      sceneCount: 0,
      objectCount: 0,
      avgSceneDuration: 0,
      sceneTypes: {},
      objectCategories: {},
      dominantEmotions: {},
    },
    createdAt: new Date().toISOString(),
  };
}
