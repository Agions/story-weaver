/**
 * Backward-compat shim — re-exports from reorganized ./ai/text/novel.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./ai/text/novel.service` directly.
 */
export * from './ai/text/novel.service';
export { default } from './ai/text/novel.service';
