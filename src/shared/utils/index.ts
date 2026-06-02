/**
 * frame-forge Shared Utils - Barrel Export
 * Re-exports all utilities from modular files for backward compatibility
 */

// General Utilities
export * from './general';

// Formatting Utilities
export * from './format';

// Request Utilities & Cache
export * from './request';

// Idle Callback
export * from './idle-callback';

// Motion/Animation Utilities
export * from './motion';

// Platform Utilities
export * from './platform';

// i18n
export * from './i18n';

// React Hooks Re-exports
export * from './hooks';

// Format UI Utilities (selective re-export to avoid name conflicts)
export { formatDate, formatDateShort, getStatusConfig, STATUS_CONFIG } from './format-ui';
export type { ProjectStatus, StatusConfig } from './format-ui';

// Async Error Handling
export * from './async';

// Re-export types that may be needed
export type { FormatTimeOptions } from './format';
export type { Platform, StorageAdapter } from './platform';
export type { Language } from './i18n';
export type { RetryOptions } from './request';
export type { IdleRunOptions } from './idle-callback';
