/**
 * AutoPipelinePage — Autonomous Mode 全自动漫剧制作页面
 *
 * 提供：
 * - AutoPipelineWizard：一步式启动向导（输入内容、选择风格、启动流水线）
 * - AutonomousProgress：流水线执行进度监控
 */

import { useEffect, useState } from 'react';

import { AutoPipelineWizard, AutonomousProgress } from '@/features/auto-pipeline';
import { useAutoPipelineStore } from '@/features/auto-pipeline/stores/autoPipelineStore';

export default function AutoPipelinePage() {
  const { mode } = useAutoPipelineStore();
  const [showProgress, setShowProgress] = useState(false);

  // 监听流水线状态变化，自动切换到进度视图
  useEffect(() => {
    if (mode === 'running' || mode === 'paused' || mode === 'completed' || mode === 'failed') {
      setShowProgress(true);
    }
  }, [mode]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 流水线未运行或用户主动切换：显示向导 */}
      {(!showProgress || mode === 'idle') && <AutoPipelineWizard />}

      {/* 流水线运行中/完成/失败：显示进度 */}
      {showProgress && mode !== 'idle' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">AI 全自动制作进度</h1>
            {mode === 'completed' && (
              <button
                onClick={() => setShowProgress(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                返回向导
              </button>
            )}
          </div>
          <AutonomousProgress />
        </div>
      )}
    </div>
  );
}
