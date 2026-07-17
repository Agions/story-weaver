/**
 * Step 6: 动态合成
 *
 * 通过 useStepCompositionContext() 获取 frames/onCompositionChange，
 * 不再依赖父组件层层传递 props。
 */
import { PlayCircle } from 'lucide-react';
import { lazy } from 'react';
import { useParams } from 'react-router-dom';

import { useProject } from '@/core/hooks/useProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

import { useStepCompositionContext } from '../context/selectors';
import styles from '../ProjectEdit.module.less';

import { StepActions } from '@/components/pipeline/StepActions';

const CompositionStudio = lazy(() => import('@/shared/components/business/CompositionStudio'));

export interface StepCompositionProps {
  storyboardFrames?: import('@/shared/types/storyboard').StoryboardFrame[];
  projectId?: string;
  onCompositionChange?: (comp: import('@/shared/types').CompositionProject) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function StepComposition() {
  const { frames, onCompositionChange } = useStepCompositionContext();
  const { projectId } = useParams();
  const { setCurrentStep } = useProject();

  return (
    <Card className={styles.stepCard}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          动态合成
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">为分镜添加动画效果和镜头运动，让画面动起来。</p>
        <div className={styles.compositionStudioContainer}>
          <CompositionStudio
            frames={frames}
            projectId={projectId}
            onCompositionChange={onCompositionChange}
          />
        </div>
        <StepActions onPrev={() => setCurrentStep(5)} onNext={() => setCurrentStep(7)} />
      </CardContent>
    </Card>
  );
}

export default StepComposition;
