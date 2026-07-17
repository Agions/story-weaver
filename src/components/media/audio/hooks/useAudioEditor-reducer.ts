/**
 * useAudioEditor Reducer — 状态机化
 *
 * 架构决策 (2026-06-11):
 *   useAudioEditor.ts 13 useState 化, 1 个 reducer 集中管理:
 *   - 音频轨道: voiceTracks / backgroundMusic / soundEffects
 *   - 音量: masterVolume / voiceVolume / musicVolume / effectVolume
 *   - 播放: playingVoiceId / playingMusic / playingSfxId / activeTab
 *   - 录音: isRecording / recordingTime
 *
 * 对外 API 不变: 13 setXxx 名字 + signature 保持兼容, 调用方 0 改动.
 */

import type {
  VoiceTrack,
  BackgroundMusic,
  SoundEffect,
  AudioPlaybackState,
} from '../types/audio-entities';
import { DEFAULT_AUDIO_VOLUME } from '../types/audio-entities';

// ─── 状态类型 ──────────────────────────────────────────────────────────────

export interface AudioEditorState {
  voiceTracks: VoiceTrack[];
  backgroundMusic: BackgroundMusic | null;
  soundEffects: SoundEffect[];
  masterVolume: number;
  voiceVolume: number;
  musicVolume: number;
  effectVolume: number;
  activeTab: string;
  playingVoiceId: string | null;
  playingMusic: boolean;
  playingSfxId: string | null;
  isRecording: boolean;
  recordingTime: number;
}

// ─── Action 类型 ───────────────────────────────────────────────────────────

export type AudioEditorAction =
  | { type: 'set'; key: keyof AudioEditorState; value: unknown }
  | {
      type: 'update';
      key: keyof AudioEditorState;
      updater: (prev: unknown) => unknown;
    };

// ─── 初始 State ────────────────────────────────────────────────────────────

export interface AudioEditorInitial {
  voiceTracks?: VoiceTrack[];
  backgroundMusic?: BackgroundMusic | null;
  soundEffects?: SoundEffect[];
  masterVolume?: number;
  voiceVolume?: number;
  musicVolume?: number;
  effectVolume?: number;
}

export const initialAudioEditorState = (initial?: AudioEditorInitial): AudioEditorState => ({
  voiceTracks: initial?.voiceTracks || [],
  backgroundMusic: initial?.backgroundMusic || null,
  soundEffects: initial?.soundEffects || [],
  masterVolume: initial?.masterVolume ?? DEFAULT_AUDIO_VOLUME.master,
  voiceVolume: initial?.voiceVolume ?? DEFAULT_AUDIO_VOLUME.voice,
  musicVolume: initial?.musicVolume ?? DEFAULT_AUDIO_VOLUME.music,
  effectVolume: initial?.effectVolume ?? DEFAULT_AUDIO_VOLUME.effect,
  activeTab: 'voice',
  playingVoiceId: null,
  playingMusic: false,
  playingSfxId: null,
  isRecording: false,
  recordingTime: 0,
});

// ─── Reducer ───────────────────────────────────────────────────────────────

export function audioEditorReducer(
  state: AudioEditorState,
  action: AudioEditorAction
): AudioEditorState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value } as AudioEditorState;
    case 'update':
      return {
        ...state,
        [action.key]: action.updater(state[action.key]),
      } as AudioEditorState;
    default:
      return state;
  }
}

// ─── Setter 工厂 ───────────────────────────────────────────────────────────

import { createFieldUpdater, type FieldUpdater as Updater } from '@/shared/utils/reducer-helpers';

// ─── 13 setter wrap ────────────────────────────────────────────────────────

export interface AudioEditorSetter {
  setVoiceTracks: (v: Updater<VoiceTrack[]>) => void;
  setBackgroundMusic: (v: Updater<BackgroundMusic | null>) => void;
  setSoundEffects: (v: Updater<SoundEffect[]>) => void;
  setMasterVolume: (v: Updater<number>) => void;
  setVoiceVolume: (v: Updater<number>) => void;
  setMusicVolume: (v: Updater<number>) => void;
  setEffectVolume: (v: Updater<number>) => void;
  setActiveTab: (v: Updater<string>) => void;
  setPlayingVoiceId: (v: Updater<string | null>) => void;
  setPlayingMusic: (v: Updater<boolean>) => void;
  setPlayingSfxId: (v: Updater<string | null>) => void;
  setIsRecording: (v: Updater<boolean>) => void;
  setRecordingTime: (v: Updater<number>) => void;
}

export function createAudioEditorSetters(
  dispatch: (action: AudioEditorAction) => void
): AudioEditorSetter {
  return {
    setVoiceTracks: createFieldUpdater(dispatch as (action: unknown) => void, 'voiceTracks'),
    setBackgroundMusic: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'backgroundMusic'
    ),
    setSoundEffects: createFieldUpdater(dispatch as (action: unknown) => void, 'soundEffects'),
    setMasterVolume: createFieldUpdater(dispatch as (action: unknown) => void, 'masterVolume'),
    setVoiceVolume: createFieldUpdater(dispatch as (action: unknown) => void, 'voiceVolume'),
    setMusicVolume: createFieldUpdater(dispatch as (action: unknown) => void, 'musicVolume'),
    setEffectVolume: createFieldUpdater(dispatch as (action: unknown) => void, 'effectVolume'),
    setActiveTab: createFieldUpdater(dispatch as (action: unknown) => void, 'activeTab'),
    setPlayingVoiceId: createFieldUpdater(dispatch as (action: unknown) => void, 'playingVoiceId'),
    setPlayingMusic: createFieldUpdater(dispatch as (action: unknown) => void, 'playingMusic'),
    setPlayingSfxId: createFieldUpdater(dispatch as (action: unknown) => void, 'playingSfxId'),
    setIsRecording: createFieldUpdater(dispatch as (action: unknown) => void, 'isRecording'),
    setRecordingTime: createFieldUpdater(dispatch as (action: unknown) => void, 'recordingTime'),
  };
}

// Re-export for callers
export type { AudioPlaybackState };
