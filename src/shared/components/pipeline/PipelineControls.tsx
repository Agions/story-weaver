import { Pause, Play, SkipForward, X, RotateCcw } from 'lucide-react';

export type PipelineAction = 'pause' | 'resume' | 'skip' | 'cancel' | 'retry';

export interface PipelineControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  canSkip: boolean;
  canRetry: boolean;
  onAction: (action: PipelineAction) => void;
}

export function PipelineControls({
  isRunning,
  isPaused,
  canSkip,
  canRetry,
  onAction,
}: PipelineControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {isRunning && !isPaused && (
        <button
          onClick={() => onAction('pause')}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          title="暂停"
        >
          <Pause className="w-4 h-4" />
          <span>暂停</span>
        </button>
      )}

      {isPaused && (
        <>
          <button
            onClick={() => onAction('resume')}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            title="继续"
          >
            <Play className="w-4 h-4" />
            <span>继续</span>
          </button>
          <button
            onClick={() => onAction('cancel')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title="取消"
          >
            <X className="w-4 h-4" />
            <span>取消</span>
          </button>
        </>
      )}

      {isRunning && canSkip && (
        <button
          onClick={() => onAction('skip')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          title="跳过当前步骤"
        >
          <SkipForward className="w-4 h-4" />
          <span>跳过</span>
        </button>
      )}

      {canRetry && (
        <button
          onClick={() => onAction('retry')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          title="重试"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重试</span>
        </button>
      )}
    </div>
  );
}
