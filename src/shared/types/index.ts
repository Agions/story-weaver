/**
 * Shared Types Barrel
 *
 * Canonical type definitions. All types previously scattered across
 * `@/types` and `@/core/types` are re-exported here.
 */
export * from './ai-core';
export * from './composition';
export * from './legacy';
export * from './preview';
export * from './project';
export * from './script';
export * from './story-context';
export * from './storyboard';

export {
  type VideoInfo,
  type VideoScene,
  type Keyframe,
  type ObjectDetection,
  type EmotionAnalysis,
  type Emotion,
  type KeyMoment,
  type VideoAnalysis,
} from './video';

export {
  type SubtitleRenderStyle,
  type SubtitleItem,
  type SubtitleTrack,
  type SubtitleFormat,
  type SceneEffect,
  type CompositionScene,
  type CompositionOptions,
  type CompositionResult,
  type ExportProgress,
  type ProgressCallback,
  type Subtitle,
} from './video-composition-types';

export {
  type VoiceTrack,
  type BackgroundMusic,
  type SoundEffect,
  type AudioTrackConfig,
} from './audio';

export { type StoryboardFrame } from './storyboard';

export {
  EmotionType,
  type NovelMetadata,
  type Chapter,
  type NovelScene,
  type Character,
  type CharacterRelationship,
  type Dialogue,
  type SceneEmotion,
  type AnalyzeConfig,
  type AnalyzeResult,
  type NovelStatistics,
  type SceneDescription,
  type VisualElement,
  type ScriptSourceType,
  type ScriptFileFormat,
  type ScriptSource,
  type ScriptChapter,
  type ScriptValidationIssue,
  type ScriptValidationResult,
  type StoryAnalysisCharacter,
  type StoryAnalysisChapter,
  type StoryAnalysis,
  type ScriptFormat,
} from './novel';
