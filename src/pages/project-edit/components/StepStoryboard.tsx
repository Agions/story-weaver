/**
 * Step 3: 分镜设计
 *
 * 通过 useStepStoryboardContext() 获取 frames/selectedFrame/commentDraft 等，
 * 通过 useProjectEdit() 获取 focusFrameId，
 * 不再依赖父组件层层传递 props。
 */
import { Image } from 'lucide-react';
import { lazy } from 'react';

import { useProject } from '@/core/hooks/useProject';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from '@/shared/components/ui/toast';

import { useProjectEdit } from '../context/ProjectEditContext';
import { useStepStoryboardContext } from '../context/selectors';
import styles from '../ProjectEdit.module.less';

import CollaborationPanel from './CollaborationPanel';
import { StepActions } from '@/components/pipeline/StepActions';

const StoryboardEditor = lazy(
  () => import('@/components/pipeline/StoryboardEditor/StoryboardEditor')
);

export interface StepStoryboardProps {
  storyboardFrames?: import('@/shared/types/storyboard').StoryboardFrame[];
  storyAnalysis?: import('@/shared/types').StoryAnalysis | null;
  selectedFrame?: import('@/shared/types/storyboard').StoryboardFrame | null;
  focusFrameId?: string;
  commentDraft?: string;
  versionLabel?: string;
  compareLeftVersionId?: string;
  compareRightVersionId?: string;
  versionDiff?: import('@/core/services/domain/collaboration-service').VersionDiffSummary | null;
  storyboardVersions?: import('@/core/services/domain/collaboration-service').StoryboardVersion[];
  projectId?: string;
  onFramesChange?: (frames: import('@/shared/types/storyboard').StoryboardFrame[]) => void;
  onFrameSelect?: (frame: import('@/shared/types/storyboard').StoryboardFrame | null) => void;
  onBuildDraft?: () => void;
  onAddComment?: () => void;
  onSaveVersion?: () => void;
  onCompareVersions?: () => void;
  onRollback?: () => void;
  onCommentDraftChange?: (v: string) => void;
  onLeftVersionChange?: (v: string | undefined) => void;
  onRightVersionChange?: (v: string | undefined) => void;
  onVersionLabelChange?: (v: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function StepStoryboard() {
  const { state: projectEditState } = useProjectEdit();
  const { focusFrameId, storyAnalysis } = projectEditState;
  const {
    frames: storyboardFrames,
    onFramesChange,
    onFrameSelect,
    onBuildDraft,
  } = useStepStoryboardContext();
  const { setCurrentStep } = useProject();

  return (
    <Card className={styles.stepCard}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          分镜设计
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">设计漫画分镜，确定每个场景的构图和镜头。</p>
        <div className={styles.storyboardContainer}>
          <div className={styles.storyboardActions}>
            <Button
              variant="outline"
              onClick={() => {
                if (!storyAnalysis) {
                  toast.warning('请先完成 AI 结构化解析');
                  return;
                }
                onBuildDraft();
                toast.success('已根据解析结果生成分镜草案');
              }}
            >
              生成分镜草案
            </Button>
          </div>
          <StoryboardEditor
            key={`${storyboardFrames.length}-${storyboardFrames[0]?.id || 'none'}`}
            initialFrames={storyboardFrames}
            focusFrameId={focusFrameId}
            onChange={onFramesChange}
            onFrameSelect={onFrameSelect}
          />
          <CollaborationPanel />
        </div>
        <StepActions onPrev={() => setCurrentStep(2)} onNext={() => setCurrentStep(4)} />
      </CardContent>
    </Card>
  );
}

export default StepStoryboard;
