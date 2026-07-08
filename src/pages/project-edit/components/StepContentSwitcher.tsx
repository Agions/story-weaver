/**
 * StepContentSwitcher — 步骤内容切换器
 *
 * 根据 currentStep index 渲染对应的步骤子组件。
 * 从 ProjectEditPage 中提取出来, 避免每次渲染重新创建组件。
 */

import type {
  StoryboardVersion,
  VersionDiffSummary,
} from '@/core/services/domain/collaboration.service';
import type { QualityGateIssue } from '@/core/services/pipeline/quality-gate.service';
import type { ScriptImportMetadata } from '@/features/script/components/NovelImporter';
import type { ExportSettings } from '@/features/video/components/VideoExporter';
import type { StoryAnalysis, Character, CompositionProject } from '@/shared/types';
import type { AudioTrackConfig } from '@/shared/types/audio';
import type { StoryboardFrame } from '@/shared/types/storyboard';

import {
  StepImport,
  StepAnalysis,
  StepScript,
  StepStoryboard,
  StepCharacter,
  StepRender,
  StepComposition,
  StepAudio,
  StepExport,
} from './index';

// --- Props ---

export interface StepContentSwitcherProps {
  currentStep: number;
  // Step 0 — Import
  content: string;
  loading: boolean;
  // Step 1 — Analysis
  novelMetadata: ScriptImportMetadata | null;
  analysisDraft: string;
  analysisState: 'idle' | 'generated' | 'accepted';
  // Shared state
  storyAnalysis: StoryAnalysis | null;
  storyboardFrames: StoryboardFrame[];
  selectedFrame: StoryboardFrame | null;
  focusFrameId: string | undefined;
  commentDraft: string;
  versionLabel: string;
  compareLeftVersionId: string | undefined;
  compareRightVersionId: string | undefined;
  versionDiff: VersionDiffSummary | null;
  storyboardVersions: StoryboardVersion[];
  projectId: string | undefined;
  // Step 4 — Character
  characters: Character[];
  // Step 7 — Audio
  audioConfig: AudioTrackConfig;
  audioEditorKey: string;
  audioGenerating: boolean;
  scriptText: string;
  // Step 8 — Export
  exportPreset: '9:16' | '16:9' | '1:1';
  exportSettings: ExportSettings;
  projectName: string;
  storyboardFrameCount: number;
  qualityGateIssues: QualityGateIssue[];
  qualityGatePassed: boolean;
  saving: boolean;
  // Callbacks
  onContentLoad: (content: string, metadata: ScriptImportMetadata) => void;
  onRemove: () => void;
  onAnalyze: () => Promise<void>;
  onAcceptAnalysis: () => Promise<void>;
  onDraftChange: (draft: string) => void;
  onExportScript: (format: string) => void;
  onSaveScript: (segments: unknown) => void;
  onFramesChange: (
    frames: StoryboardFrame[] | ((prev: StoryboardFrame[]) => StoryboardFrame[])
  ) => void;
  onFrameSelect: (frame: StoryboardFrame | null) => void;
  onBuildDraft: () => void;
  onAddComment: () => void;
  onSaveVersion: () => void;
  onCompareVersions: () => void;
  onRollback: () => void;
  onCommentDraftChange: (draft: string) => void;
  onLeftVersionChange: (id: string | undefined) => void;
  onRightVersionChange: (id: string | undefined) => void;
  onVersionLabelChange: (label: string) => void;
  onApplyRenderedFrame: (frameId: string, imageUrl: string) => void;
  onCompositionChange: (composition: CompositionProject) => void;
  onConfigChange: (config: AudioTrackConfig) => void;
  onGenerateVoices: () => Promise<void>;
  onPresetChange: (preset: '9:16' | '16:9' | '1:1') => void;
  onExportSettingsChange: (settings: Partial<ExportSettings>) => void;
  onLocateIssue: (issue: QualityGateIssue) => void;
  onSaveProject: () => Promise<void>;
  onCharactersChange: (characters: Character[]) => void;
  onGoToStep: (step: number) => void;
}

export function StepContentSwitcher({
  currentStep,
  content,
  loading,
  novelMetadata,
  analysisDraft,
  analysisState,
  storyAnalysis,
  storyboardFrames,
  selectedFrame,
  focusFrameId,
  commentDraft,
  versionLabel,
  compareLeftVersionId,
  compareRightVersionId,
  versionDiff,
  storyboardVersions,
  projectId,
  characters,
  audioConfig,
  audioEditorKey,
  audioGenerating,
  scriptText,
  exportPreset,
  exportSettings,
  projectName,
  storyboardFrameCount,
  qualityGateIssues,
  qualityGatePassed,
  saving,
  onContentLoad,
  onRemove,
  onAnalyze,
  onAcceptAnalysis,
  onDraftChange,
  onExportScript,
  onSaveScript,
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
  onApplyRenderedFrame,
  onCompositionChange,
  onConfigChange,
  onGenerateVoices,
  onPresetChange,
  onExportSettingsChange,
  onLocateIssue,
  onSaveProject,
  onCharactersChange,
  onGoToStep,
}: StepContentSwitcherProps) {
  switch (currentStep) {
    case 0:
      return (
        <StepImport
          content={content}
          loading={loading}
          onContentLoad={onContentLoad}
          onRemove={onRemove}
          onNext={() => onGoToStep(1)}
        />
      );

    case 1:
      return (
        <StepAnalysis
          content={content}
          novelMetadata={novelMetadata}
          analysisDraft={analysisDraft}
          analysisState={analysisState}
          loading={loading}
          onContentLoad={onContentLoad}
          onRemove={onRemove}
          onAnalyze={onAnalyze}
          onAccept={onAcceptAnalysis}
          onDraftChange={onDraftChange}
          onPrev={() => onGoToStep(0)}
        />
      );

    case 2:
      return (
        <StepScript
          onExport={onExportScript}
          onSave={onSaveScript}
          onPrev={() => onGoToStep(1)}
          onNext={() => onGoToStep(3)}
        />
      );

    case 3:
      return (
        <StepStoryboard
          storyboardFrames={storyboardFrames}
          storyAnalysis={storyAnalysis}
          selectedFrame={selectedFrame}
          focusFrameId={focusFrameId}
          commentDraft={commentDraft}
          versionLabel={versionLabel}
          compareLeftVersionId={compareLeftVersionId}
          compareRightVersionId={compareRightVersionId}
          versionDiff={versionDiff}
          storyboardVersions={storyboardVersions}
          projectId={projectId}
          onFramesChange={onFramesChange}
          onFrameSelect={onFrameSelect}
          onBuildDraft={onBuildDraft}
          onAddComment={onAddComment}
          onSaveVersion={onSaveVersion}
          onCompareVersions={onCompareVersions}
          onRollback={onRollback}
          onCommentDraftChange={onCommentDraftChange}
          onLeftVersionChange={onLeftVersionChange}
          onRightVersionChange={onRightVersionChange}
          onVersionLabelChange={onVersionLabelChange}
          onPrev={() => onGoToStep(2)}
          onNext={() => onGoToStep(4)}
        />
      );

    case 4:
      return (
        <StepCharacter
          characters={characters}
          projectId={projectId}
          onChange={onCharactersChange}
          onPrev={() => onGoToStep(3)}
          onNext={() => onGoToStep(5)}
        />
      );

    case 5:
      return (
        <StepRender
          storyboardFrames={storyboardFrames}
          projectId={projectId}
          onApplyRenderedFrame={onApplyRenderedFrame}
          onPrev={() => onGoToStep(4)}
          onNext={() => onGoToStep(6)}
        />
      );

    case 6:
      return (
        <StepComposition
          storyboardFrames={storyboardFrames}
          projectId={projectId}
          onCompositionChange={onCompositionChange}
          onPrev={() => onGoToStep(5)}
          onNext={() => onGoToStep(7)}
        />
      );

    case 7:
      return (
        <StepAudio
          audioConfig={audioConfig}
          audioEditorKey={audioEditorKey}
          audioGenerating={audioGenerating}
          scriptText={scriptText}
          storyboardFrames={storyboardFrames}
          onConfigChange={onConfigChange}
          onGenerateVoices={onGenerateVoices}
          onPrev={() => onGoToStep(6)}
          onNext={() => onGoToStep(8)}
        />
      );

    case 8:
      return (
        <StepExport
          exportPreset={exportPreset}
          exportSettings={exportSettings}
          projectId={projectId}
          projectName={projectName}
          storyboardFrameCount={storyboardFrameCount}
          qualityGateIssues={qualityGateIssues}
          qualityGatePassed={qualityGatePassed}
          saving={saving}
          onPresetChange={onPresetChange}
          onExport={onExportSettingsChange}
          onLocateIssue={onLocateIssue}
          onSave={onSaveProject}
          onPrev={() => onGoToStep(7)}
        />
      );

    default:
      return null;
  }
}
