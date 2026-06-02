/**
 * Video services: metadata, composition, ffmpeg-wasm wrapper,
 * scene analysis, subtitle, visual consistency scoring.
 *
 * Public API:
 *   - video.service, video-analysis.service, video-compositor.service
 *   - scene-analyzer, visual-consistency-scorer
 *   - ffmpeg-wasm (web ffmpeg bridge)
 *   - subtitle.service
 *   - video-composition.types (shared types)
 *
 * Note: ffmpeg-wasm and video-composition.types are folders/modules and
 * must be re-exported with explicit names to avoid type name collisions
 * with subtitle.service and ffmpeg-wasm.service.
 */

export * from './video.service';
export * from './video-analysis.service';
export * from './video-compositor.service';
export * from './scene-analyzer.service';
export * from './visual-consistency-scorer.service';
export * from './ffmpeg-wasm.service';
export * from './subtitle.service';

// ffmpeg-wasm subdirectory: re-export common types only (avoid Scene/etc collision with composition.types)

// video-composition.types: re-export only distinct type names to avoid collision
export type {
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress,
  ProgressCallback,
  Scene,
  SceneEffect,
  SubtitleStyle,
  SubtitleTrack,
} from './video-composition.types';
