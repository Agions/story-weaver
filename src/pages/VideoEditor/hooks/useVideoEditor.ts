/**
 * useVideoEditor — VideoEditorPage Container Hook
 *
 * 职责：
 * - 所有 useState 状态管理
 * - 所有事件处理函数
 * - 所有 API 调用和业务逻辑
 *
 * 拆分后目标：VideoEditorPage.tsx 从 714行 → <200行
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';

import { tauriService } from '@/core/services';
import { logger } from '@/core/utils/logger';
import { delay, formatTime } from '@/shared/utils';
import { useProjectStore } from '@/shared/stores';

// ========== 类型定义 ==========

export interface VideoSegment {
  id: string;
  start: number;
  end: number;
  type: string;
  content?: string;
}

export type OutputFormat = 'mp4' | 'mov' | 'mkv' | 'webm';
export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';

// ========== Hook ==========

export function useVideoEditor(projectId?: string) {
  const { loadProject: loadProjectFromStore } = useProjectStore();

  // --- 状态 ---
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [keyframes, setKeyframes] = useState<string[]>([]);
  const [editHistory, setEditHistory] = useState<VideoSegment[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(-1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp4');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('medium');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [projectData, setProjectData] = useState<{ id: string; name: string }>({
    id: projectId || 'new',
    name: '未命名项目',
  });

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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
      } catch (err) {
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
        filters: [
          {
            name: '视频文件',
            extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
          },
        ],
      });

      if (!selected || typeof selected !== 'string') {
        return;
      }

      setLoading(true);

      try {
        setVideoSrc(`file://${selected}`);

        const metadata = await tauriService.getVideoInfo(selected);
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
        const frames = await tauriService.generateThumbnails(selected, frameCount);
        setKeyframes(frames);

        toast.success('视频加载成功');
      } catch (error) {
        logger.error('视频分析失败:', error);
        toast.error('视频分析失败，请检查文件格式');
      } finally {
        setLoading(false);
      }
    } catch (err) {
      logger.error('选择文件失败:', err);
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
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleVideoLoaded = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  }, []);

  // --- 历史记录 ---
  const addToHistory = useCallback((newSegments: VideoSegment[]) => {
    if (historyIndex < editHistory.length - 1) {
      setEditHistory(editHistory.slice(0, historyIndex + 1));
    }
    setEditHistory([...editHistory, newSegments]);
    setHistoryIndex(historyIndex + 1);
  }, [editHistory, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSegments(editHistory[historyIndex - 1]);
    }
  }, [historyIndex, editHistory]);

  const handleRedo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSegments(editHistory[historyIndex]);
    }
  }, [historyIndex, editHistory]);

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

  const handleDeleteSegment = useCallback((index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
    addToHistory(newSegments);
    setSelectedSegmentIndex(-1);
    toast.success('已删除片段');
  }, [segments, addToHistory]);

  const handleSelectSegment = useCallback((index: number) => {
    setSelectedSegmentIndex(index);
    if (videoRef.current && index >= 0 && segments[index]) {
      videoRef.current.currentTime = segments[index].start;
      setCurrentTime(segments[index].start);
    }
  }, [segments]);

  // --- 保存项目 ---
  const handleSaveProject = useCallback(async () => {
    setIsSaving(true);
    try {
      await delay(1000);
      const projectToSave = {
        ...projectData,
        segments,
        updatedAt: new Date().toISOString(),
      };
      await tauriService.writeText(projectId || 'new', JSON.stringify(projectToSave));
      toast.success('项目保存成功');
    } catch (error) {
      logger.error('保存失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [projectData, segments, projectId]);

  // --- 导出视频 ---
  const handleExportVideo = useCallback(async () => {
    if (segments.length === 0) {
      toast.warning('请先添加需要导出的片段');
      return;
    }

    try {
      const outputPath = await save({
        defaultPath: `export_${Date.now()}.${outputFormat}`,
        filters: [{ name: 'Video Files', extensions: [outputFormat] }],
      });

      if (!outputPath) {
        return;
      }

      setIsExporting(true);
      setExportProgress(0);
      setExportStatus('正在准备导出...');

      const videoSegments = segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        type_field: null,
        content: null,
      }));

      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) return prev;
          setExportStatus(
            prev === 0
              ? '正在处理视频...'
              : prev < 30
                ? '正在编码视频...'
                : prev < 60
                  ? '正在生成音频...'
                  : prev < 80
                    ? '正在合成...'
                    : '即将完成...'
          );
          return prev + Math.random() * 15;
        });
      }, 500);

      try {
        const result = await invoke<string>('cut_video', {
          params: {
            input_path: videoSrc.replace('tauri://localhost/', ''),
            output_path: outputPath,
            segments: videoSegments,
            quality: videoQuality,
            format: outputFormat,
            transition: 'none',
            transition_duration: 0.5,
            volume: 1.0,
            add_subtitles: false,
          },
        });

        setExportProgress(100);
        setExportStatus('导出完成!');
        toast.success(`视频导出成功: ${result}`);
      } finally {
        clearInterval(progressInterval);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('导出失败:', error);
      toast.error(`导出失败: ${errorMessage}`);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus('');
      }, 1000);
    }
  }, [segments, outputFormat, videoQuality, videoSrc]);

  // --- 派生状态 ---
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < editHistory.length - 1;

  // --- 导出 ---
  return {
    // 状态
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
    // Refs
    videoRef,
    timelineRef,
    // 计算属性
    canUndo,
    canRedo,
    // 操作
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
    // 工具
    formatTime,
  };
}