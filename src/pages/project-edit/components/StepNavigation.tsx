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

interface StepNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

/** 项目编辑页顶部步骤导航条 */
export function StepNavigation({ currentStep, onStepChange }: StepNavigationProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStep
                    ? 'bg-green-100 text-green-700'
                    : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => onStepChange(index)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
