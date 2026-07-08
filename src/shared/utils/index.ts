/**
 * Story Weaver Shared Utils - Barrel Export
 * Re-exports all utilities from modular files for backward compatibility
 */

// General Utilities
export * from './general';

// Environment Detection (single source of truth for isTauri)
export { isTauri } from '@/core/services/video/video-compositor-environment';

// Formatting Utilities
export * from './format';

// Request Utilities & Cache
export * from './request';

// Idle Callback

// Motion/Animation Utilities

// Platform Utilities

// i18n removed (useTranslation is dead export; Language type has 0 consumers)

// Format UI Utilities (selective re-export to avoid name conflicts)
export { formatDate, formatDateShort, getStatusConfig, STATUS_CONFIG } from './format-ui';
export type { ProjectStatus, StatusConfig } from './format-ui';

// Async Error Handling
export * from './async';

// Re-export types that may be needed
export type { FormatTimeOptions } from './format';
export type { RetryOptions } from './request';
