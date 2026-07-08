/**
 * ProjectDetail 操作方法
 *
 * 设计：纯函数工厂，接收依赖参数返回 useCallback。
 * 不是 Hook，不遵守 Hook 规则，方便主 hook 编排依赖链。
 */
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { EvaluationScores } from '@/core/services';
import {
  collaborationService,
  costService,
  reviewExportService,
  tauriService,
} from '@/core/services';
import { logger } from '@/core/utils/logger';
import { toast } from '@/shared/components/ui/toast';
import type { ProjectData } from '@/shared/types';
import type { Script, ScriptSegment, VideoSegment } from '@/shared/types/script';
import type { StoryboardFrame } from '@/shared/types/storyboard';
import { handleAsyncError } from '@/shared/utils/async';

// ─── 持久化 ───

/** 持久化项目补丁到 store + 文件 */
export function usePersistProjectPatch(
  project: ProjectData | null,
  setProject: React.Dispatch<React.SetStateAction<ProjectData | null>>,
  updateProject: (id: string, data: ProjectData) => void
) {
  return useCallback(
    (patch: Partial<ProjectData>) => {
      if (!project) return;
      const updatedProject = {
        ...project,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      setProject(updatedProject);
      updateProject(updatedProject.id, updatedProject);
      tauriService.writeText(updatedProject.id, JSON.stringify(updatedProject)).catch((err) => {
        logger.error('持久化项目失败:', err);
        toast.error('保存失败，请重试');
      });
    },
    [project, setProject, updateProject]
  );
}

// ─── 帧操作 ───

/** 应用渲染后的帧图片 */
export function useHandleApplyRenderedFrame(
  project: ProjectData | null,
  storyboardFrames: StoryboardFrame[],
  persistProjectPatch: (patch: Partial<ProjectData>) => void
) {
  return useCallback(
    (frameId: string, imageUrl: string) => {
      if (!project) return;
      const updatedFrames = storyboardFrames.map((frame) =>
        frame.id === frameId ? { ...frame, imageUrl } : frame
      );
      persistProjectPatch({ storyboardFrames: updatedFrames });
    },
    [project, storyboardFrames, persistProjectPatch]
  );
}

// ─── 评审导出 ───

/** 导出评审记录 */
export function useHandleExportReviewNotes(
  project: ProjectData | null,
  storyboardFrames: StoryboardFrame[],
  evaluationSummary: EvaluationScores | undefined
) {
  return useCallback(async () => {
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
        { projectId: project.id, projectName: project.name, source: 'project_detail' }
      );
      if (saved) toast.success('评审记录导出成功');
    } catch (error) {
      handleAsyncError(error, '导出评审记录失败');
    }
  }, [project, storyboardFrames.length, evaluationSummary]);
}

// ─── 剧本操作 ───

/** 创建新剧本 */
export function useHandleCreateScript(
  project: ProjectData | null,
  setProject: React.Dispatch<React.SetStateAction<ProjectData | null>>,
  setActiveScript: React.Dispatch<React.SetStateAction<Script | null>>,
  updateProject: (id: string, data: ProjectData) => void
) {
  return useCallback(() => {
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
      handleAsyncError(error, '创建剧本失败');
    }
  }, [project, setProject, setActiveScript, updateProject]);
}

/** 脚本内容变更处理 */
export function useHandleScriptChange(
  project: ProjectData | null,
  activeScript: Script | null,
  setProject: React.Dispatch<React.SetStateAction<ProjectData | null>>,
  setActiveScript: React.Dispatch<React.SetStateAction<Script | null>>,
  updateProject: (id: string, data: ProjectData) => void
) {
  return useCallback(
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
        handleAsyncError(error, '更新脚本内容失败');
      }
    },
    [project, activeScript, setProject, setActiveScript, updateProject]
  );
}

/** 导出剧本 */
export function useHandleExportScript(project: ProjectData | null, activeScript: Script | null) {
  return useCallback(async () => {
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
        await invoke('write_text_file', { path: filePath, content: scriptContent });
        toast.success('剧本导出成功');
      }
    } catch (error) {
      handleAsyncError(error, '导出剧本失败');
    }
  }, [project, activeScript]);
}
