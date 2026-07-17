import {
  CheckCircle,
  Download,
  Edit,
  FileText,
  Image,
  PlayCircle,
  User,
  Volume2,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { secureStorage } from '@/core/services/project/secure-storage-service';

interface StepDefinition {
  key: string;
  title: string;
  icon: LucideIcon;
}

const STEPS: StepDefinition[] = [
  { key: 'import', title: '导入', icon: FileText },
  { key: 'analysis', title: 'AI解析', icon: Zap },
  { key: 'script', title: '剧本', icon: Edit },
  { key: 'storyboard', title: '分镜', icon: Image },
  { key: 'character', title: '角色', icon: User },
  { key: 'render', title: '渲染', icon: CheckCircle },
  { key: 'composition', title: '合成', icon: PlayCircle },
  { key: 'audio', title: '配音', icon: Volume2 },
  { key: 'export', title: '导出', icon: Download },
];

/** Pipeline step IDs that support checkpoint resume */
const CHECKPOINTABLE_STEP_IDS = [
  'step-import',
  'step-analysis',
  'step-script',
  'step-storyboard',
  'step-character',
  'step-render',
  'step-video-editing',
  'step-export',
] as const;

interface StepNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  projectId?: string;
}

interface CheckpointStatus {
  completed: boolean;
}

/** 项目编辑页顶部步骤导航条（含断点状态指示） */
export function StepNavigation({ currentStep, onStepChange, projectId }: StepNavigationProps) {
  const [checkpointStatuses, setCheckpointStatuses] = useState<Map<string, CheckpointStatus>>(new Map());

  // 加载断点状态
  useEffect(() => {
    if (!projectId) return;
    const statuses = new Map<string, CheckpointStatus>();
    CHECKPOINTABLE_STEP_IDS.forEach(async (stepId) => {
      const cp = await secureStorage.loadCheckpoint(stepId);
      statuses.set(stepId, { completed: cp?.completed ?? false });
      setCheckpointStatuses(new Map(statuses));
    });
  }, [projectId]);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = index === currentStep;
          const isCompleted = index < currentStep;
          const isCheckpointed = checkpointStatuses.has(CHECKPOINTABLE_STEP_IDS[index]);
          const hasCheckpoint = isCheckpointed && checkpointStatuses.get(CHECKPOINTABLE_STEP_IDS[index])?.completed;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors relative ${
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : isCompleted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => onStepChange(index)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{step.title}</span>
              {/* 断点指示器 */}
              {hasCheckpoint && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"
                  title="有断点"
                />
              )}
              {isCompleted && !hasCheckpoint && (
                <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
