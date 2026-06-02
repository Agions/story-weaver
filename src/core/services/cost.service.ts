/**
 * Backward-compat shim — re-exports from reorganized ./project/cost.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./project/cost.service` directly.
 */
export * from './project/cost.service';
