/**
 * Backward-compat shim — re-exports from reorganized ./ai/text/script-analyzer.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./ai/text/script-analyzer.service` directly.
 */
export * from './ai/text/script-analyzer.service';
