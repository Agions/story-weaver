/**
 * ProjectDetail 状态管理 Hook（facade）
 *
 * 拆分为：
 * - project-detail-computed.ts (49行): 计算属性
 * - project-detail-actions.ts (210行): 操作方法
 *
 * 本文件保留状态初始化 + effect + 组合编排。
 */
import { useCallback, useEffect, useState } from 'react';

import type { EvaluationScores, FrameComment, StoryboardVersion } from '@/core/services';
import { collaborationService, tauriService } from '@/core/services';
import type { NovelMetadata } from '@/features/script/components/NovelImporter';
import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';
import { toast } from '@/shared/components/ui/toast';
import { useProjectStore } from '@/shared/stores';
import type { ProjectData } from '@/shared/types';
import type { Script, VideoSegment } from '@/shared/types/script';

import {
  useHandleApplyRenderedFrame,
  useHandleCreateScript,
  useHandleExportReviewNotes,
  useHandleExportScript,
  useHandleScriptChange,
  usePersistProjectPatch,
} from './project-detail-actions';
import {
  useExportQualityGate,
  useEvaluationSummary,
  useSelectedFrame,
  useStoryboardFrames,
} from './project-detail-computed';

export interface UseProjectDetailOptions {
  projectId: string;
}

export interface UseProjectDetailReturn {
  // State
  loading: boolean;
  project: ProjectData | null;
  activeScript: Script | null;
  activeTab: string;
  novelMetadata: NovelMetadata | null;
  selectedFrameId: string | undefined;

  // Computed
  storyboardFrames: StoryboardFrame[];
  evaluationSummary: EvaluationScores | undefined;
  exportQualityGate: ReturnType<typeof import('@/core/services').qualityGateService.evaluate>;
  selectedFrame: StoryboardFrame | null;

  // Setters
  setProject: React.Dispatch<React.SetStateAction<ProjectData | null>>;
  setActiveScript: React.Dispatch<React.SetStateAction<Script | null>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setNovelMetadata: React.Dispatch<React.SetStateAction<NovelMetadata | null>>;
  setSelectedFrameId: React.Dispatch<React.SetStateAction<string | undefined>>;

  // Actions
  persistProjectPatch: (patch: Record<string, unknown>) => void;
  handleApplyRenderedFrame: (frameId: string, imageUrl: string) => void;
  handleExportReviewNotes: () => Promise<void>;
  handleCreateScript: () => void;
  handleGenerateScript: () => void;
  handleScriptChange: (segments: VideoSegment[]) => void;
  handleExportScript: () => Promise<void>;
  handleDeleteProject: () => void;
  preloadTabModules: (tabKey: string) => void;
}

export function useProjectDetail({ projectId }: UseProjectDetailOptions): UseProjectDetailReturn {
  const { projects, updateProject, deleteProject } = useProjectStore();

  // ─── 状态 ───
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [activeTab, setActiveTab] = useState('novel');
  const [novelMetadata, setNovelMetadata] = useState<NovelMetadata | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | undefined>(undefined);

  // ─── 计算属性（提取到子模块） ───
  const storyboardFrames = useStoryboardFrames(project);
  const evaluationSummary = useEvaluationSummary(project);
  const exportQualityGate = useExportQualityGate(storyboardFrames, evaluationSummary);
  const selectedFrame = useSelectedFrame(storyboardFrames, selectedFrameId);

  // ─── 操作方法（提取到子模块，依赖链显式传递） ───
  const persistProjectPatch = usePersistProjectPatch(project, setProject, updateProject);
  const handleApplyRenderedFrame = useHandleApplyRenderedFrame(
    project,
    storyboardFrames,
    persistProjectPatch
  );
  const handleExportReviewNotes = useHandleExportReviewNotes(
    project,
    storyboardFrames,
    evaluationSummary
  );
  const handleCreateScript = useHandleCreateScript(
    project,
    setProject,
    setActiveScript,
    updateProject
  );
  const handleScriptChange = useHandleScriptChange(
    project,
    activeScript,
    setProject,
    setActiveScript,
    updateProject
  );
  const handleExportScript = useHandleExportScript(project, activeScript);

  // ─── 内联简单操作 ───
  const handleGenerateScript = useCallback(() => {
    // Caller should use useNavigate - this returns navigation intent
  }, []);

  const handleDeleteProject = useCallback(() => {
    if (!projectId) return;
    deleteProject(projectId);
  }, [projectId, deleteProject]);

  // Preload mapping
  const preloadByTab = {
    novel: [],
    'script-edit': [],
    storyboard: [],
    character: [],
    render: [],
    composition: [],
    audio: [],
    cost: [],
    export: [],
  } as Record<string, Array<() => Promise<unknown>>>;

  const preloadTabModules = useCallback(
    (tabKey: string) => {
      const tasks = preloadByTab[tabKey] || [];
      tasks.forEach((task) => void task());
    },
    [preloadByTab]
  );

  // ─── Effects ───

  // 自动选中第一帧
  useEffect(() => {
    if (storyboardFrames.length === 0) {
      setSelectedFrameId(undefined);
      return;
    }
    if (!selectedFrameId || !storyboardFrames.some((frame) => frame.id === selectedFrameId)) {
      setSelectedFrameId(storyboardFrames[0].id);
    }
  }, [storyboardFrames, selectedFrameId]);

  // 从 store 加载项目
  useEffect(() => {
    if (!projectId) return;
    const currentProject = projects.find((p) => p.id === projectId) as ProjectData | undefined;
    if (currentProject) {
      setProject(currentProject);
      if (currentProject.scripts?.length) setActiveScript(currentProject.scripts[0]);
      if (currentProject.novelMetadata)
        setNovelMetadata(currentProject.novelMetadata as NovelMetadata);
      if (
        Array.isArray(currentProject.storyboardComments) ||
        Array.isArray(currentProject.storyboardVersions)
      ) {
        collaborationService.hydrate(
          currentProject.id,
          (currentProject.storyboardComments ?? []) as FrameComment[],
          (currentProject.storyboardVersions ?? []) as StoryboardVersion[]
        );
      }
    } else {
      toast.error('找不到项目信息');
    }
    setLoading(false);
  }, [projectId, projects]);

  return {
    loading,
    project,
    activeScript,
    activeTab,
    novelMetadata,
    selectedFrameId,
    storyboardFrames,
    evaluationSummary,
    exportQualityGate,
    selectedFrame,
    setProject,
    setActiveScript,
    setActiveTab,
    setNovelMetadata,
    setSelectedFrameId,
    persistProjectPatch,
    handleApplyRenderedFrame,
    handleExportReviewNotes,
    handleCreateScript,
    handleGenerateScript,
    handleScriptChange,
    handleExportScript,
    handleDeleteProject,
    preloadTabModules,
  };
}
