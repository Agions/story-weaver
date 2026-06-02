/**
 * Backward-compat shim — re-exports from reorganized ./audio/audio-pipeline.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./audio/audio-pipeline.service` directly.
 */
export * from './audio/audio-pipeline.service';
export { default } from './audio/audio-pipeline.service';
