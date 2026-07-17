/**
 * Video analysis types — extracted from video-analysis-service.ts
 */

export type { SceneType } from './video-analysis-constants';

export interface AbortControllerRegistry {
  register(id: string): AbortController;
  cancel(id: string): boolean;
  get(id: string): AbortController | undefined;
  get size(): number;
  clear(): void;
}

export { SUGGESTION_BUILDERS, type SuggestionBuilder } from './video-analysis-constants';