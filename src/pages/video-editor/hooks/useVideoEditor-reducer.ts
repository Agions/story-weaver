/**
 * useVideoEditor Reducer — 状态机化
 *
 * 架构决策 (2026-06-11):
 *   useVideoEditor.ts 15 useState 化, 1 个 reducer 集中管理:
 *   - 视频状态: videoSrc / loading / currentTime / duration / isPlaying
 *   - 片段状态: segments / keyframes / selectedSegmentIndex
 *   - 历史状态: editHistory / historyIndex
 *   - 项目状态: projectData / isSaving
 *   - 导出配置: outputFormat / videoQuality
 *
 * 对外 API 不变: 15 setXxx 名字 + signature 保持兼容, 调用方 0 改动.
 */

import type { OutputFormat, VideoQuality, VideoSegment } from './video-editor-types';

// ─── 状态类型 ──────────────────────────────────────────────────────────────

export interface VideoEditorState {
  videoSrc: string;
  loading: boolean;
  currentTime: number;
  duration: number;
  segments: VideoSegment[];
  keyframes: string[];
  editHistory: VideoSegment[][];
  historyIndex: number;
  selectedSegmentIndex: number;
  isSaving: boolean;
  outputFormat: OutputFormat;
  videoQuality: VideoQuality;
  isPlaying: boolean;
  projectData: { id: string; name: string };
}

// ─── Action 类型 ───────────────────────────────────────────────────────────

export type VideoEditorAction =
  | { type: 'set'; key: keyof VideoEditorState; value: unknown }
  | {
      type: 'update';
      key: keyof VideoEditorState;
      updater: (prev: unknown) => unknown;
    };

// ─── 初始 State ────────────────────────────────────────────────────────────

export const initialVideoEditorState = (projectId?: string): VideoEditorState => ({
  videoSrc: '',
  loading: false,
  currentTime: 0,
  duration: 0,
  segments: [],
  keyframes: [],
  editHistory: [],
  historyIndex: -1,
  selectedSegmentIndex: -1,
  isSaving: false,
  outputFormat: 'mp4' as OutputFormat,
  videoQuality: 'medium' as VideoQuality,
  isPlaying: false,
  projectData: {
    id: projectId || 'new',
    name: '未命名项目',
  },
});

// ─── Reducer ───────────────────────────────────────────────────────────────

export function videoEditorReducer(
  state: VideoEditorState,
  action: VideoEditorAction
): VideoEditorState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value } as VideoEditorState;
    case 'update':
      return {
        ...state,
        [action.key]: action.updater(state[action.key]),
      } as VideoEditorState;
    default:
      return state;
  }
}

// ─── Setter 工厂 ───────────────────────────────────────────────────────────

import { createFieldUpdater, type FieldUpdater as Updater } from '@/shared/utils/reducer-helpers';

// ─── 15 setter wrap ────────────────────────────────────────────────────────

export interface VideoEditorSetter {
  setVideoSrc: (v: Updater<string>) => void;
  setLoading: (v: Updater<boolean>) => void;
  setCurrentTime: (v: Updater<number>) => void;
  setDuration: (v: Updater<number>) => void;
  setSegments: (v: Updater<VideoSegment[]>) => void;
  setKeyframes: (v: Updater<string[]>) => void;
  setEditHistory: (v: Updater<VideoSegment[][]>) => void;
  setHistoryIndex: (v: Updater<number>) => void;
  setSelectedSegmentIndex: (v: Updater<number>) => void;
  setIsSaving: (v: Updater<boolean>) => void;
  setOutputFormat: (v: Updater<OutputFormat>) => void;
  setVideoQuality: (v: Updater<VideoQuality>) => void;
  setIsPlaying: (v: Updater<boolean>) => void;
  setProjectData: (v: Updater<{ id: string; name: string }>) => void;
}

export function createVideoEditorSetters(
  dispatch: (action: VideoEditorAction) => void
): VideoEditorSetter {
  return {
    setVideoSrc: createFieldUpdater(dispatch as (action: unknown) => void, 'videoSrc'),
    setLoading: createFieldUpdater(dispatch as (action: unknown) => void, 'loading'),
    setCurrentTime: createFieldUpdater(dispatch as (action: unknown) => void, 'currentTime'),
    setDuration: createFieldUpdater(dispatch as (action: unknown) => void, 'duration'),
    setSegments: createFieldUpdater(dispatch as (action: unknown) => void, 'segments'),
    setKeyframes: createFieldUpdater(dispatch as (action: unknown) => void, 'keyframes'),
    setEditHistory: createFieldUpdater(dispatch as (action: unknown) => void, 'editHistory'),
    setHistoryIndex: createFieldUpdater(dispatch as (action: unknown) => void, 'historyIndex'),
    setSelectedSegmentIndex: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'selectedSegmentIndex'
    ),
    setIsSaving: createFieldUpdater(dispatch as (action: unknown) => void, 'isSaving'),
    setOutputFormat: createFieldUpdater(dispatch as (action: unknown) => void, 'outputFormat'),
    setVideoQuality: createFieldUpdater(dispatch as (action: unknown) => void, 'videoQuality'),
    setIsPlaying: createFieldUpdater(dispatch as (action: unknown) => void, 'isPlaying'),
    setProjectData: createFieldUpdater(dispatch as (action: unknown) => void, 'projectData'),
  };
}
