/**
 * 视频合成共享类型
 *
 * 已从 @/types/media 统一迁移。本文件保留为兼容性 re-export shim，
 * 请勿在此新增类型 — 请改到 @/types/media。
 */

export type {
  SubtitleRenderStyle,
  SubtitleItem,
  SubtitleTrack,
  SubtitleFormat,
  Subtitle,
  SceneEffect,
  CompositionScene,
  /** @deprecated BackgroundMusic 已迁移到 @/types/media（音频域）。 */
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress,
  ProgressCallback,
} from '@/shared/types/video-composition-types';
