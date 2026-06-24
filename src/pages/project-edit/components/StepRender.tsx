/**
 * Step 5: 场景渲染
 */
import { CheckCircle } from 'lucide-react';
import { lazy } from 'react';

import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

import styles from '../ProjectEdit.module.less';

import { StepActions } from './StepActions';

const RenderCenter = lazy(() => import('@/shared/components/business/RenderCenter'));

export interface StepRenderProps {
  storyboardFrames: StoryboardFrame[];
  projectId: string | undefined;
  onApplyRenderedFrame: (frameId: string, imageUrl: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

function StepRender({
  storyboardFrames,
  projectId,
  onApplyRenderedFrame,
  onPrev,
  onNext,
}: StepRenderProps) {
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
            frames={storyboardFrames}
            projectId={projectId}
            onApplyRenderedFrame={onApplyRenderedFrame}
          />
        </div>
        <StepActions onPrev={onPrev} onNext={onNext} />
      </CardContent>
    </Card>
  );
}

export default StepRender;
