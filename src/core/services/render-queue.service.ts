/**
 * Backward-compat shim — re-exports from reorganized ./project/render-queue.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./project/render-queue.service` directly.
 */
export * from './project/render-queue.service';
