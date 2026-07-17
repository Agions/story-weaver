/**
 * Shared-layer lightweight logger.
 *
 * @deprecated Use `@/core/utils/logger` instead for full-featured logging.
 * This file is kept for backward compatibility with shared-layer consumers
 * that cannot import from core (dependency direction constraint).
 */

export const logger = {
  info: (...args: unknown[]) => console.info('[Shared]', ...args),
  warn: (...args: unknown[]) => console.warn('[Shared]', ...args),
  error: (...args: unknown[]) => console.error('[Shared]', ...args),
  debug: (...args: unknown[]) => console.debug('[Shared]', ...args),
  success: (...args: unknown[]) => console.info('[Shared:success]', ...args),
};
