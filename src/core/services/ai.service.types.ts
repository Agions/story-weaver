/**
 * Backward-compat shim — re-exports from reorganized ./ai/text/ai.service.types.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./ai/text/ai.service.types` directly.
 */
export * from './ai/text/ai.service.types';
