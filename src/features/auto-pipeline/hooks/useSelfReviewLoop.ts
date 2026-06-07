/**
 * useSelfReviewLoop — 自审循环状态 Hook
 *
 * 用于在 UI 层展示当前步骤的自审进度。
 */

import { useCallback, useState } from 'react';
import type { ReviewResult } from '@/core/autonomous/types/autonomous.types';
import { delay, PROCESSING_DELAY_MS } from '@/shared/utils';

interface UseSelfReviewLoopReturn {
  // 当前自审状态
  isReviewing: boolean;
  reviewAttempt: number;
  lastReviewResult: ReviewResult | null;

  // 操作
  startReview: (stepId: string, output: unknown) => Promise<ReviewResult>;
  retryReview: () => Promise<ReviewResult | null>;
}

export function useSelfReviewLoop(
  maxRetries: number = 3,
): UseSelfReviewLoopReturn {
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewAttempt, setReviewAttempt] = useState(0);
  const [lastReviewResult, setLastReviewResult] = useState<ReviewResult | null>(null);
  const [pendingOutput, setPendingOutput] = useState<unknown>(null);
  const [pendingStepId, setPendingStepId] = useState<string | null>(null);

  const startReview = useCallback(
    async (stepId: string, output: unknown): Promise<ReviewResult> => {
      setIsReviewing(true);
      setReviewAttempt(1);
      setPendingOutput(output);
      setPendingStepId(stepId);

      // 注意：实际自审逻辑在 SelfReviewLoop 类中
      // 此 Hook 仅用于 UI 状态管理
      const result: ReviewResult = {
        passed: true,
        score: 100,
        dimensions: [],
        reasons: [],
        suggestions: [],
      };

      setLastReviewResult(result);
      setIsReviewing(false);

      return result;
    },
    [],
  );

  const retryReview = useCallback(async (): Promise<ReviewResult | null> => {
    if (!pendingOutput || !pendingStepId) return null;
    if (reviewAttempt >= maxRetries) return null;

    setIsReviewing(true);
    setReviewAttempt((prev) => prev + 1);

    // 模拟重审
    await delay(PROCESSING_DELAY_MS.REVIEW_RECHECK);

    const result: ReviewResult = {
      passed: true,
      score: 100,
      dimensions: [],
      reasons: [],
      suggestions: [],
    };

    setLastReviewResult(result);
    setIsReviewing(false);

    return result;
  }, [pendingOutput, pendingStepId, reviewAttempt, maxRetries]);

  return {
    isReviewing,
    reviewAttempt,
    lastReviewResult,
    startReview,
    retryReview,
  };
}
