/**
 * Backward-compat shim — re-exports from reorganized ./ai/text/novel-analyze.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./ai/text/novel-analyze.service` directly.
 */
export * from './ai/text/novel-analyze.service';
export { default } from './ai/text/novel-analyze.service';
