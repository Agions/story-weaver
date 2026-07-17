/**
 * 音频领域类型
 *
 * Canonical definitions — migrated from deleted @/types/media.
 */

/** 配音轨道 */
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

/** 背景音乐 */
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

/** 音效 */
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

/** 完整音频轨道配置 */
export interface AudioTrackConfig {
  voiceTracks: VoiceTrack[];
  backgroundMusic: BackgroundMusic | null;
  soundEffects: SoundEffect[];
  masterVolume: number;
  voiceVolume: number;
  musicVolume: number;
  effectVolume: number;
}