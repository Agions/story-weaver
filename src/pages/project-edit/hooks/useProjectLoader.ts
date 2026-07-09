import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { tauriService } from '@/core/services';
import type { ScriptImportMetadata } from '@/features/script/components/NovelImporter';
import type { StoryAnalysis, Character, CompositionProject, ProjectData } from '@/shared/types';
import type { AudioTrackConfig } from '@/shared/types/audio';

/** Page-local extension of canonical ProjectData with strongly-typed fields. */
export interface ProjectEditData extends ProjectData {
  name: string;
  content?: string;
  script?: string;
  novelMetadata?: ScriptImportMetadata;
}

type Setters = {
  setError: (msg: string | null) => void;
  setInitialLoading: (v: boolean) => void;
  setIsNewProject: (v: boolean) => void;
  setName: (v: string) => void;
  setDescription: (v: string) => void;
  setContent: (v: string) => void;
  setNovelMetadata: (v: ScriptImportMetadata | null) => void;
  setStoryAnalysis: (v: StoryAnalysis | null) => void;
  setAnalysisDraft: (v: string) => void;
  setAnalysisState: (v: 'idle' | 'generated' | 'accepted') => void;
  setCurrentStep: (v: number) => void;
  setFocusFrameId: (v: string | undefined) => void;
  setAudioConfig: (v: AudioTrackConfig) => void;
  setAudioEditorKey: (v: string) => void;
  setCharacters: (v: Character[]) => void;
  setComposition: (v: CompositionProject | null) => void;
  setExportPreset: (v: '9:16' | '16:9' | '1:1') => void;
  mergeExportSettings: (partial: Record<string, unknown>) => void;
  setScriptText: (v: string) => void;
  updateProject: (data: Partial<ProjectData>) => void;
};

/**
 * 封装项目加载逻辑的 hook。
 * 将 useEffect + 数据解析 + 多 setState 从 ProjectEditPage 中提取，
 * 使主体聚焦事件协调。
 */
export function useProjectLoader(opts: {
  projectId: string | undefined;
  /** All the setState callbacks from the parent component */
  setters: Setters;
  /** Storyboard store — 只传引用，内部按原始类型调用 */
  storyboard: object;
  /** Collaboration service — 只传引用，内部按原始类型调用 */
  collaborationService: object;
}) {
  const { projectId, setters } = opts;
  const storyboard = opts.storyboard as {
    setFrames: (frames: unknown[] | ((prev: unknown[]) => unknown[])) => void;
    setComments: (comments: unknown[]) => void;
    setVersions: (versions: unknown[]) => void;
  };
  const collaborationService = opts.collaborationService as {
    hydrate: (id: string, comments: unknown[], versions: unknown[]) => void;
    listComments: (id: string) => unknown[];
    listVersions: (id: string) => unknown[];
  };
  const location = useLocation();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!projectId || loaded) return;

    setters.setInitialLoading(true);
    setters.setIsNewProject(false);

    tauriService
      .readProjectFile(projectId)
      .then((projectText) => {
        const projectData = JSON.parse(projectText) as ProjectEditData;
        setters.updateProject({ name: projectData.name, description: projectData.description });
        setters.setName(projectData.name);
        setters.setDescription(projectData.description ?? '');

        if (projectData.content) setters.setContent(projectData.content);
        if (projectData.novelMetadata) setters.setNovelMetadata(projectData.novelMetadata);
        if (projectData.storyAnalysis) {
          setters.setStoryAnalysis(projectData.storyAnalysis);
          setters.setAnalysisDraft(JSON.stringify(projectData.storyAnalysis, null, 2));
          setters.setAnalysisState('accepted');
        }
        if (Array.isArray(projectData.storyboardFrames))
          storyboard.setFrames(projectData.storyboardFrames);
        if (
          Array.isArray(projectData.storyboardComments) ||
          Array.isArray(projectData.storyboardVersions)
        ) {
          collaborationService.hydrate(
            projectData.id,
            projectData.storyboardComments ?? [],
            projectData.storyboardVersions ?? []
          );
          storyboard.setComments(collaborationService.listComments(projectData.id));
          storyboard.setVersions(collaborationService.listVersions(projectData.id));
        }
        if (projectData.audioConfig) {
          setters.setAudioConfig(projectData.audioConfig);
          setters.setAudioEditorKey(`audio-${Date.now()}`);
        }
        if (Array.isArray(projectData.characters)) setters.setCharacters(projectData.characters);
        if (projectData.composition) setters.setComposition(projectData.composition);
        if (projectData.exportPreset) setters.setExportPreset(projectData.exportPreset);
        if (projectData.exportSettings) setters.mergeExportSettings(projectData.exportSettings);
        if (projectData.script) {
          setters.setScriptText(projectData.script);
          setters.setCurrentStep(2);
        } else if (projectData.content) {
          setters.setCurrentStep(1);
        }

        const search = new URLSearchParams(location.search);
        const frameId = search.get('frameId');
        const stepValue = search.get('step');
        if (frameId) {
          setters.setCurrentStep(3);
          setters.setFocusFrameId(frameId);
        } else if (stepValue) {
          const nextStep = Number(stepValue);
          if (Number.isInteger(nextStep) && nextStep >= 0 && nextStep <= 8) {
            setters.setCurrentStep(nextStep);
          }
        }

        setters.setError(null);
        setLoaded(true);
      })
      .catch(() => {
        setters.setError('加载项目失败，请确认项目文件是否存在');
        setLoaded(true);
      })
      .finally(() => {
        setters.setInitialLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, location.search]);

  return { loaded };
}
