/**
 * Step 6: 动态合成
 */
import { PlayCircle } from 'lucide-react';
import React, { lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { CompositionProject } from '@/core/types';
import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';

import styles from '../../ProjectEdit.module.less';

const CompositionStudio = lazy(() => import('@/components/business/CompositionStudio'));

export interface StepContentCompositionProps {
  storyboardFrames: StoryboardFrame[];
  projectId: string | undefined;
  onCompositionChange: (comp: CompositionProject) => void;
  onPrev: () => void;
  onNext: () => void;
}

const StepContentComposition: React.FC<StepContentCompositionProps> = ({
  storyboardFrames,
  projectId,
  onCompositionChange,
  onPrev,
  onNext,
}) => (
  <Card className={styles.stepCard}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <PlayCircle className="h-5 w-5" />
        动态合成
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground mb-4">
        为分镜添加动画效果和镜头运动，让画面动起来。
      </p>
      <div className={styles.compositionStudioContainer}>
        <CompositionStudio
          frames={storyboardFrames}
          projectId={projectId}
          onCompositionChange={onCompositionChange}
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

export default StepContentComposition;