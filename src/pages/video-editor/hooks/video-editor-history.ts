/**
 * 视频编辑器历史记录管理
 */
import { useCallback, useState } from 'react';

import type { VideoSegment } from './video-editor-types';

export function useEditHistory() {
  const [editHistory, setEditHistory] = useState<VideoSegment[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const addToHistory = useCallback(
    (newSegments: VideoSegment[]) => {
      setEditHistory((prev) => {
        const trimmed = historyIndex < prev.length - 1 ? prev.slice(0, historyIndex + 1) : prev;
        return [...trimmed, newSegments];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    setEditHistory((prev) => {
      if (historyIndex < prev.length - 1) {
        setHistoryIndex(historyIndex + 1);
      }
      return prev;
    });
  }, [historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < editHistory.length - 1;

  const getCurrentSegments = useCallback(
    (fallback: VideoSegment[]) => editHistory[historyIndex] ?? fallback,
    [editHistory, historyIndex]
  );

  return {
    editHistory,
    historyIndex,
    addToHistory,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    getCurrentSegments,
  };
}
