/**
 * 配音编辑面板
 * 封装 AudioEditor + onConfigChange 持久化逻辑
 */

import React, { Suspense } from 'react';

import { tauriService } from '@/core/services';
import { logger } from '@/core/utils/logger';
import { toast } from '@/shared/components/ui/toast';
import { Spin } from '@/shared/components/ui/spin';
import type { ProjectData } from '@/shared/types';

import AudioEditorComponent from './AudioEditor';

export interface AudioEditorPanelProps {
  project: ProjectData;
  /** 保存 audioConfig 变更到 project store */
  onPersistPatch: (patch: Record<string, unknown>) => void;
}

export const AudioEditorPanel: React.FC<AudioEditorPanelProps> = ({ project, onPersistPatch }) => {
  const handleConfigChange = (config: unknown) => {
    const updatedProject = {
      ...project,
      audioConfig: config,
      updatedAt: new Date().toISOString(),
    };
    onPersistPatch({ audioConfig: config });
    tauriService.writeText(project.id, JSON.stringify(updatedProject)).catch((err) => {
      logger.error('保存音频配置失败:', err);
      toast.error('保存音频配置失败');
    });
  };

  return (
    <Suspense fallback={<Spin />}>
      <AudioEditorComponent
        initialConfig={project.audioConfig}
        videoDuration={Math.max((project.storyboardFrames?.length ?? 0) * 5, 60)}
        onConfigChange={handleConfigChange}
      />
    </Suspense>
  );
};
