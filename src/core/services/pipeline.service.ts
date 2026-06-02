/**
 * Backward-compat shim — re-exports from reorganized ./pipeline/pipeline.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./pipeline/pipeline.service` directly.
 */
export * from './pipeline/pipeline.service';
