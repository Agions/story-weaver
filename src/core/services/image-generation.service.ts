/**
 * Backward-compat shim — re-exports from reorganized ./ai/image/image-generation.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./ai/image/image-generation.service` directly.
 */
export * from './ai/image/image-generation.service';
export { default } from './ai/image/image-generation.service';
