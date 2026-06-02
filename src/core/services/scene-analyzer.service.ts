/**
 * Backward-compat shim — re-exports from reorganized ./video/scene-analyzer.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./video/scene-analyzer.service` directly.
 */
export * from './video/scene-analyzer.service';
