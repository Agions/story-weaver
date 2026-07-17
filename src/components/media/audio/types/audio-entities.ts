/**
 * 音频编辑模块 - 领域实体类型
 * 单一来源：@/shared/types/audio（本文件保留 re-export 以维持向后兼容）
 */

export type {
  VoiceTrack,
  BackgroundMusic,
  SoundEffect,
  AudioTrackConfig,
} from '@/shared/types/audio';

import { DEFAULT_VOLUME } from '@/shared/constants/media-presets';

/** 播放状态类型（仅本模块使用） */
export interface AudioPlaybackState {
  playingVoiceId: string | null;
  playingMusic: boolean;
  playingSfxId: string | null;
}

export const DEFAULT_AUDIO_VOLUME = DEFAULT_VOLUME;

export const AUDIO_FILE_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
