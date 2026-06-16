/**
 * Video Compositor Service - Web Implementation
 * Supports: video composition, subtitle addition, audio mixing, video export
 * Note: This is browser/web version, Tauri backend features need separate implementation
 */

import { logger } from '@/core/utils/logger';

// Import shared types (single source of truth)
import type {
  Scene,
  SceneEffect,
  Subtitle,
  SubtitleRenderStyle,
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress,
} from '@/shared/types/video-composition.types';

// Re-export for backward compatibility
export type {
  Scene,
  SceneEffect,
  Subtitle,
  SubtitleRenderStyle,
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress,
};

// SubtitleTrack: local definition (uses Subtitle[] without id)
export interface SubtitleTrack {
  id: string;
  subtitles: Subtitle[];
}

// Mock results
const mockResult: CompositionResult = {
  outputPath: 'mock_output.mp4',
  duration: 0,
  width: 1920,
  height: 1080,
  fileSize: 0,
};

const mockProgress: ExportProgress = {
  progress: 100,
  status: 'completed',
};

// Check if running in Tauri environment
function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window;
}

// Tauri command invocation
async function tauriInvoke<T>(_cmd: string, _args?: Record<string, unknown>): Promise<T> {
  logger.warn('[VideoCompositor] Tauri mode - invoke would be called here');
  throw new Error('Tauri invoke not available in web mode');
}

// Video composition
export async function composeVideo(
  scenes: Scene[],
  options: CompositionOptions = {}
): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('compose_video', { scenes, options });
    } catch {
      // Fall through to mock
    }
  }
  logger.warn('[VideoCompositor] Running in web mode - using mock implementation');
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  return { ...mockResult, duration: totalDuration };
}

export async function addSubtitles(
  _videoPath: string,
  _subtitles: SubtitleTrack,
  _style: SubtitleRenderStyle = {},
  _outputPath?: string
): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('add_subtitles', {
        videoPath: _videoPath,
        subtitles: _subtitles,
        outputPath: _outputPath,
      });
    } catch {
      // Fall through to mock
    }
  }
  logger.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { ...mockResult };
}

export async function addBackgroundMusic(
  _videoPath: string,
  _music: BackgroundMusic,
  _outputPath?: string
): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('add_audio', {
        videoPath: _videoPath,
        music: _music,
        outputPath: _outputPath,
      });
    } catch {
      // Fall through to mock
    }
  }
  logger.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { ...mockResult };
}

export async function exportVideo(
  _inputPath: string,
  _outputPath: string,
  _options: CompositionOptions = {}
): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('export_video', {
        inputPath: _inputPath,
        outputPath: _outputPath,
        options: _options,
      });
    } catch {
      // Fall through to mock
    }
  }
  logger.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { ...mockResult };
}

export async function getExportProgress(): Promise<ExportProgress> {
  if (isTauri()) {
    try {
      return await tauriInvoke<ExportProgress>('get_export_progress');
    } catch {
      // Fall through to mock
    }
  }
  return { ...mockProgress };
}

export async function cancelExport(): Promise<void> {
  if (!isTauri()) return;
  try {
    await tauriInvoke('cancel_export');
  } catch {
    // Ignore
  }
}

export async function concatenateVideos(
  _videoPaths: string[],
  _outputPath: string,
  _transitions?: { type: string; duration: number }[]
): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('concat_videos', {
        videoPaths: _videoPaths,
        outputPath: _outputPath,
        transitions: _transitions,
      });
    } catch {
      // Fall through to mock
    }
  }
  logger.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { ...mockResult };
}

export async function extractFrames(
  _videoPath: string,
  _outputDir: string,
  _fps: number = 1
): Promise<string[]> {
  if (isTauri()) {
    try {
      return await tauriInvoke<string[]>('extract_frames', {
        videoPath: _videoPath,
        outputDir: _outputDir,
        fps: _fps,
      });
    } catch {
      // Fall through to mock
    }
  }
  logger.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return [];
}

export async function getVideoInfo(_videoPath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}> {
  if (isTauri()) {
    try {
      return await tauriInvoke<{
        duration: number;
        width: number;
        height: number;
        fps: number;
        codec: string;
        bitrate: number;
      }>('get_video_info', { videoPath: _videoPath });
    } catch {
      // Fall through to mock
    }
  }
  logger.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { duration: 0, width: 1920, height: 1080, fps: 30, codec: 'h264', bitrate: 0 };
}

// Service export
export const videoCompositorService = {
  compose: composeVideo,
  addSubtitles,
  addBackgroundMusic,
  export: exportVideo,
  getProgress: getExportProgress,
  cancelExport,
  concatenate: concatenateVideos,
  extractFrames,
  getVideoInfo,
};

export default videoCompositorService;
