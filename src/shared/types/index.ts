/**
 * Shared Types Barrel
 *
 * Canonical type definitions. All types previously scattered across
 * `@/types` and `@/core/types` are re-exported here.
 */
export * from './ai.core';
export * from './ai.models';
export * from './composition';
export * from './legacy';
export * from './preview';
export * from './project';
export * from './script';
export * from './story-context';
export * from './video-composition.types';

// Note: video.ts and video-composition.types.ts both export 'Scene' (with different semantics).
// We re-export video.ts Scene as 'VideoScene' (analysis) and video-composition.types Scene
// stays as 'Scene' (composition). Consumers should import the specific one they need.
export {
  type VideoInfo,
  type Keyframe,
  type ObjectDetection,
  type EmotionAnalysis,
  type Emotion,
  type KeyMoment,
  type VideoAnalysis,
  type Scene,
} from './video';

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
  type ExportOptions,
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

