/**
 * ProjectEditProvider — Page-level state container for the project edit workflow.
 *
 * State management + actions extracted to use-project-edit-actions.ts.
 * This file is now lean: just wires state setters to the actions hook
 * and exposes the context value.
 */

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useTransition,
} from 'react';

import type { ScriptImportMetadata } from '@/components/ai';
import { useProject } from '@/core/hooks/useProject';
import { useStoryboard } from '@/shared/stores/storyboard-store';
import type { Character, CompositionProject, StoryAnalysis } from '@/shared/types';
import type { AudioTrackConfig } from '@/shared/types/audio';

import { initialProjectEditState, type ProjectEditContextValue } from './project-edit-state';
import { useProjectEditActions } from './use-project-edit-actions';

export type { ProjectEditContextValue } from './project-edit-state';

export const ProjectEditContext = createContext<ProjectEditContextValue | null>(null);

export function useProjectEdit(): ProjectEditContextValue {
  const ctx = useContext(ProjectEditContext);
  if (!ctx) {
    throw new Error('useProjectEdit must be used within ProjectEditProvider');
  }
  return ctx;
}

export interface ProviderProps {
  children: React.ReactNode;
  projectMetadata: {
    name: string;
    description: string;
    exportPreset: '9:16' | '16:9' | '1:1';
    exportSettings: Record<string, unknown>;
  };
  initialFocusFrameId?: string;
  initialData?: {
    content?: string;
    novelMetadata?: ScriptImportMetadata | null;
    storyAnalysis?: StoryAnalysis | null;
    audioConfig?: AudioTrackConfig;
    characters?: Character[];
    composition?: CompositionProject | null;
    script?: string;
  } | null;
}

export function ProjectEditProvider({
  children,
  projectMetadata,
  initialFocusFrameId,
  initialData,
}: ProviderProps) {
  const [, startTransition] = useTransition();
  const { project, setSaving, setCurrentStep, updateProject } = useProject();
  const storyboard = useStoryboard();

  // ─── State ────────────────────────────────────────────────────────────────
  const [content, setContent] = useState(initialData?.content ?? initialProjectEditState.content);
  const [novelMetadata, setNovelMetadata] = useState<ScriptImportMetadata | null>(
    initialData?.novelMetadata ?? initialProjectEditState.novelMetadata
  );
  const [loading, setLoading] = useState(initialProjectEditState.loading);
  const [storyAnalysis, setStoryAnalysis] = useState<StoryAnalysis | null>(
    initialData?.storyAnalysis ?? initialProjectEditState.storyAnalysis
  );
  const [analysisDraft, setAnalysisDraft] = useState(
    (initialData?.storyAnalysis ? JSON.stringify(initialData.storyAnalysis, null, 2) : '') ||
      initialProjectEditState.analysisDraft
  );
  const [analysisState, setAnalysisState] = useState<'idle' | 'generated' | 'accepted'>(
    initialData?.storyAnalysis ? 'accepted' : initialProjectEditState.analysisState
  );
  const [focusFrameId, setFocusFrameId] = useState<string | undefined>(
    initialFocusFrameId ?? initialProjectEditState.focusFrameId
  );
  const [commentDraft, setCommentDraft] = useState(initialProjectEditState.commentDraft);
  const [versionLabel, setVersionLabel] = useState(initialProjectEditState.versionLabel);
  const [audioConfig, setAudioConfig] = useState<AudioTrackConfig>(
    initialData?.audioConfig ?? initialProjectEditState.audioConfig
  );
  const [audioEditorKey, setAudioEditorKey] = useState(
    initialData?.audioConfig ? `audio-${Date.now()}` : 'audio-init'
  );
  const [audioGenerating, setAudioGenerating] = useState(initialProjectEditState.audioGenerating);
  const [characters, setCharacters] = useState<Character[]>(
    initialData?.characters ?? initialProjectEditState.characters
  );
  const [composition, setComposition] = useState<CompositionProject | null>(
    initialData?.composition ?? initialProjectEditState.composition
  );

  // ─── Actions (extracted) ─────────────────────────────────────────────────
  const actions = useProjectEditActions({
    content,
    setContent,
    setNovelMetadata,
    setLoading,
    setStoryAnalysis,
    setAnalysisDraft,
    setAnalysisState,
    setCommentDraft,
    setVersionLabel,
    setAudioConfig,
    setAudioEditorKey,
    setAudioGenerating,
    setCharacters,
    setComposition,
    setFocusFrameId,
    project: project as { id: string; name: string; createdAt: string } | null,
    setSaving,
    updateProject: updateProject as (updates: Record<string, unknown>) => void,
    setCurrentStep,
    storyboard,
    novelMetadata,
    storyAnalysis,
    analysisDraft,
    commentDraft,
    versionLabel,
    audioConfig,
    characters,
    composition,
    projectMetadata,
    startTransition,
  });

  const state = {
    content,
    novelMetadata,
    loading,
    storyAnalysis,
    analysisDraft,
    analysisState,
    focusFrameId,
    commentDraft,
    versionLabel,
    audioConfig,
    audioEditorKey,
    audioGenerating,
    characters,
    composition,
  };

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <ProjectEditContext.Provider value={value}>{children}</ProjectEditContext.Provider>;
}