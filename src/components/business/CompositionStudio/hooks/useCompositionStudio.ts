/**
 * useCompositionStudio — CompositionStudio 状态与业务逻辑（Container 层）
 * 从 CompositionStudio/index.tsx 抽取
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import type {
  StoryboardFrame,
  CompositionProject,
  FrameAnimation,
  TransitionConfig,
  TransitionEffect,
  AnimationKeyframe,
} from '@/core/types';
import { generatePrefixedId } from '@/shared/utils';

const DEFAULT_TRANSITION: TransitionConfig = {
  effect: 'crossfade',
  duration: 0.5,
  easing: 'ease-in-out',
};

interface UseCompositionStudioOptions {
  frames: StoryboardFrame[];
  projectId?: string;
  onCompositionChange?: (composition: CompositionProject) => void;
}

export function useCompositionStudio({
  frames,
  projectId,
  onCompositionChange,
}: UseCompositionStudioOptions) {
  const [composition, setComposition] = useState<CompositionProject>(() => ({
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
  }));

  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [frameModalVisible, setFrameModalVisible] = useState(false);
  const [globalModalVisible, setGlobalModalVisible] = useState(false);
  const [keyframeModalVisible, setKeyframeModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [keyframes, setKeyframes] = useState<AnimationKeyframe[]>([]);

  // Stable callback wrapper
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
    if (frames.length === 0) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  // 帧操作
  const handleEditFrame = useCallback((frameId: string) => {
    setEditingFrameId(frameId);
    setFrameModalVisible(true);
  }, []);

  const handleOpenKeyframes = useCallback(
    (frameId: string) => {
      const frameConfig = composition.frames.find((f) => f.frameId === frameId);
      setKeyframes(frameConfig?.keyframes ?? []);
      setEditingFrameId(frameId);
      setKeyframeModalVisible(true);
    },
    [composition.frames]
  );

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
    toast.success('关键帧已保存');
  }, [editingFrameId, keyframes]);

  const handleDeleteKeyframe = useCallback((index: number) => {
    setKeyframes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSaveFrame = useCallback(
    (values: Partial<FrameAnimation>) => {
      if (!editingFrameId) return;

      setComposition((prev) => {
        const newFrames = prev.frames.map((f) =>
          f.frameId === editingFrameId ? { ...f, ...values, keyframes: f.keyframes ?? [] } : f
        );
        return {
          ...prev,
          frames: newFrames,
          updatedAt: new Date().toISOString(),
        };
      });

      setFrameModalVisible(false);
      setEditingFrameId(null);
      toast.success('动画配置已保存');
    },
    [editingFrameId]
  );

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

    toast.success('已重置为默认');
  }, [editingFrameId]);

  // 全局设置
  const handleOpenGlobalSettings = useCallback(() => {
    setGlobalModalVisible(true);
  }, []);

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
      toast.success('全局设置已保存');
    },
    []
  );

  // 导出
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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `composition-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('合成数据已导出');
  }, [composition, projectId]);

  // 当前帧配置
  const currentFrameConfig = useMemo(() => {
    return (currentFrameIndex: number) =>
      composition.frames.find((f) => f.frameId === frames[currentFrameIndex]?.id);
  }, [composition.frames, frames]);

  return {
    composition,
    setComposition,
    editingFrameId,
    frameModalVisible,
    globalModalVisible,
    keyframeModalVisible,
    previewModalVisible,
    keyframes,
    setKeyframes,
    handleEditFrame,
    handleOpenKeyframes,
    handleSaveKeyframes,
    handleDeleteKeyframe,
    handleSaveFrame,
    handleResetFrame,
    handleOpenGlobalSettings,
    handleSaveGlobalSettings,
    handleExportComposition,
    currentFrameConfig,
  };
}

// 播放相关 hook（独立）
interface UsePlaybackOptions {
  frameCount: number;
  frameDuration: number;
}

export function useCompositionPlayback({ frameCount, frameDuration }: UsePlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationRef = { current: null as number | null };

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

  const handleNext = useCallback(
    (len: number) => {
      if (currentFrameIndex < len - 1) {
        setCurrentFrameIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    },
    [currentFrameIndex]
  );

  const handlePrev = useCallback(() => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex((prev) => prev - 1);
    }
  }, [currentFrameIndex]);

  return {
    isPlaying,
    currentFrameIndex,
    playbackSpeed,
    setPlaybackSpeed,
    handlePlay,
    handlePause,
    handleNext,
    handlePrev,
  };
}
