/**
 * Backward-compat shim — re-exports from reorganized ./audio/tts.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./audio/tts.service` directly.
 */
export * from './audio/tts.service';
export { default } from './audio/tts.service';
