/**
 * Backward-compat shim — re-exports from reorganized ./ai/base-ai-service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./ai/base-ai-service` directly.
 */
export * from './ai/base-ai-service';
