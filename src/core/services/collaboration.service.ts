/**
 * Backward-compat shim — re-exports from reorganized ./domain/collaboration.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./domain/collaboration.service` directly.
 */
export * from './domain/collaboration.service';
export { default } from './domain/collaboration.service';
