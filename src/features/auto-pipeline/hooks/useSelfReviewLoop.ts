/**
 * useSelfReviewLoop — 自审循环状态 Hook
 *
 * 用于在 UI 层展示当前步骤的自审进度。
 */

import { useCallback, useReducer } from 'react';

import type { ReviewResult } from '@/core/autonomous/types/autonomous.types';
import { delay, PROCESSING_DELAY_MS } from '@/shared/utils';

import {
  type SelfReviewLoopState,
  initialSelfReviewLoopState,
  selfReviewLoopReducer,
} from './useSelfReviewLoop.reducer';

interface UseSelfReviewLoopReturn {
  // 当前自审状态
  isReviewing: boolean;
  reviewAttempt: number;
  lastReviewResult: ReviewResult | null;

  // 操作
  startReview: (stepId: string, output: unknown) => Promise<ReviewResult>;
  retryReview: () => Promise<ReviewResult | null>;
}

export function useSelfReviewLoop(maxRetries: number = 3): UseSelfReviewLoopReturn {
  const [state, dispatch] = useReducer(selfReviewLoopReducer, initialSelfReviewLoopState);

  const { isReviewing, reviewAttempt, lastReviewResult, pendingOutput, pendingStepId } = state;

  const startReview = useCallback(
    async (stepId: string, output: unknown): Promise<ReviewResult> => {
      dispatch({ type: 'START_REVIEW', stepId, output });

      // 注意：实际自审逻辑在 SelfReviewLoop 类中
      // 此 Hook 仅用于 UI 状态管理
      const result: ReviewResult = {
        passed: true,
        score: 100,
        dimensions: [],
        reasons: [],
        suggestions: [],
      };

      dispatch({ type: 'REVIEW_SUCCESS', result });

      return result;
    },
    []
  );

  const retryReview = useCallback(async (): Promise<ReviewResult | null> => {
    if (!pendingOutput || !pendingStepId) return null;
    if (reviewAttempt >= maxRetries) return null;

    dispatch({ type: 'RETRY_REVIEW' });

    // 模拟重审
    await delay(PROCESSING_DELAY_MS.REVIEW_RECHECK);

    const result: ReviewResult = {
      passed: true,
      score: 100,
      dimensions: [],
      reasons: [],
      suggestions: [],
    };

    dispatch({ type: 'REVIEW_SUCCESS', result });

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
