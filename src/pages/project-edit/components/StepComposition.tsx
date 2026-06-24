/**
 * Step 6: 动态合成
 */
import { PlayCircle } from 'lucide-react';
import { lazy } from 'react';

import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { CompositionProject } from '@/shared/types';

import styles from '../ProjectEdit.module.less';

import { StepActions } from './StepActions';

const CompositionStudio = lazy(() => import('@/shared/components/business/CompositionStudio'));

export interface StepCompositionProps {
  storyboardFrames: StoryboardFrame[];
  projectId: string | undefined;
  onCompositionChange: (comp: CompositionProject) => void;
  onPrev: () => void;
  onNext: () => void;
}

function StepComposition({
  storyboardFrames,
  projectId,
  onCompositionChange,
  onPrev,
  onNext,
}: StepCompositionProps) {
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
            frames={storyboardFrames}
            projectId={projectId}
            onCompositionChange={onCompositionChange}
          />
        </div>
        <StepActions onPrev={onPrev} onNext={onNext} />
      </CardContent>
    </Card>
  );
}

export default StepComposition;
