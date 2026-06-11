/**
 * useSelfReviewLoop — 状态机 reducer
 *
 * 6 useState → 1 useReducer
 * 状态转移：idle → reviewing → done / retrying → done
 */

import type { ReviewResult } from '@/core/autonomous/types/autonomous.types';

// ---- State ----
export interface SelfReviewLoopState {
  isReviewing: boolean;
  reviewAttempt: number;
  lastReviewResult: ReviewResult | null;
  pendingOutput: unknown;
  pendingStepId: string | null;
}

export const initialSelfReviewLoopState: SelfReviewLoopState = {
  isReviewing: false,
  reviewAttempt: 0,
  lastReviewResult: null,
  pendingOutput: null,
  pendingStepId: null,
};

// ---- Actions ----
export type SelfReviewLoopAction =
  | { type: 'START_REVIEW'; stepId: string; output: unknown }
  | { type: 'RETRY_REVIEW' }
  | { type: 'REVIEW_SUCCESS'; result: ReviewResult }
  | { type: 'REVIEW_FAIL'; result: ReviewResult };

// ---- Reducer ----
export function selfReviewLoopReducer(
  state: SelfReviewLoopState,
  action: SelfReviewLoopAction
): SelfReviewLoopState {
  switch (action.type) {
    case 'START_REVIEW':
      return {
        ...state,
        isReviewing: true,
        reviewAttempt: 1,
        pendingOutput: action.output,
        pendingStepId: action.stepId,
      };

    case 'RETRY_REVIEW':
      return {
        ...state,
        isReviewing: true,
        reviewAttempt: state.reviewAttempt + 1,
      };

    case 'REVIEW_SUCCESS':
      return {
        ...state,
        isReviewing: false,
        lastReviewResult: action.result,
      };

    case 'REVIEW_FAIL':
      return {
        ...state,
        isReviewing: false,
        lastReviewResult: action.result,
      };

    default:
      return state;
  }
}
