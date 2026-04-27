/**
 * Step 5: 场景渲染
 */
import { CheckCircle } from 'lucide-react';
import React, { lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';

import styles from '../../ProjectEdit.module.less';

const RenderCenter = lazy(() => import('@/components/business/RenderCenter'));

export interface StepContentRenderProps {
  storyboardFrames: StoryboardFrame[];
  projectId: string | undefined;
  onApplyRenderedFrame: (frameId: string, imageUrl: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const StepContentRender: React.FC<StepContentRenderProps> = ({
  storyboardFrames,
  projectId,
  onApplyRenderedFrame,
  onPrev,
  onNext,
}) => (
  <Card className={styles.stepCard}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5" />
        场景渲染
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground mb-4">
        渲染漫画场景，包括背景、道具和光影效果。
      </p>
      <div className={styles.renderCenterContainer}>
        <RenderCenter
          frames={storyboardFrames}
          projectId={projectId}
          onApplyRenderedFrame={onApplyRenderedFrame}
        />
      </div>
      <div className={styles.stepActions}>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrev}>上一步</Button>
          <Button variant="default" onClick={onNext}>下一步</Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StepContentRender;