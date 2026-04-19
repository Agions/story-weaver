/**
 * features/video-export/index.ts
 * Video Export feature exports
 */

// Services with singleton getters
export { default as VideoService, videoService } from './services/video.service';
export { default as VideoCompositorService, videoCompositorService } from './services/video-compositor.service';
export { default as ReviewExportService, reviewExportService } from './services/review-export.service';
export { default as TauriService, getTauriService } from './services/tauri.service';

// Types
export type {
  VideoInfo,
  VideoAnalysis,
  Scene,
  Keyframe
} from './services/video.service';

export type {
  Scene as ExportScene,
  SceneEffect,
  SubtitleTrack as VideoSubtitleTrack,
  Subtitle as VideoSubtitle,
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress as VideoExportProgress
} from './services/video-compositor.service';

export type {
  ReviewExportInput,
  ReviewExportProjectMeta,
  ReviewExportActivity,
  ReviewExportSource,
  ReviewExportStatus,
  SaveReviewMarkdownOptions
} from './services/review-export.service';

export type {
  OpenFileOptions,
  SaveFileOptions,
  ShortcutDefinition,
  TrayMenuItem,
  NotificationOptions,
  WindowState,
  VideoClipOptions,
  PreviewOptions,
  ExportOptions,
  ExportProgress,
  ExportProgressCallback,
  DirInfo
} from './services/tauri.service';
