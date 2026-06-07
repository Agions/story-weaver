/**
 * AutoPipelineStore — 全自动流水线状态管理
 * 使用 Zustand 管理全自动漫剧制作的状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PipelineStatus,
  StepState,
  AutoPipelineResult,
  AutoPipelineInput,
} from '@/core/autonomous/types/autonomous.types';

// ============================================================================
// State & Types
// ============================================================================

interface AutoPipelineState {
  // 运行状态
  mode: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  currentStepId: string | null;
  progress: number; // 0-100

  // 步骤状态
  steps: Record<string, StepState>;

  // 输入
  input: AutoPipelineInput | null;

  // 结果
  result: AutoPipelineResult | null;

  // 错误
  error: string | null;

  // 通知
  notifyOnComplete: boolean;
  notifyEmail: string | null;
}

interface AutoPipelineActions {
  // Pipeline 控制
  startPipeline: (input: AutoPipelineInput) => void;
  pausePipeline: () => void;
  resumePipeline: () => void;
  cancelPipeline: () => void;
  resetPipeline: () => void;

  // 步骤更新
  updateStepState: (stepId: string, state: Partial<StepState>) => void;

  // 结果更新
  setResult: (result: AutoPipelineResult) => void;
  setError: (error: string) => void;

  // 通知设置
  setNotifyOnComplete: (enabled: boolean, email?: string) => void;
}

type AutoPipelineStore = AutoPipelineState & AutoPipelineActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: AutoPipelineState = {
  mode: 'idle',
  currentStepId: null,
  progress: 0,
  steps: {},
  input: null,
  result: null,
  error: null,
  notifyOnComplete: false,
  notifyEmail: null,
};

// ============================================================================
// Store
// ============================================================================

export const useAutoPipelineStore = create<AutoPipelineStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startPipeline: (input: AutoPipelineInput) => {
        set({
          mode: 'running',
          currentStepId: null,
          progress: 0,
          steps: {},
          input,
          result: null,
          error: null,
        });
      },

      pausePipeline: () => {
        if (get().mode === 'running') {
          set({ mode: 'paused' });
        }
      },

      resumePipeline: () => {
        if (get().mode === 'paused') {
          set({ mode: 'running' });
        }
      },

      cancelPipeline: () => {
        set({ mode: 'cancelled' as unknown as 'idle', currentStepId: null });
      },

      resetPipeline: () => {
        set(initialState);
      },

      updateStepState: (stepId: string, stateUpdate: Partial<StepState>) => {
        set((prev) => {
          const existing = prev.steps[stepId] ?? {
            stepId,
            name: stepId,
            status: 'pending' as const,
            progress: 0,
            reviewCount: 0,
          };

          const updated = { ...existing, ...stateUpdate };
          const steps = { ...prev.steps, [stepId]: updated };

          const totalSteps = Object.keys(steps).length;
          const completedSteps = Object.values(steps).filter(
            (s) => s.status === 'completed' || s.status === 'skipped',
          ).length;
          const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

          let mode = prev.mode;
          if (updated.status === 'completed' && completedSteps === totalSteps) {
            mode = 'completed';
          } else if (updated.status === 'failed') {
            mode = 'failed';
          }

          return {
            steps,
            progress,
            currentStepId: updated.status === 'running' ? stepId : prev.currentStepId,
            mode: mode as AutoPipelineState['mode'],
          };
        });
      },

      setResult: (result: AutoPipelineResult) => {
        set({
          result,
          mode: result.success ? 'completed' : 'failed',
          progress: result.success ? 100 : get().progress,
        });
      },

      setError: (error: string) => {
        set({ error, mode: 'failed' });
      },

      setNotifyOnComplete: (enabled: boolean, email?: string) => {
        set({
          notifyOnComplete: enabled,
          notifyEmail: email ?? null,
        });
      },
    }),
    {
      name: 'autopipeline-storage',
      partialize: (state) => ({
        mode: state.mode,
        steps: state.steps,
        input: state.input,
        result: state.result,
        notifyOnComplete: state.notifyOnComplete,
        notifyEmail: state.notifyEmail,
      }),
    },
  ),
);

// ============================================================================
// Selectors
// ============================================================================

export const selectIsRunning = (state: AutoPipelineStore) => state.mode === 'running';
export const selectIsPaused = (state: AutoPipelineStore) => state.mode === 'paused';
export const selectIsCompleted = (state: AutoPipelineStore) => state.mode === 'completed';
export const selectIsFailed = (state: AutoPipelineStore) => state.mode === 'failed';
export const selectProgress = (state: AutoPipelineStore) => state.progress;
export const selectCurrentStep = (state: AutoPipelineStore) =>
  state.currentStepId ? state.steps[state.currentStepId] : null;
export const selectAllSteps = (state: AutoPipelineStore) => Object.values(state.steps);
export const selectResult = (state: AutoPipelineStore) => state.result;
