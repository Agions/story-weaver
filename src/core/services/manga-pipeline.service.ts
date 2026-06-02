/**
 * Backward-compat shim — re-exports from reorganized ./domain/manga-pipeline.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./domain/manga-pipeline.service` directly.
 */
export * from './domain/manga-pipeline.service';
