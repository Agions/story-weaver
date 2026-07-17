/**
 * Story Weaver Shared Utils - Barrel Export
 * Re-exports all utilities from modular files for backward compatibility
 */

// General Utilities (was re-exported via ./general; now direct)
export { debounce, throttle, delay, retry, PROCESSING_DELAY_MS, retryRequest } from './timing';
export type { RetryOptions } from './timing';
export {
  deepClone,
  generateId,
  generatePrefixedId,
  generateSceneId,
  generateFrameId,
  generateCharId,
  generateCompId,
  generateProjectId,
  generateItemId,
  safeJSONParse,
  computeHash,
  getErrorMessage,
} from './data';
export {
  truncateText,
  capitalize,
  camelToKebab,
  kebabToCamel,
  isValidEmail,
  isValidURL,
} from './string';
export { chunkArray, uniqueArray, sortBy } from './collection';

// Environment
export * from './environment';

// Logger
export * from './logger';

// Formatting
export * from './format';

// Request
export * from './request';

// Async Error Handling
export * from './async';

// Format UI Utilities (selective re-export to avoid name conflicts)
export { formatDate, formatDateShort, getStatusConfig, STATUS_CONFIG } from './format-ui';
export type { ProjectStatus, StatusConfig } from './format-ui';

// Re-export types that may be needed
export type { FormatTimeOptions } from './format';
