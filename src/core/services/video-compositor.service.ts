/**
 * Backward-compat shim — re-exports from reorganized ./video/video-compositor.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./video/video-compositor.service` directly.
 */
export * from './video/video-compositor.service';
export { default } from './video/video-compositor.service';
