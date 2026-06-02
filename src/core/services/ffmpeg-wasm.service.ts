/**
 * Backward-compat shim — re-exports from reorganized ./video/ffmpeg-wasm.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./video/ffmpeg-wasm.service` directly.
 */
export * from './video/ffmpeg-wasm.service';
