/**
 * useStoryboard Hook
 * 分镜状态管理
 */

import { useState, useCallback, Dispatch, SetStateAction } from 'react';

import { collaborationService } from '@/core/services';
import type { FrameComment, StoryboardVersion, VersionDiffSummary } from '@/core/services';
import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';

export interface UseStoryboardReturn {
  frames: StoryboardFrame[];
  selectedFrame: StoryboardFrame | null;
  comments: FrameComment[];
  versions: StoryboardVersion[];
  versionDiff: VersionDiffSummary | null;
  compareLeftVersionId: string | undefined;
  compareRightVersionId: string | undefined;
  // Actions
  setFrames: Dispatch<SetStateAction<StoryboardFrame[]>>;
  setComments: Dispatch<SetStateAction<FrameComment[]>>;
  setVersions: Dispatch<SetStateAction<StoryboardVersion[]>>;
  setVersionDiff: (diff: VersionDiffSummary | null) => void;
  setCompareLeft: (id: string | undefined) => void;
  setCompareRight: (id: string | undefined) => void;
  addFrame: (frame: StoryboardFrame) => void;
  updateFrame: (frameId: string, updates: Partial<StoryboardFrame>) => void;
  removeFrame: (frameId: string) => void;
  selectFrame: (frame: StoryboardFrame | null) => void;
  reorderFrames: (startIndex: number, endIndex: number) => void;
  // Version control
  saveVersion: (projectId: string, label?: string) => void;
  rollbackToVersion: (projectId: string, versionId: string) => void;
  compareVersions: (leftId: string, rightId: string) => VersionDiffSummary | null;
  setCompareVersions: (leftId: string | undefined, rightId: string | undefined) => void;
  // Comments
  addComment: (projectId: string, frameId: string, content: string) => void;
}

export function useStoryboard(initialFrames: StoryboardFrame[] = []): UseStoryboardReturn {
  const [frames, setFrames] = useState<StoryboardFrame[]>(initialFrames);
  const [selectedFrame, selectFrame] = useState<StoryboardFrame | null>(null);
  const [comments, setComments] = useState<FrameComment[]>([]);
  const [versions, setVersions] = useState<StoryboardVersion[]>([]);
  const [versionDiff, setVersionDiff] = useState<VersionDiffSummary | null>(null);
  const [compareLeftVersionId, setCompareLeftVersionId] = useState<string | undefined>(undefined);
  const [compareRightVersionId, setCompareRightVersionId] = useState<string | undefined>(undefined);

  const addFrame = useCallback((frame: StoryboardFrame) => {
    setFrames((prev) => [...prev, frame]);
  }, []);

  const updateFrame = useCallback((frameId: string, updates: Partial<StoryboardFrame>) => {
    setFrames((prev) =>
      prev.map((frame) => (frame.id === frameId ? { ...frame, ...updates } : frame))
    );
  }, []);

  const removeFrame = useCallback(
    (frameId: string) => {
      setFrames((prev) => prev.filter((frame) => frame.id !== frameId));
      if (selectedFrame?.id === frameId) {
        selectFrame(null);
      }
    },
    [selectedFrame]
  );

  const reorderFrames = useCallback((startIndex: number, endIndex: number) => {
    setFrames((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const saveVersion = useCallback(
    (projectId: string, label?: string) => {
      collaborationService.saveVersion({
        projectId,
        label: label || `版本-${new Date().toLocaleTimeString()}`,
        createdBy: 'current-user',
        payload: frames,
      });
      const updatedVersions = collaborationService.listVersions(projectId);
      setVersions(updatedVersions);
      setCompareLeftVersionId(updatedVersions[updatedVersions.length - 1]?.id);
    },
    [frames]
  );

  const rollbackToVersion = useCallback((projectId: string, versionId: string) => {
    const payload = collaborationService.rollback(projectId, versionId);
    if (Array.isArray(payload)) {
      setFrames(payload as StoryboardFrame[]);
    }
  }, []);

  const compareVersions = useCallback((leftId: string, rightId: string) => {
    const diff = collaborationService.diffVersions(leftId, rightId);
    setVersionDiff(diff);
    return diff;
  }, []);

  const setCompareVersions = useCallback(
    (leftId: string | undefined, rightId: string | undefined) => {
      setCompareLeftVersionId(leftId);
      setCompareRightVersionId(rightId);
    },
    []
  );

  const addComment = useCallback((projectId: string, frameId: string, content: string) => {
    collaborationService.addComment({
      projectId,
      frameId,
      content,
      author: 'current-user',
    });
    const updatedComments = collaborationService.listComments(projectId);
    setComments(updatedComments);
  }, []);

  return {
    frames,
    selectedFrame,
    comments,
    versions,
    versionDiff,
    compareLeftVersionId,
    compareRightVersionId,
    setFrames,
    setComments,
    setVersions,
    setVersionDiff,
    setCompareLeft: setCompareLeftVersionId,
    setCompareRight: setCompareRightVersionId,
    addFrame,
    updateFrame,
    removeFrame,
    selectFrame,
    reorderFrames,
    saveVersion,
    rollbackToVersion,
    compareVersions,
    setCompareVersions,
    addComment,
  };
}
