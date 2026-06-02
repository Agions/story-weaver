/**
 * Backward-compat shim — re-exports from reorganized ./project/project-import-export.service.
 *
 * Kept to avoid breaking the 21+ files that still import from the old
 * top-level path. New code should import from `./project/project-import-export.service` directly.
 */
export * from './project/project-import-export.service';
export { default } from './project/project-import-export.service';
