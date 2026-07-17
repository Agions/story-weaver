/**
 * Step 5: 场景渲染
 *
 * 通过 useStepRenderContext() 获取 frames/onApplyRenderedFrame，
 * 不再依赖父组件层层传递 props。
 */
import { CheckCircle } from 'lucide-react';
import { lazy } from 'react';
import { useParams } from 'react-router-dom';

import { useProject } from '@/core/hooks/useProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

import { useStepRenderContext } from '../context/selectors';
import styles from '../ProjectEdit.module.less';

import { StepActions } from '@/components/pipeline/StepActions';

const RenderCenter = lazy(() => import('@/shared/components/business/RenderCenter'));

export interface StepRenderProps {
  storyboardFrames?: import('@/shared/types/storyboard').StoryboardFrame[];
  projectId?: string;
  onApplyRenderedFrame?: (frameId: string, imageUrl: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function StepRender() {
  const { frames, onApplyRenderedFrame } = useStepRenderContext();
  const { projectId } = useParams();
  const { setCurrentStep } = useProject();

  return (
    <Card className={styles.stepCard}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          场景渲染
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">渲染漫画场景，包括背景、道具和光影效果。</p>
        <div className={styles.renderCenterContainer}>
          <RenderCenter
            frames={frames}
            projectId={projectId}
            onApplyRenderedFrame={onApplyRenderedFrame}
          />
        </div>
        <StepActions onPrev={() => setCurrentStep(4)} onNext={() => setCurrentStep(6)} />
      </CardContent>
    </Card>
  );
}

export default StepRender;
