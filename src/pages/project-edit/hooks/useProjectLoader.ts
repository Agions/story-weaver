import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import type { ScriptImportMetadata } from '@/components/ai';
import { tauriService } from '@/core/services';
import type { StoryAnalysis, Character, CompositionProject, ProjectData } from '@/shared/types';
import type { AudioTrackConfig } from '@/shared/types/audio';

/** Page-local extension of canonical ProjectData with strongly-typed fields. */
export interface ProjectEditData extends ProjectData {
  name: string;
  content?: string;
  script?: string;
  novelMetadata?: ScriptImportMetadata;
}

/** 项目加载结果 — 用于初始化 ProjectEditProvider 的 state。 */
export interface ProjectLoadResult {
  name: string;
  description: string;
  content?: string;
  novelMetadata?: ScriptImportMetadata;
  storyAnalysis?: StoryAnalysis;
  storyboardFrames?: unknown[];
  storyboardComments?: unknown[];
  storyboardVersions?: unknown[];
  audioConfig?: AudioTrackConfig;
  characters?: Character[];
  composition?: CompositionProject;
  script?: string;
  exportPreset?: '9:16' | '16:9' | '1:1';
  exportSettings?: Record<string, unknown>;
  /** 根据 URL 参数或项目数据推断的初始 step */
  initialStep: number;
  /** URL 中的 frameId 参数（如有） */
  frameId?: string;
}

/**
 * 封装项目加载逻辑的 hook。
 * 仅负责读取原始数据 + 解析，返回 ProjectEditData。
 * 初始 state 注入由 ProjectEditProvider 完成。
 */
export function useProjectLoader(projectId: string | undefined): {
  loading: boolean;
  error: string | null;
  data: ProjectLoadResult | null;
} {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProjectLoadResult | null>(null);

  useEffect(() => {
    if (!projectId || data) return;

    setLoading(true);
    tauriService
      .readProjectFile(projectId)
      .then((projectText) => {
        const project = JSON.parse(projectText) as ProjectEditData;

        const search = new URLSearchParams(location.search);
        const frameId = search.get('frameId');
        const stepValue = search.get('step');

        let initialStep = 0;
        if (frameId) {
          initialStep = 3;
        } else if (stepValue) {
          const nextStep = Number(stepValue);
          if (Number.isInteger(nextStep) && nextStep >= 0 && nextStep <= 8) {
            initialStep = nextStep;
          }
        } else if (project.script) {
          initialStep = 2;
        } else if (project.content) {
          initialStep = 1;
        }

        setData({
          name: project.name,
          description: project.description ?? '',
          content: project.content,
          novelMetadata: project.novelMetadata,
          storyAnalysis: project.storyAnalysis,
          storyboardFrames: project.storyboardFrames,
          storyboardComments: project.storyboardComments,
          storyboardVersions: project.storyboardVersions,
          audioConfig: project.audioConfig,
          characters: project.characters,
          composition: project.composition,
          script: project.script,
          exportPreset: project.exportPreset,
          exportSettings: project.exportSettings,
          initialStep,
          frameId: frameId ?? undefined,
        });

        setError(null);
      })
      .catch(() => {
        setError('加载项目失败，请确认项目文件是否存在');
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, location.search, data]);

  return { loading, error, data };
}
