/**
 * useVideoEditor — VideoEditorPage Container Hook（facade）
 *
 * 拆分为：
 * - video-editor-types.ts: 类型定义
 * - video-editor-export.ts: 导出逻辑
 * - 历史记录管理内联（与 segments 状态强耦联）
 */
import { open } from '@tauri-apps/plugin-dialog';
import { useReducer, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/shared/components/ui/toast';

import { tauriService } from '@/core/services';
import { logger } from '@/core/utils/logger';
import { delay, formatTime } from '@/shared/utils';
import { handleAsyncError } from '@/shared/utils/async';

import {
  videoEditorReducer,
  initialVideoEditorState,
  createVideoEditorSetters,
} from './useVideoEditor-reducer';
import { useVideoExport } from './video-editor-export';
import type { VideoSegment } from './video-editor-types';

// Re-export types 保持向后兼容
export type { VideoSegment, OutputFormat, VideoQuality } from './video-editor-types';

export function useVideoEditor(projectId?: string) {
  // ── 15 个 useState 已迁移到 useReducer 状态机 (2026-06-11) ──
  const [state, dispatch] = useReducer(videoEditorReducer, initialVideoEditorState(projectId));
  const {
    setVideoSrc,
    setLoading,
    setCurrentTime,
    setDuration,
    setSegments,
    setKeyframes,
    setEditHistory,
    setHistoryIndex,
    setSelectedSegmentIndex,
    setIsSaving,
    setOutputFormat,
    setVideoQuality,
    setIsPlaying,
    setProjectData,
  } = createVideoEditorSetters(dispatch);

  const {
    videoSrc,
    loading,
    currentTime,
    duration,
    segments,
    keyframes,
    editHistory,
    historyIndex,
    selectedSegmentIndex,
    isSaving,
    outputFormat,
    videoQuality,
    isPlaying,
    projectData,
  } = state;

  const videoRef = useRef<HTMLVideoElement>(null);

  // --- 导出逻辑（提取到子模块） ---
  const { isExporting, exportProgress, exportStatus, handleExportVideo } = useVideoExport(
    segments,
    outputFormat,
    videoQuality,
    videoSrc
  );

  // --- 历史记录（与 segments 强耦联，保持内联） ---
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
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSegments(editHistory[newIndex]);
    }
  }, [historyIndex, editHistory]);

  const handleRedo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSegments(editHistory[newIndex]);
    }
  }, [historyIndex, editHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < editHistory.length - 1;

  // --- 加载项目数据 ---
  useEffect(() => {
    if (!projectId) return;
    const loadProjectData = async () => {
      try {
        const projectText = await tauriService.readText(projectId);
        const data = JSON.parse(projectText);
        setProjectData({ id: data.id, name: data.name });
        if (data.keyFrames) setKeyframes(data.keyFrames);
        if (data.videos && data.videos.length > 0) {
          const first = data.videos[0];
          if (first.path) {
            setVideoSrc(`file://${first.path}`);
            setDuration(first.duration || 0);
          }
        }
      } catch {
        logger.warn('未找到关联项目，使用空白编辑器');
      }
    };
    void loadProjectData();
  }, [projectId]);

  // --- 加载视频文件 ---
  const handleLoadVideo = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }],
      });
      if (!selected || typeof selected !== 'string') return;

      setLoading(true);
      try {
        setVideoSrc(`file://${selected}`);
        const metadata = await tauriService.analyzeVideo(selected);
        setDuration(metadata.duration);

        const newSegment: VideoSegment = {
          id: `segment-${Date.now()}`,
          start: 0,
          end: metadata.duration,
          type: 'video',
          content: '完整视频',
        };
        setSegments([newSegment]);
        addToHistory([newSegment]);

        const frameCount = Math.max(5, Math.floor(metadata.duration / 10));
        const frames = await tauriService.extractKeyFrames(selected, frameCount);
        setKeyframes(frames);
        toast.success('视频加载成功');
      } catch (error) {
        handleAsyncError(error, '视频分析失败', { toastMessage: '视频分析失败，请检查文件格式' });
      } finally {
        setLoading(false);
      }
    } catch (err) {
      handleAsyncError(err, '选择文件失败');
    }
  };

  // --- 播放控制 ---
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  // --- 片段操作 ---
  const handleAddSegment = useCallback(() => {
    const newSegment: VideoSegment = {
      id: `segment-${Date.now()}`,
      start: Math.min(currentTime, duration - 5),
      end: Math.min(currentTime + 5, duration),
      type: 'video',
      content: `片段 ${segments.length + 1}`,
    };
    const newSegments = [...segments, newSegment];
    setSegments(newSegments);
    addToHistory(newSegments);
    setSelectedSegmentIndex(newSegments.length - 1);
    toast.success('已添加新片段');
  }, [currentTime, duration, segments, addToHistory]);

  const handleDeleteSegment = useCallback(
    (index: number) => {
      const newSegments = segments.filter((_, i) => i !== index);
      setSegments(newSegments);
      addToHistory(newSegments);
      setSelectedSegmentIndex(-1);
      toast.success('已删除片段');
    },
    [segments, addToHistory]
  );

  const handleSelectSegment = useCallback(
    (index: number) => {
      setSelectedSegmentIndex(index);
      if (videoRef.current && index >= 0 && segments[index]) {
        videoRef.current.currentTime = segments[index].start;
        setCurrentTime(segments[index].start);
      }
    },
    [segments]
  );

  // --- 保存项目 ---
  const handleSaveProject = useCallback(async () => {
    setIsSaving(true);
    try {
      await delay(1000);
      await tauriService.writeText(
        projectId || 'new',
        JSON.stringify({
          ...projectData,
          segments,
          updatedAt: new Date().toISOString(),
        })
      );
      toast.success('项目保存成功');
    } catch (error) {
      handleAsyncError(error, '保存失败', { toastMessage: '保存失败，请重试' });
    } finally {
      setIsSaving(false);
    }
  }, [projectData, segments, projectId]);

  return {
    videoSrc,
    loading,
    currentTime,
    duration,
    segments,
    keyframes,
    selectedSegmentIndex,
    isSaving,
    isExporting,
    exportProgress,
    exportStatus,
    outputFormat,
    videoQuality,
    isPlaying,
    projectData,
    videoRef,
    canUndo,
    canRedo,
    handleLoadVideo,
    togglePlayPause,
    handleTimeUpdate,
    handleVideoLoaded,
    handleUndo,
    handleRedo,
    handleAddSegment,
    handleDeleteSegment,
    handleSelectSegment,
    handleSaveProject,
    handleExportVideo,
    setOutputFormat,
    setVideoQuality,
    formatTime,
  };
}
