/**
 * ProjectDetail 状态管理 Hook
 * 包含所有业务逻辑，与 UI 完全解耦
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { EvaluationScores, FrameComment, StoryboardVersion } from '@/core/services';
import {
  collaborationService,
  costService,
  qualityGateService,
  reviewExportService,
  tauriService,
} from '@/core/services';
import { logger } from '@/core/utils/logger';
import type { NovelMetadata } from '@/features/script/components/NovelImporter';
import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';
import { toast } from '@/shared/components/ui/Toast';
import { useProjectStore } from '@/shared/stores';
import type { ProjectData } from '@/shared/types';
import type { Script, ScriptSegment, VideoSegment } from '@/shared/types/script';

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
  exportQualityGate: ReturnType<typeof qualityGateService.evaluate>;
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

/**
 * ProjectDetail 业务逻辑 Hook
 */
export function useProjectDetail({ projectId }: UseProjectDetailOptions): UseProjectDetailReturn {
  const { projects, updateProject, deleteProject } = useProjectStore();

  // State
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [activeTab, setActiveTab] = useState('novel');
  const [novelMetadata, setNovelMetadata] = useState<NovelMetadata | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | undefined>(undefined);

  // Preload mapping
  const preloadByTab = useMemo<Record<string, Array<() => Promise<unknown>>>>(
    () => ({
      novel: [],
      'script-edit': [],
      storyboard: [],
      character: [],
      render: [],
      composition: [],
      audio: [],
      cost: [],
      export: [],
    }),
    []
  );

  // Computed: storyboardFrames
  const storyboardFrames = useMemo<StoryboardFrame[]>(
    () => (Array.isArray(project?.storyboardFrames) ? project.storyboardFrames : []),
    [project?.storyboardFrames]
  );

  // Computed: evaluationSummary
  const evaluationSummary: EvaluationScores | undefined = useMemo(
    () => project?.evaluationReport?.summary ?? project?.evaluationSummary,
    [project?.evaluationReport, project?.evaluationSummary]
  );

  // Computed: exportQualityGate
  const exportQualityGate = useMemo(
    () =>
      qualityGateService.evaluate({
        storyboardFrames,
        evaluationSummary,
      }),
    [storyboardFrames, evaluationSummary]
  );

  // Computed: selectedFrame
  const selectedFrame = useMemo<StoryboardFrame | null>(
    () => storyboardFrames.find((frame) => frame.id === selectedFrameId) ?? null,
    [storyboardFrames, selectedFrameId]
  );

  // Auto-select first frame when storyboardFrames change
  useEffect(() => {
    if (storyboardFrames.length === 0) {
      setSelectedFrameId(undefined);
      return;
    }
    if (!selectedFrameId || !storyboardFrames.some((frame) => frame.id === selectedFrameId)) {
      setSelectedFrameId(storyboardFrames[0].id);
    }
  }, [storyboardFrames, selectedFrameId]);

  // Load project from store
  useEffect(() => {
    if (!projectId) return;

    const currentProject = projects.find((p) => p.id === projectId) as ProjectData | undefined;
    if (currentProject) {
      setProject(currentProject);
      if (currentProject.scripts?.length) {
        setActiveScript(currentProject.scripts[0]);
      }
      if (currentProject.novelMetadata) {
        setNovelMetadata(currentProject.novelMetadata as NovelMetadata);
      }
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

  // Persist project patch to store + file
  const persistProjectPatch = useCallback(
    (patch: Record<string, unknown>) => {
      if (!project) return;
      const updatedProject = {
        ...project,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      setProject(updatedProject);
      updateProject(updatedProject.id, updatedProject);
      tauriService
        .writeText(updatedProject.id, JSON.stringify(updatedProject))
        .catch(() => undefined);
    },
    [project, updateProject]
  );

  // Apply rendered frame
  const handleApplyRenderedFrame = useCallback(
    (frameId: string, imageUrl: string) => {
      if (!project) return;
      const updatedFrames = storyboardFrames.map((frame) =>
        frame.id === frameId ? { ...frame, imageUrl } : frame
      );
      persistProjectPatch({ storyboardFrames: updatedFrames });
    },
    [project, storyboardFrames, persistProjectPatch]
  );

  // Export review notes
  const handleExportReviewNotes = useCallback(async () => {
    if (!project?.id) return;
    try {
      const projectComments = collaborationService.listComments(project.id);
      const projectVersions = collaborationService.listVersions(project.id);
      const projectCostStats = costService.getProjectStats(project.id);
      const projectCostRecords = costService.getRecords(project.id).slice(0, 30);
      const content = reviewExportService.toMarkdown({
        project: {
          id: project.id,
          name: project.name,
          storyboardFrameCount: storyboardFrames.length,
        },
        comments: projectComments,
        versions: projectVersions,
        costStats: projectCostStats,
        costRecords: projectCostRecords,
        evaluationSummary,
      });
      const saved = await reviewExportService.saveMarkdownToFile(
        `${project.name}_评审记录.md`,
        content,
        {
          projectId: project.id,
          projectName: project.name,
          source: 'project_detail',
        }
      );
      if (saved) {
        toast.success('评审记录导出成功');
      }
    } catch (error) {
      logger.error('导出评审记录失败:', error);
      toast.error('导出评审记录失败');
    }
  }, [project, storyboardFrames.length, evaluationSummary]);

  // Create new script
  const handleCreateScript = useCallback(() => {
    if (!project) return;

    try {
      const newScript: Script = {
        id: uuidv4(),
        title: '新剧本',
        content: '',
        segments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedProject = {
        ...project,
        scripts: [...(project.scripts ?? []), newScript],
        updatedAt: new Date().toISOString(),
      };

      setProject(updatedProject);
      setActiveScript(newScript);

      toast.loading('正在保存剧本...');
      tauriService
        .writeText(updatedProject.id, JSON.stringify(updatedProject))
        .then(() => {
          updateProject(updatedProject.id, updatedProject);
          toast.success('剧本创建成功');
        })
        .catch((error) => {
          logger.error('保存项目文件失败:', error);
          toast.error('保存项目文件失败: ' + (error instanceof Error ? error.message : '未知错误'));
          setProject(project);
          setActiveScript(project.scripts?.[0] ?? null);
        });
    } catch (error) {
      logger.error('创建剧本失败:', error);
      toast.error('创建剧本失败');
    }
  }, [project, updateProject]);

  // Navigate to edit page
  const handleGenerateScript = useCallback(() => {
    // Caller should use useNavigate - this returns navigation intent
  }, []);

  // Script content change
  const handleScriptChange = useCallback(
    (segments: VideoSegment[]) => {
      if (!project || !activeScript) return;

      try {
        const updatedScript: Script = {
          ...activeScript,
          segments: segments.map((seg) => ({
            id: seg.id,
            startTime: seg.start,
            endTime: seg.end,
            content: seg.content ?? '',
            type: seg.type as 'narration' | 'dialogue' | 'action' | 'transition',
          })),
          updatedAt: new Date().toISOString(),
        };

        const updatedScripts = (project.scripts ?? []).map((script: Script) =>
          script.id === activeScript.id ? updatedScript : script
        );

        const updatedProject = {
          ...project,
          scripts: updatedScripts,
          updatedAt: new Date().toISOString(),
        };

        setProject(updatedProject);
        setActiveScript(updatedScript);

        tauriService
          .writeText(updatedProject.id, JSON.stringify(updatedProject))
          .then(() => {
            updateProject(updatedProject.id, updatedProject);
            toast.success('脚本内容已保存');
          })
          .catch((error) => {
            logger.error('保存项目文件失败:', error);
            toast.error(
              '保存项目文件失败: ' + (error instanceof Error ? error.message : '未知错误')
            );
            setProject(project);
            setActiveScript(activeScript);
          });
      } catch (error) {
        logger.error('更新脚本内容失败:', error);
        toast.error('更新脚本内容失败');
      }
    },
    [project, activeScript, updateProject]
  );

  // Export script
  const handleExportScript = useCallback(async () => {
    if (!project || !activeScript) {
      toast.warning('没有可导出的剧本');
      return;
    }

    try {
      const scriptContent =
        activeScript.segments
          ?.map((segment: ScriptSegment, index: number) => {
            return `【第${index + 1}幕】\n${segment.content ?? ''}\n`;
          })
          .join('\n') ?? '';

      const { invoke } = await import('@tauri-apps/api/core');
      const filePath = await invoke<string>('save_file_dialog', {
        defaultPath: `${project.name}_剧本.txt`,
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      });

      if (filePath) {
        await invoke('write_text_file', {
          path: filePath,
          content: scriptContent,
        });
        toast.success('剧本导出成功');
      }
    } catch (error) {
      logger.error('导出剧本失败:', error);
      toast.error('导出剧本失败');
    }
  }, [project, activeScript]);

  // Delete project (navigation handled by caller)
  const handleDeleteProject = useCallback(() => {
    if (!projectId) return;
    deleteProject(projectId);
  }, [projectId, deleteProject]);

  // Preload tab modules
  const preloadTabModules = useCallback(
    (tabKey: string) => {
      const tasks = preloadByTab[tabKey] || [];
      tasks.forEach((task) => {
        void task();
      });
    },
    [preloadByTab]
  );

  return {
    // State
    loading,
    project,
    activeScript,
    activeTab,
    novelMetadata,
    selectedFrameId,

    // Computed
    storyboardFrames,
    evaluationSummary,
    exportQualityGate,
    selectedFrame,

    // Setters
    setProject,
    setActiveScript,
    setActiveTab,
    setNovelMetadata,
    setSelectedFrameId,

    // Actions
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
