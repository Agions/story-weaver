/**
 * Backward-compat shim — re-exports from reorganized ./video/video-composition.types.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./video/video-composition.types` directly.
 */
export * from './video/video-composition.types';
