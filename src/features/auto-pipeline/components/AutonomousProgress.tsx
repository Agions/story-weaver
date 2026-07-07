/**
 * AutonomousProgress — 全自动流水线进度展示
 *
 * 实时展示：
 * - 当前正在执行的步骤
 * - 各步骤的状态（待处理/进行中/已完成/审核中）
 * - 自审循环进度
 * - 预计剩余时间
 */

import { CheckCircle, Circle, Loader2, AlertCircle, RefreshCw, SkipForward } from 'lucide-react';

import { cn } from '@/shared/utils/class-names';

import { useAutoPipelineStore, selectAllSteps } from '../stores/autoPipelineStore';

const STEP_LABELS: Record<string, string> = {
  'step-import': '📥 导入解析',
  'step-analysis': '🧠 AI 分析',
  'step-script': '📝 剧本生成',
  'step-character': '🎭 角色设计',
  'step-scene': '🎨 场景规划',
  'step-storyboard': '🎬 分镜生成',
  'step-render': '🖼️ 批量渲染',
  'step-video-edit': '🎞️ 视频剪辑',
  'step-audio': '🔊 配音合成',
  'step-subtitle': '💬 字幕嵌入',
  'step-export': '📤 成片导出',
};

export function AutonomousProgress() {
  const { mode, progress, currentStepId, error } = useAutoPipelineStore();
  const steps = useAutoPipelineStore(selectAllSteps);

  if (mode === 'idle') {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* 整体进度 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {mode === 'running' && currentStepId
              ? `正在：${STEP_LABELS[currentStepId] ?? currentStepId}`
              : mode === 'paused'
                ? '⏸️ 已暂停'
                : mode === 'completed'
                  ? '✅ 制作完成'
                  : '❌ 制作失败'}
          </span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              mode === 'completed' ? 'bg-green-500' : 'bg-primary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(STEP_LABELS).map(([stepId, label]) => {
          const step = steps.find((s) => s.stepId === stepId);
          const status = step?.status ?? 'pending';
          const reviewCount = step?.reviewCount ?? 0;

          return (
            <div
              key={stepId}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors',
                status === 'completed' && 'bg-green-50 border-green-200',
                status === 'running' && 'bg-blue-50 border-blue-200',
                status === 'reviewing' && 'bg-yellow-50 border-yellow-200',
                status === 'failed' && 'bg-red-50 border-red-200',
                status === 'pending' && 'bg-muted/30 border-muted'
              )}
            >
              {/* 状态图标 */}
              {status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              {status === 'running' && (
                <Loader2 className="w-5 h-5 text-blue-500 flex-shrink-0 animate-spin" />
              )}
              {status === 'reviewing' && (
                <RefreshCw className="w-5 h-5 text-yellow-500 flex-shrink-0 animate-spin" />
              )}
              {status === 'failed' && (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              {status === 'pending' && (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              {status === 'skipped' && (
                <SkipForward className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}

              {/* 标签 */}
              <span
                className={cn(
                  'flex-1 text-sm',
                  status === 'completed' && 'text-green-700',
                  status === 'running' && 'text-blue-700 font-medium',
                  status === 'reviewing' && 'text-yellow-700',
                  status === 'failed' && 'text-red-700',
                  status === 'pending' && 'text-muted-foreground'
                )}
              >
                {label}
              </span>

              {/* 进度 */}
              {status === 'running' && step?.progress !== undefined && (
                <span className="text-xs text-blue-600">{step.progress}%</span>
              )}

              {/* 自审次数 */}
              {reviewCount > 0 && (
                <span className="text-xs text-yellow-600">自审 ×{reviewCount}</span>
              )}

              {/* 完成时间 */}
              {status === 'completed' && step?.completedAt && step?.startedAt && (
                <span className="text-xs text-muted-foreground">
                  {Math.round((step.completedAt - step.startedAt) / 1000)}s
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          <strong>错误：</strong> {error}
        </div>
      )}

      {/* 提示 */}
      {mode === 'running' && (
        <p className="text-xs text-center text-muted-foreground">
          💡 AI 正在工作中，你可以关闭此页面。再次打开时会自动继续。
        </p>
      )}
    </div>
  );
}
