/**
 * TTS / Dubbing Feature Slice
 *
 * 配音垂直切片：聚合 TTS 合成 + 唇同步 + 音频混合。
 * 对应 pipeline 步骤: step-audio-synthesis
 *
 * @module features/tts-dubbing
 */

import type { TTSProvider, TTSVoice } from '@/shared/types';

import { ttsService } from '@/core/services/audio/tts-service';

// ========== 类型定义 ==========

/** 配音角色配置 */
export interface DubbingCharacter {
  characterId: string;
  characterName: string;
  voiceId: string;
  provider: TTSProvider;
  speed?: number;
  pitch?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited';
}

/** 批量配音配置 */
export interface BatchDubbingConfig {
  characters: DubbingCharacter[];
  defaultProvider?: TTSProvider;
  defaultVoice?: string;
  outputFormat?: 'mp3' | 'wav' | 'ogg';
}

// ========== 服务胶水 ==========

/**
 * 获取可用 TTS 声音列表（feature 级过滤）
 */
export function getAvailableVoices(provider?: TTSProvider): TTSVoice[] {
  if (provider) {
    return ttsService.getVoices(provider);
  }
  return ttsService.getAllVoices();
}

/**
 * 根据角色情绪推荐声音
 */
export function recommendVoiceForEmotion(emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited'): TTSVoice | undefined {
  const emotionMap: Record<string, string[]> = {
    neutral: ['zh-CN-XiaoxiaoNeural', 'zh-CN-YunjianNeural'],
    happy: ['zh-CN-XiaoyiNeural', 'en-US-JennyNeural'],
    sad: ['zh-CN-YunxiNeural', 'en-US-GuyNeural'],
    angry: ['zh-CN-YunjianNeural', 'en-US-ChristopherNeural'],
    excited: ['zh-CN-XiaoyiNeural', 'en-US-JennyNeural'],
  };

  const key = emotion ?? 'neutral';
  const voiceIds = emotionMap[key];
  if (!voiceIds) return undefined;

  const allVoices = ttsService.getAllVoices();
  return allVoices.find((v) => voiceIds.includes(v.id));
}

// ========== 导出 ==========

export const ttsDubbingService = {
  getAvailableVoices,
  recommendVoiceForEmotion,
};

export default ttsDubbingService;
