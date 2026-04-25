/**
 * Step 3: 分镜设计
 */
import { Card, Typography, Space, Button, message } from 'antd';
import React, { lazy } from 'react';

const { Title, Paragraph } = Typography;
import { PictureOutlined } from '@ant-design/icons';

import type { StoryboardVersion, VersionDiffSummary, FrameComment } from '@/core/services';
import type { StoryAnalysis } from '@/core/types';
import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';

import styles from '../ProjectEdit.module.less';

import CollaborationPanel from './CollaborationPanel';


const StoryboardEditor = lazy(() => import('@/features/storyboard/components/StoryboardEditor'));

export interface StepContentStoryboardProps {
  storyboardFrames: StoryboardFrame[];
  storyAnalysis: StoryAnalysis | null;
  selectedFrame: StoryboardFrame | null;
  focusFrameId: string | undefined;
  commentDraft: string;
  versionLabel: string;
  compareLeftVersionId: string | undefined;
  compareRightVersionId: string | undefined;
  versionDiff: VersionDiffSummary | null;
  storyboardVersions: StoryboardVersion[];
  projectId: string | undefined;
  onFramesChange: (frames: StoryboardFrame[]) => void;
  onFrameSelect: (frame: StoryboardFrame | null) => void;
  onBuildDraft: () => void;
  onAddComment: () => void;
  onSaveVersion: () => void;
  onCompareVersions: () => void;
  onRollback: () => void;
  onCommentDraftChange: (v: string) => void;
  onLeftVersionChange: (v: string | undefined) => void;
  onRightVersionChange: (v: string | undefined) => void;
  onVersionLabelChange: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const StepContentStoryboard: React.FC<StepContentStoryboardProps> = ({
  storyboardFrames,
  storyAnalysis,
  selectedFrame,
  focusFrameId,
  commentDraft,
  versionLabel,
  compareLeftVersionId,
  compareRightVersionId,
  versionDiff,
  storyboardVersions,
  projectId,
  onFramesChange,
  onFrameSelect,
  onBuildDraft,
  onAddComment,
  onSaveVersion,
  onCompareVersions,
  onRollback,
  onCommentDraftChange,
  onLeftVersionChange,
  onRightVersionChange,
  onVersionLabelChange,
  onPrev,
  onNext,
}) => (
  <Card className={styles.stepCard}>
    <Title level={4}>
      <PictureOutlined /> 分镜设计
    </Title>
    <Paragraph>
      设计漫画分镜，确定每个场景的构图和镜头。
    </Paragraph>
    <div className={styles.storyboardContainer}>
      <div className={styles.storyboardActions}>
        <Button
          onClick={() => {
            if (!storyAnalysis) {
              message.warning('请先完成 AI 结构化解析');
              return;
            }
            onBuildDraft();
            message.success('已根据解析结果生成分镜草案');
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
      <CollaborationPanel
        projectId={projectId}
        selectedFrame={selectedFrame}
        commentDraft={commentDraft}
        versionLabel={versionLabel}
        compareLeftVersionId={compareLeftVersionId}
        compareRightVersionId={compareRightVersionId}
        versionDiff={versionDiff}
        storyboardVersions={storyboardVersions}
        onCommentDraftChange={onCommentDraftChange}
        onAddComment={onAddComment}
        onSaveVersion={onSaveVersion}
        onCompareVersions={onCompareVersions}
        onRollback={onRollback}
        onLeftVersionChange={onLeftVersionChange}
        onRightVersionChange={onRightVersionChange}
        onVersionLabelChange={onVersionLabelChange}
      />
    </div>
    <div className={styles.stepActions}>
      <Space>
        <Button onClick={onPrev}>上一步</Button>
        <Button type="primary" onClick={onNext}>下一步</Button>
      </Space>
    </div>
  </Card>
);

export default StepContentStoryboard;
