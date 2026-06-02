/**
 * Backward-compat shim — re-exports from reorganized ./video/subtitle.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./video/subtitle.service` directly.
 */
export * from './video/subtitle.service';
export { default } from './video/subtitle.service';
