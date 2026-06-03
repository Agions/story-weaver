/**
 * frame-fab Shared Utils - Async Error Handling Utilities
 */

import { logger } from '@/core/utils/logger';
import { toast } from '@/shared/components/ui';

/**
 * Wraps an async operation with standardized try-catch-toast-logger pattern.
 * Returns a function that can be called directly without async/await.
 *
 * @example
 * const safeGenerate = toastAsync(
 *   () => aiService.generate(text, config),
 *   { errorMessage: '自动生成配音失败' }
 * );
 * // Later: safeGenerate().then(setAudioGenerating(false));
 */
export function toastAsync<T>(
  asyncFn: () => Promise<T>,
  options: {
    errorMessage: string;
    onSuccess?: (result: T) => void;
    onFinally?: () => void;
  }
): () => Promise<T | void> {
  return async () => {
    try {
      const result = await asyncFn();
      if (options.onSuccess) options.onSuccess(result);
      return result;
    } catch (error) {
      logger.error(options.errorMessage, error);
      toast.error(options.errorMessage);
    } finally {
      if (options.onFinally) options.onFinally();
    }
  };
}

/**
 * Standardized error handler: logs + shows toast.
 * Use inside catch blocks that need both logging and user feedback.
 *
 * @example
 * try { ... } catch (error) {
 *   handleAsyncError(error, '保存项目失败', { toastMessage: '保存失败，请稍后再试' });
 * }
 */
export function handleAsyncError(
  error: unknown,
  context: string,
  options?: { toastMessage?: string }
): void {
  logger.error(context, error);
  toast.error(options?.toastMessage ?? context);
}
