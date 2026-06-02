/**
 * Backward-compat shim — re-exports from reorganized ./audio/lip-sync.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./audio/lip-sync.service` directly.
 */
export * from './audio/lip-sync.service';
