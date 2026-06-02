/**
 * Backward-compat shim — re-exports from reorganized ./pipeline/review-export.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./pipeline/review-export.service` directly.
 */
export * from './pipeline/review-export.service';
