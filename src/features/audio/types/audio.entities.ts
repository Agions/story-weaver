/**
 * 音频编辑模块 - 领域实体类型
 * 所有音频相关类型定义，供 AudioEditor 及子组件共享
 */

import { DEFAULT_VOLUME } from '@frame-fab/common/constants';

// ========== 配音轨道类型 ==========

export interface VoiceTrack {
  id: string;
  name: string;
  filePath: string;
  fileUrl?: string;
  duration: number;
  startTime: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  type: 'dubbing' | 'voiceover';
}

// ========== 背景音乐类型 ==========

export interface BackgroundMusic {
  id: string;
  name: string;
  filePath: string;
  fileUrl?: string;
  duration: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
  startTime: number;
}

// ========== 音效类型 ==========

export interface SoundEffect {
  id: string;
  name: string;
  filePath: string;
  fileUrl?: string;
  duration: number;
  volume: number;
  startTime: number;
  category: string;
}

// ========== 音频轨道完整配置 ==========

export interface AudioTrackConfig {
  voiceTracks: VoiceTrack[];
  backgroundMusic: BackgroundMusic | null;
  soundEffects: SoundEffect[];
  masterVolume: number;
  voiceVolume: number;
  musicVolume: number;
  effectVolume: number;
}

// ========== 播放状态类型 ==========

export interface AudioPlaybackState {
  playingVoiceId: string | null;
  playingMusic: boolean;
  playingSfxId: string | null;
}

// ========== 混音预设音量 ==========

export const DEFAULT_AUDIO_VOLUME = DEFAULT_VOLUME;

// ========== 音频文件扩展名白名单 ==========

export const AUDIO_FILE_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
