/**
 * Backward-compat shim — re-exports from reorganized ./pipeline/quality-gate.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./pipeline/quality-gate.service` directly.
 */
export * from './pipeline/quality-gate.service';
