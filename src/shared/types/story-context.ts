/**
 * Story Context — Strictly-typed pipeline context
 *
 * Replaces Map<string, unknown> with domain-specific accessors.
 * Each domain variable has a dedicated getter/setter with compile-time type safety.
 *
 * Usage:
 *   const ctx = createStoryContext('workflow-123');
 *   ctx.setScripts(scripts);
 *   const scripts = ctx.getScripts(); // string[] | undefined (strict)
 */

import type { PipelineStepId, StepCheckpoint } from '@/core/pipeline/pipeline.types';
import { logger } from '@/core/utils/logger';

// ========== Forward Declarations (break circular import chains) ==========
// These are re-declared here so story-context.ts doesn't need to import
// from pipeline/ and step-* files (which would create circular refs)

export type StoryContextWorkflowId = string;
export type StoryContextProjectId = string | undefined;

// Re-export canonical StoryboardFrame from the editor module so all
// `@/shared/types` consumers (and downstream) see the same shape.
// Source of truth: @/features/storyboard/components/StoryboardEditor
import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';
export type { StoryboardFrame };

export interface RenderedFrame {
  frameId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  qualityScore?: number;
  renderTime: number;
}

export interface DialogueAudioClip {
  audioUrl: string;
  duration: number;
  speakerId: string;
}

export interface NovelScene {
  id: string;
  chapterId?: string;
  sceneNumber?: number;
  title?: string;
  content?: string;
  location?: string;
  time?: string;
  characters?: string[];
  dialogues?: Array<{
    id?: string;
    sceneId?: string;
    character?: string;
    content?: string;
    emotion?: string;
    emotionIntensity?: number;
    position?: number;
    isNarration?: boolean;
  }>;
  narrator?: string;
  emotions?: Array<{ type: string; intensity: number; dominant?: boolean }>;
  tags?: string[];
  imagePrompts?: string[];
  startPosition?: number;
  endPosition?: number;
}

// ========== Domain Types ==========

export interface StoryScript {
  id: string;
  title: string;
  content: string;
  segments: Array<{
    id: string;
    startTime: number;
    endTime: number;
    content: string;
    type: 'narration' | 'dialogue' | 'action' | 'transition';
  }>;
}

export interface StoryCharacter {
  id: string;
  name: string;
  appearance: Record<string, string>;
  consistency: {
    seed?: number;
    referenceImages?: string[];
  };
}

// ========== StoryContext Interface ==========

export interface StoryContext {
  readonly workflowId: string;
  readonly projectId?: string;

  // ---- Import ----
  getChapters: () =>
    | Array<{ id: string; title: string; content: string; order: number }>
    | undefined;
  setChapters: (
    chapters: Array<{ id: string; title: string; content: string; order: number }>
  ) => void;
  getProjectMetadata: () => { title?: string; author?: string; genre?: string } | undefined;
  setProjectMetadata: (metadata: { title?: string; author?: string; genre?: string }) => void;

  // ---- Analysis ----
  getScenes: () => NovelScene[] | undefined;
  setScenes: (scenes: NovelScene[]) => void;

  // ---- Script ----
  getScripts: () => StoryScript[] | undefined;
  setScripts: (scripts: StoryScript[]) => void;

  // ---- Character ----
  getCharacters: () => StoryCharacter[] | undefined;
  setCharacters: (characters: StoryCharacter[]) => void;

  // ---- Storyboard ----
  getFrames: () => StoryboardFrame[] | undefined;
  setFrames: (frames: StoryboardFrame[]) => void;

  // ---- Render ----
  getRenderedFrames: () => RenderedFrame[] | undefined;
  setRenderedFrames: (frames: RenderedFrame[]) => void;
  getFailedFrames: () => string[] | undefined;
  setFailedFrames: (frameIds: string[]) => void;

  // ---- Audio ----
  getDialogueAudio: () => DialogueAudioClip[] | undefined;
  setDialogueAudio: (audio: DialogueAudioClip[]) => void;
  getSelectedBgm: () => string | undefined;
  setSelectedBgm: (bgm: string) => void;

  // ---- Composition ----
  getComposedVideoUrl: () => string | undefined;
  setComposedVideoUrl: (url: string) => void;

  // ---- Generic accessors (for variables not yet typed) ----
  getVariable: <T>(key: string) => T | undefined;
  setVariable: <T>(key: string, value: T) => void;

  // ---- Checkpoint ----
  getCheckpoint: (stepId: PipelineStepId) => StepCheckpoint | undefined;
  saveCheckpoint: (checkpoint: StepCheckpoint) => void;

  // ---- Logging ----
  log: (msg: string, level?: 'debug' | 'info' | 'warn' | 'error') => void;
}

// ========== Factory ==========

export function createStoryContext(workflowId: string, projectId?: string): StoryContext {
  // Internal storage — Map<string, unknown> but exposed via typed API
  const store = new Map<string, unknown>();

  const log = (msg: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info') => {
    const prefix = `[StoryContext][${workflowId}]`;
    if (level === 'error') logger.error(`${prefix} ${msg}`);
    else if (level === 'warn') logger.warn(`${prefix} ${msg}`);
    else logger.info(`${prefix} ${msg}`);
  };

  return {
    get workflowId() {
      return workflowId;
    },
    get projectId() {
      return projectId;
    },

    // ---- Import ----
    getChapters: () => store.get('chapters') as ReturnType<StoryContext['getChapters']>,
    setChapters: (chs) => {
      store.set('chapters', chs);
    },

    getProjectMetadata: () =>
      store.get('projectMetadata') as ReturnType<StoryContext['getProjectMetadata']>,
    setProjectMetadata: (m) => {
      store.set('projectMetadata', m);
    },

    // ---- Analysis ----
    getScenes: () => store.get('scenes') as NovelScene[] | undefined,
    setScenes: (s) => {
      store.set('scenes', s);
    },

    // ---- Script ----
    getScripts: () => store.get('scripts') as StoryScript[] | undefined,
    setScripts: (s) => {
      store.set('scripts', s);
    },

    // ---- Character ----
    getCharacters: () => store.get('characters') as StoryCharacter[] | undefined,
    setCharacters: (c) => {
      store.set('characters', c);
    },

    // ---- Storyboard ----
    getFrames: () => store.get('frames') as StoryboardFrame[] | undefined,
    setFrames: (f) => {
      store.set('frames', f);
    },

    // ---- Render ----
    getRenderedFrames: () => store.get('renderedFrames') as RenderedFrame[] | undefined,
    setRenderedFrames: (f) => {
      store.set('renderedFrames', f);
    },
    getFailedFrames: () => store.get('failedFrames') as string[] | undefined,
    setFailedFrames: (ids) => {
      store.set('failedFrames', ids);
    },

    // ---- Audio ----
    getDialogueAudio: () => store.get('dialogueAudio') as DialogueAudioClip[] | undefined,
    setDialogueAudio: (a) => {
      store.set('dialogueAudio', a);
    },
    getSelectedBgm: () => store.get('selectedBgm') as string | undefined,
    setSelectedBgm: (b) => {
      store.set('selectedBgm', b);
    },

    // ---- Composition ----
    getComposedVideoUrl: () => store.get('composedVideoUrl') as string | undefined,
    setComposedVideoUrl: (u) => {
      store.set('composedVideoUrl', u);
    },

    // ---- Generic ----
    getVariable: <T>(key: string) => store.get(key) as T | undefined,
    setVariable: <T>(key: string, value: T) => {
      store.set(key, value);
    },

    // ---- Checkpoint (stateless stub — real impl in PipelineEngine) ----
    getCheckpoint: () => undefined,
    saveCheckpoint: () => {
      log('saveCheckpoint called — delegating to PipelineEngine for persistent storage');
    },

    log,
  };
}

// Re-export types needed by consumers of StoryContext
export type { PipelineStepId, StepCheckpoint } from '@/core/pipeline/pipeline.types';
