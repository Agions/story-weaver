/**
 * Backward-compat shim — re-exports from reorganized ./domain/character.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./domain/character.service` directly.
 */
export * from './domain/character.service';
