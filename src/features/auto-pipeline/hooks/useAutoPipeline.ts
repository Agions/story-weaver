/**
 * useAutoPipeline — 全自动流水线 React Hook
 *
 * 提供：
 * - start / pause / resume / cancel 控制
 * - 实时状态（progress, currentStep, mode）
 * - 事件订阅（onStepComplete, onComplete, onError）
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAutoPipelineStore } from '../stores/autoPipelineStore';
import { autoPipelineService } from '../services/autoPipelineService';
import type { AutoPipelineInput, PipelineEventHandler } from '@/core/autonomous/types/autonomous.types';

export function useAutoPipeline() {
  const store = useAutoPipelineStore();
  const engineRef = useRef<ReturnType<typeof autoPipelineService.createEngine> | null>(null);

  // 初始化引擎
  useEffect(() => {
    engineRef.current = autoPipelineService.createEngine({
      maxReviewRetries: 3,
      reviewModel: 'glm-5',
    });

    // 注册事件处理器
    engineRef.current.onEvents({
      onStepStart: (stepId) => {
        store.updateStepState(stepId, { status: 'running', startedAt: Date.now() });
      },
      onStepProgress: (stepId, progress, message) => {
        store.updateStepState(stepId, { progress, message: message ?? undefined });
      },
      onStepComplete: (stepId, output) => {
        store.updateStepState(stepId, {
          status: 'completed',
          progress: 100,
          completedAt: Date.now(),
          output,
        });
      },
      onStepFail: (stepId, error) => {
        store.updateStepState(stepId, { status: 'failed', error });
        store.setError(`Step ${stepId} failed: ${error}`);
      },
      onStepReviewStart: (stepId, attempt) => {
        store.updateStepState(stepId, { status: 'reviewing', reviewCount: attempt });
      },
      onStepReviewComplete: (stepId) => {
        const step = store.steps[stepId];
        if (step) {
          store.updateStepState(stepId, {
            status: 'running', // 继续下一轮执行
            reviewCount: step.reviewCount + 1,
          });
        }
      },
      onPipelineComplete: (result) => {
        store.setResult(result);
      },
      onPipelineFail: (error) => {
        store.setError(error);
      },
    });

    return () => {
      engineRef.current?.cancel();
    };
  }, []);

  // 启动流水线
  const start = useCallback(async (input: AutoPipelineInput) => {
    store.startPipeline(input);
    const engine = engineRef.current;
    if (!engine) {
      store.setError('Pipeline engine not initialized');
      return;
    }
    const result = await engine.run(input);
    store.setResult(result);
  }, []);

  // 暂停
  const pause = useCallback(() => {
    engineRef.current?.pause();
    store.pausePipeline();
  }, []);

  // 恢复
  const resume = useCallback(() => {
    engineRef.current?.resume();
    store.resumePipeline();
  }, []);

  // 取消
  const cancel = useCallback(() => {
    engineRef.current?.cancel();
    store.cancelPipeline();
  }, []);

  // 重置
  const reset = useCallback(() => {
    engineRef.current = autoPipelineService.createEngine();
    store.resetPipeline();
  }, []);

  return {
    // 状态
    mode: store.mode,
    progress: store.progress,
    currentStep: store.currentStepId
      ? STEP_LABELS[store.currentStepId] ?? store.currentStepId
      : null,
    steps: store.steps,
    result: store.result,
    error: store.error,
    isRunning: store.mode === 'running',
    isPaused: store.mode === 'paused',
    isCompleted: store.mode === 'completed',
    isFailed: store.mode === 'failed',

    // 操作
    start,
    pause,
    resume,
    cancel,
    reset,
  };
}

const STEP_LABELS: Record<string, string> = {
  step_import: '导入解析',
  step_analysis: 'AI 分析',
  step_script: '剧本生成',
  step_character: '角色设计',
  step_scene: '场景规划',
  step_storyboard: '分镜生成',
  step_render: '批量渲染',
  step_video_edit: '视频剪辑',
  step_audio: '配音合成',
  step_subtitle: '字幕嵌入',
  step_export: '成片导出',
};
