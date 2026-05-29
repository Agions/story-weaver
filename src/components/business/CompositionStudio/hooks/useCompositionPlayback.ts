/**
 * useCompositionPlayback — 播放状态与动画逻辑
 * 从 CompositionStudio/index.tsx 抽取
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import type { CompositionProject } from '@/core/types';

interface UseCompositionPlaybackOptions {
  frameCount: number;
  frameDuration: number;
  onCompositionChange?: (c: CompositionProject) => void;
}

export function useCompositionPlayback({
  frameCount,
  frameDuration,
}: UseCompositionPlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationRef = useRef<number | null>(null);

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

  // 播放动画帧
  useEffect(() => {
    if (!isPlaying) return;

    const frameMs = (frameDuration * 1000) / playbackSpeed;
    const startTime = Date.now() - currentFrameIndex * frameMs;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const frameIndex = Math.floor(elapsed / frameMs);

      if (frameIndex >= frameCount) {
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
  }, [isPlaying, currentFrameIndex, frameCount, frameDuration, playbackSpeed]);

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
