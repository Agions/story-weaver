/**
 * useVideo Reducer — 状态机化
 *
 * 架构决策 (2026-06-11):
 *   v3.4 P0 phase 5 A2.5 — 8 useState 集中为 1 个 reducer:
 *   - 视频信息: video / analysis
 *   - 上传: isUploading / uploadProgress
 *   - 分析: isAnalyzing / analysisProgress
 *   - 任务: taskStatus
 *   - 错误: error
 *
 * 死代码清理: 原 useState `isLoading` (L121) setter 从未使用, 永远 false, 删.
 *
 * 对外 API 不变: 8 setXxx 名字 + signature 保持兼容, 调用方 0 改动.
 */

import type { VideoInfo, VideoAnalysis, TaskStatus } from '@/shared/types';

// ─── 状态类型 ──────────────────────────────────────────────────────────────

export interface VideoState {
  video: VideoInfo | null;
  analysis: VideoAnalysis | null;
  isUploading: boolean;
  uploadProgress: number;
  isAnalyzing: boolean;
  analysisProgress: number;
  taskStatus: TaskStatus | null;
  error: string | null;
  // isLoading 是接口契约 (测试 + 调用方期望), 但实际从未被 setter 改过
  // 保留为常量 false 以满足 UseVideoReturn 类型
  isLoading: boolean;
}

// ─── Action 类型 ───────────────────────────────────────────────────────────

export type VideoAction =
  | { type: 'set'; key: keyof VideoState; value: unknown }
  | { type: 'update'; key: keyof VideoState; updater: (prev: unknown) => unknown };

// ─── 初始 State ────────────────────────────────────────────────────────────

export const initialVideoState: VideoState = {
  video: null,
  analysis: null,
  isUploading: false,
  uploadProgress: 0,
  isAnalyzing: false,
  analysisProgress: 0,
  taskStatus: null,
  error: null,
  isLoading: false,
};

// ─── Reducer ───────────────────────────────────────────────────────────────

export function videoReducer(state: VideoState, action: VideoAction): VideoState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value } as VideoState;
    case 'update':
      return {
        ...state,
        [action.key]: action.updater(state[action.key]),
      } as VideoState;
    default:
      return state;
  }
}

// ─── Setter 工厂 ───────────────────────────────────────────────────────────

type Updater<T> = T | ((prev: T) => T);

function makeSetter<K extends keyof VideoState>(dispatch: (action: VideoAction) => void, key: K) {
  return (payload: Updater<VideoState[K]>) => {
    if (typeof payload === 'function') {
      const updater = payload as unknown as (prev: unknown) => unknown;
      dispatch({ type: 'update', key, updater });
    } else {
      dispatch({ type: 'set', key, value: payload });
    }
  };
}

// ─── 8 setter wrap ─────────────────────────────────────────────────────────

export interface VideoSetter {
  setVideo: (v: Updater<VideoInfo | null>) => void;
  setAnalysis: (v: Updater<VideoAnalysis | null>) => void;
  setIsUploading: (v: Updater<boolean>) => void;
  setUploadProgress: (v: Updater<number>) => void;
  setIsAnalyzing: (v: Updater<boolean>) => void;
  setAnalysisProgress: (v: Updater<number>) => void;
  setTaskStatus: (v: Updater<TaskStatus | null>) => void;
  setError: (v: Updater<string | null>) => void;
}

export function createVideoSetters(dispatch: (action: VideoAction) => void): VideoSetter {
  return {
    setVideo: makeSetter(dispatch, 'video'),
    setAnalysis: makeSetter(dispatch, 'analysis'),
    setIsUploading: makeSetter(dispatch, 'isUploading'),
    setUploadProgress: makeSetter(dispatch, 'uploadProgress'),
    setIsAnalyzing: makeSetter(dispatch, 'isAnalyzing'),
    setAnalysisProgress: makeSetter(dispatch, 'analysisProgress'),
    setTaskStatus: makeSetter(dispatch, 'taskStatus'),
    setError: makeSetter(dispatch, 'error'),
  };
}
