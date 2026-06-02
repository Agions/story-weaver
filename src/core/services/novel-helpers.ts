/**
 * Backward-compat shim — re-exports from reorganized ./ai/text/novel-helpers.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./ai/text/novel-helpers` directly.
 */
export * from './ai/text/novel-helpers';
