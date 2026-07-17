/**
 * useCompositionStudio Reducer — 状态机化
 *
 * 架构决策 (2026-06-11):
 *   v3.4 P0 phase 5 A2.4 — A1 抽出的 useCompositionStudio hook 进一步状态机化.
 *   把 10 useState 集中为 1 个 reducer:
 *   - 合成数据: composition
 *   - 帧编辑: editingFrameId / frameModalVisible
 *   - 全局设置: globalModalVisible
 *   - 关键帧: keyframeModalVisible / keyframes
 *   - 预览: previewModalVisible
 *   - 播放: isPlaying / currentFrameIndex / playbackSpeed
 *
 * 对外 API 不变: 10 setXxx 名字 + signature 保持兼容, 主组件 0 改动,
 * 14 useCallback 业务逻辑 (handleEditFrame/handleOpenKeyframes/...) 内部
 * setXxx 调用不变.
 */

import type { CompositionProject, AnimationKeyframe } from '@/shared/types';

// ─── 状态类型 ──────────────────────────────────────────────────────────────

export interface CompositionStudioState {
  composition: CompositionProject;
  editingFrameId: string | null;
  frameModalVisible: boolean;
  globalModalVisible: boolean;
  keyframeModalVisible: boolean;
  previewModalVisible: boolean;
  isPlaying: boolean;
  currentFrameIndex: number;
  playbackSpeed: number;
  keyframes: AnimationKeyframe[];
}

// ─── Action 类型 ───────────────────────────────────────────────────────────

export type CompositionStudioAction =
  | {
      type: 'set';
      key: keyof CompositionStudioState;
      value: unknown;
    }
  | {
      type: 'update';
      key: keyof CompositionStudioState;
      updater: (prev: unknown) => unknown;
    };

// ─── 初始 State ────────────────────────────────────────────────────────────

export const initialCompositionStudioState = (
  composition: CompositionProject
): CompositionStudioState => ({
  composition,
  editingFrameId: null,
  frameModalVisible: false,
  globalModalVisible: false,
  keyframeModalVisible: false,
  previewModalVisible: false,
  isPlaying: false,
  currentFrameIndex: 0,
  playbackSpeed: 1,
  keyframes: [],
});

// ─── Reducer ───────────────────────────────────────────────────────────────

export function compositionStudioReducer(
  state: CompositionStudioState,
  action: CompositionStudioAction
): CompositionStudioState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value } as CompositionStudioState;
    case 'update':
      return {
        ...state,
        [action.key]: action.updater(state[action.key]),
      } as CompositionStudioState;
    default:
      return state;
  }
}

// ─── Setter 工厂 ───────────────────────────────────────────────────────────

import { createFieldUpdater, type FieldUpdater as Updater } from '@/shared/utils/reducer-helpers';

// ─── 10 setter wrap ────────────────────────────────────────────────────────

export interface CompositionStudioSetter {
  setComposition: (v: Updater<CompositionProject>) => void;
  setEditingFrameId: (v: Updater<string | null>) => void;
  setFrameModalVisible: (v: Updater<boolean>) => void;
  setGlobalModalVisible: (v: Updater<boolean>) => void;
  setKeyframeModalVisible: (v: Updater<boolean>) => void;
  setPreviewModalVisible: (v: Updater<boolean>) => void;
  setIsPlaying: (v: Updater<boolean>) => void;
  setCurrentFrameIndex: (v: Updater<number>) => void;
  setPlaybackSpeed: (v: Updater<number>) => void;
  setKeyframes: (v: Updater<AnimationKeyframe[]>) => void;
}

export function createCompositionStudioSetters(
  dispatch: (action: CompositionStudioAction) => void
): CompositionStudioSetter {
  return {
    setComposition: createFieldUpdater(dispatch as (action: unknown) => void, 'composition'),
    setEditingFrameId: createFieldUpdater(dispatch as (action: unknown) => void, 'editingFrameId'),
    setFrameModalVisible: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'frameModalVisible'
    ),
    setGlobalModalVisible: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'globalModalVisible'
    ),
    setKeyframeModalVisible: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'keyframeModalVisible'
    ),
    setPreviewModalVisible: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'previewModalVisible'
    ),
    setIsPlaying: createFieldUpdater(dispatch as (action: unknown) => void, 'isPlaying'),
    setCurrentFrameIndex: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'currentFrameIndex'
    ),
    setPlaybackSpeed: createFieldUpdater(dispatch as (action: unknown) => void, 'playbackSpeed'),
    setKeyframes: createFieldUpdater(dispatch as (action: unknown) => void, 'keyframes'),
  };
}
