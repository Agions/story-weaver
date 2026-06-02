/**
 * Backward-compat shim — re-exports from reorganized ./video/visual-consistency-scorer.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./video/visual-consistency-scorer.service` directly.
 */
export * from './video/visual-consistency-scorer.service';
