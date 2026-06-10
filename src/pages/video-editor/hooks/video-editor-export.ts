/**
 * 视频编辑器导出逻辑
 */
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { logger } from '@/core/utils/logger';

import type { OutputFormat, VideoQuality, VideoSegment } from './video-editor-types';

export function useVideoExport(
  segments: VideoSegment[],
  outputFormat: OutputFormat,
  videoQuality: VideoQuality,
  videoSrc: string
) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');

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
      if (!outputPath) return;

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

  return { isExporting, exportProgress, exportStatus, handleExportVideo };
}
