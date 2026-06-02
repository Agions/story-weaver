/**
 * Backward-compat shim — re-exports from reorganized ./ai/text/story-analysis.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./ai/text/story-analysis.service` directly.
 */
export * from './ai/text/story-analysis.service';
