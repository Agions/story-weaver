import { useCallback, useEffect, useRef, useReducer } from 'react';

import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';
import type {
  CompositionProject,
  FrameAnimation,
  AnimationKeyframe,
  TransitionConfig,
  TransitionEffect,
} from '@/shared/types';
import { generatePrefixedId } from '@/shared/utils/data';

import {
  compositionStudioReducer,
  initialCompositionStudioState,
  createCompositionStudioSetters,
} from './useCompositionStudio.reducer';

const DEFAULT_TRANSITION: TransitionConfig = {
  effect: 'crossfade',
  duration: 0.5,
  easing: 'ease-in-out',
};

const buildInitialComposition = (projectId: string): CompositionProject => ({
  id: generatePrefixedId('comp'),
  projectId: projectId ?? '',
  frames: [],
  transitions: [],
  masterSettings: {
    frameDuration: 3,
    defaultTransition: DEFAULT_TRANSITION,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export interface UseCompositionStudioOptions {
  frames: StoryboardFrame[];
  projectId?: string;
  onCompositionChange?: (composition: CompositionProject) => void;
}

/**
 * v3.4 P0 phase 5 A1: CompositionStudio 业务逻辑集中 hook
 *
 * 集中 10 useState + 3 useEffect + 14 callback, 主组件 545 → ~150 行
 *
 * 返回 shape 与 useState 一一对应, 主组件解构零改名
 */
export function useCompositionStudio(options: UseCompositionStudioOptions) {
  const { frames, projectId, onCompositionChange } = options;

  // ── 10 useState 已迁移到 useReducer 状态机 (2026-06-11) ──
  const [state, dispatch] = useReducer(
    compositionStudioReducer,
    initialCompositionStudioState(buildInitialComposition(projectId ?? ''))
  );
  const {
    setComposition,
    setEditingFrameId,
    setFrameModalVisible,
    setGlobalModalVisible,
    setKeyframeModalVisible,
    setPreviewModalVisible,
    setIsPlaying,
    setCurrentFrameIndex,
    setPlaybackSpeed,
    setKeyframes,
  } = createCompositionStudioSetters(dispatch);

  const {
    composition,
    editingFrameId,
    frameModalVisible,
    globalModalVisible,
    keyframeModalVisible,
    previewModalVisible,
    isPlaying,
    currentFrameIndex,
    playbackSpeed,
    keyframes,
  } = state;
  const animationRef = useRef<number | null>(null);

  // Stable callback wrapper to prevent useEffect re-run on every render
  const stableOnCompositionChange = useCallback(
    (c: CompositionProject) => onCompositionChange?.(c),
    [onCompositionChange]
  );

  // 通知父组件
  useEffect(() => {
    stableOnCompositionChange(composition);
  }, [composition, stableOnCompositionChange]);

  // 初始化帧动画配置
  useEffect(() => {
    if (frames.length > 0) {
      const existingFrameIds = new Set(composition.frames.map((f) => f.frameId));
      const missingFrames = frames.filter((f) => !existingFrameIds.has(f.id));

      if (missingFrames.length > 0) {
        const newFrames = missingFrames.map((frame) => ({
          frameId: frame.id,
          cameraMotion: null,
          zoom: 1,
          pan: { x: 0, y: 0 },
          rotation: 0,
          opacity: 1,
          filters: {
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
          },
          keyframes: [],
        })) as FrameAnimation[];

        setComposition((prev) => ({
          ...prev,
          frames: [...prev.frames, ...newFrames],
          updatedAt: new Date().toISOString(),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  // 播放动画帧
  useEffect(() => {
    if (!isPlaying) return;

    const frameDuration = (composition.masterSettings.frameDuration * 1000) / playbackSpeed;
    const startTime = Date.now() - currentFrameIndex * frameDuration;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const frameIndex = Math.floor(elapsed / frameDuration);

      if (frameIndex >= frames.length) {
        setIsPlaying(false);
        return;
      }

      if (frameIndex !== currentFrameIndex) {
        setCurrentFrameIndex(frameIndex);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    isPlaying,
    currentFrameIndex,
    frames.length,
    composition.masterSettings.frameDuration,
    playbackSpeed,
  ]);

  // 打开帧编辑模态框
  const handleEditFrame = useCallback((frameId: string) => {
    setEditingFrameId(frameId);
    setFrameModalVisible(true);
  }, []);

  // 打开关键帧编辑器
  const handleOpenKeyframes = useCallback(
    (frameId: string) => {
      const frameConfig = composition.frames.find((f) => f.frameId === frameId);
      setKeyframes(frameConfig?.keyframes ?? []);
      setEditingFrameId(frameId);
      setKeyframeModalVisible(true);
    },
    [composition.frames]
  );

  // 保存关键帧
  const handleSaveKeyframes = useCallback(() => {
    if (!editingFrameId) return;

    setComposition((prev) => {
      const newFrames = prev.frames.map((f) =>
        f.frameId === editingFrameId
          ? { ...f, keyframes: [...keyframes].sort((a, b) => a.time - b.time) }
          : f
      );
      return {
        ...prev,
        frames: newFrames,
        updatedAt: new Date().toISOString(),
      };
    });

    setKeyframeModalVisible(false);
  }, [editingFrameId, keyframes]);

  // 删除关键帧
  const handleDeleteKeyframe = useCallback((index: number) => {
    setKeyframes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 保存帧动画配置
  const handleSaveFrame = useCallback(
    (values: Partial<FrameAnimation>) => {
      if (!editingFrameId) return;

      setComposition((prev) => {
        const newFrames = prev.frames.map((f) =>
          f.frameId === editingFrameId
            ? {
                ...f,
                ...values,
                keyframes: f.keyframes ?? [],
              }
            : f
        );
        return {
          ...prev,
          frames: newFrames,
          updatedAt: new Date().toISOString(),
        };
      });

      setFrameModalVisible(false);
      setEditingFrameId(null);
    },
    [editingFrameId]
  );

  // 重置帧
  const handleResetFrame = useCallback(() => {
    if (!editingFrameId) return;

    setComposition((prev) => {
      const newFrames = prev.frames.map((f) =>
        f.frameId === editingFrameId
          ? {
              frameId: f.frameId,
              cameraMotion: null,
              zoom: 1,
              pan: { x: 0, y: 0 },
              rotation: 0,
              opacity: 1,
              filters: {
                blur: 0,
                brightness: 100,
                contrast: 100,
                saturation: 100,
              },
              keyframes: [],
            }
          : f
      );
      return {
        ...prev,
        frames: newFrames,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [editingFrameId]);

  // 打开全局设置
  const handleOpenGlobalSettings = useCallback(() => {
    setGlobalModalVisible(true);
  }, []);

  // 保存全局设置
  const handleSaveGlobalSettings = useCallback(
    (values: {
      frameDuration: number;
      defaultTransition: { effect: TransitionEffect; duration: number; easing?: string };
      transitions?: TransitionConfig[];
    }) => {
      setComposition((prev) => ({
        ...prev,
        masterSettings: {
          ...prev.masterSettings,
          frameDuration: values.frameDuration,
          defaultTransition: {
            ...values.defaultTransition,
            effect: values.defaultTransition.effect as TransitionEffect,
          },
        },
        transitions: values.transitions ?? [],
        updatedAt: new Date().toISOString(),
      }));
      setGlobalModalVisible(false);
    },
    []
  );

  // 预览转场效果 (保留为 noop — 旧调用方兼容性, L729 触发)
  const handlePreviewTransition = useCallback((_transition: TransitionConfig) => {
    // State values never read — removed to eliminate dead code
  }, []);

  // 导出合成数据
  const handleExportComposition = useCallback(() => {
    const exportData = {
      version: '1.0',
      projectId: composition.projectId,
      frames: composition.frames.map((f) => ({
        frameId: f.frameId,
        duration: composition.masterSettings.frameDuration,
        cameraMotion: f.cameraMotion,
        zoom: f.zoom,
        pan: f.pan,
        rotation: f.rotation,
        opacity: f.opacity,
        filters: f.filters,
        keyframes: f.keyframes,
      })),
      transitions: composition.transitions,
      masterSettings: composition.masterSettings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `composition-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [composition, projectId]);

  // 播放预览
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setCurrentFrameIndex(0);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // 下一帧
  const handleNext = useCallback(() => {
    if (currentFrameIndex < frames.length - 1) {
      setCurrentFrameIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentFrameIndex, frames.length]);

  // 上一帧 (待补)
  const handlePrev = useCallback(() => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex((prev) => prev - 1);
    }
  }, [currentFrameIndex]);

  return {
    // state
    composition,
    setComposition,
    editingFrameId,
    setEditingFrameId,
    frameModalVisible,
    setFrameModalVisible,
    globalModalVisible,
    setGlobalModalVisible,
    keyframeModalVisible,
    setKeyframeModalVisible,
    previewModalVisible,
    setPreviewModalVisible,
    isPlaying,
    setIsPlaying,
    currentFrameIndex,
    setCurrentFrameIndex,
    playbackSpeed,
    setPlaybackSpeed,
    keyframes,
    setKeyframes,
    animationRef,
    // 14 callbacks
    handleEditFrame,
    handleOpenKeyframes,
    handleSaveKeyframes,
    handleDeleteKeyframe,
    handleSaveFrame,
    handleResetFrame,
    handleOpenGlobalSettings,
    handleSaveGlobalSettings,
    handlePreviewTransition,
    handleExportComposition,
    handlePlay,
    handlePause,
    handleNext,
    handlePrev,
  };
}
