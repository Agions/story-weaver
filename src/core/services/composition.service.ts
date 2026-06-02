/**
 * Backward-compat shim — re-exports from reorganized ./domain/composition.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./domain/composition.service` directly.
 */
export * from './domain/composition.service';
