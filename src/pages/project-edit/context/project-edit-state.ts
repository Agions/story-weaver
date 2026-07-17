import type { ScriptImportMetadata } from '@/components/ai';
import type { QualityGateIssue } from '@/core/services';
import type { Character, CompositionProject, StoryAnalysis } from '@/shared/types';
import type { AudioTrackConfig } from '@/shared/types/audio';
import type { ContentType } from '@/core/services/domain/collaboration-service';

/** ProjectEditProvider 管理的页面级状态。 */
export interface ProjectEditState {
  // 内容 / 分析
  content: string;
  novelMetadata: ScriptImportMetadata | null;
  loading: boolean;
  storyAnalysis: StoryAnalysis | null;
  analysisDraft: string;
  analysisState: 'idle' | 'generated' | 'accepted';
  // 分镜 UI
  focusFrameId: string | undefined;
  commentDraft: string;
  versionLabel: string;
  // 音频
  audioConfig: AudioTrackConfig;
  audioEditorKey: string;
  audioGenerating: boolean;
  // 自定义
  characters: Character[];
  composition: CompositionProject | null;
}

/** 所有页面级操作的函数签名。 */
export interface ProjectEditActions {
  // 内容
  loadContent: (content: string, metadata: ScriptImportMetadata) => void;
  removeContent: () => void;
  // AI
  analyzeContent: () => Promise<void>;
  acceptAnalysis: () => Promise<void>;
  setAnalysisDraft: (draft: string) => void;
  // 分镜协作
  addFrameComment: () => void;
  saveStoryboardVersion: () => void;
  compareVersions: () => void;
  rollbackVersion: () => void;
  buildStoryboardDraft: () => void;
  setCommentDraft: (draft: string) => void;
  setVersionLabel: (label: string) => void;
  setFocusFrameId: (id: string | undefined) => void;
  // 通用版本控制（支持脚本/角色/素材/分镜）
  saveVersionByType: (contentType: ContentType, data: unknown, label?: string) => void;
  listVersionsByType: (contentType: ContentType) => unknown[];
  compareVersionsByType: (leftId: string, rightId: string) => unknown;
  rollbackVersionByType: (contentType: ContentType, versionId: string) => unknown | null;
  // 渲染
  applyRenderedFrame: (frameId: string, imageUrl: string) => void;
  // 音频
  generateVoices: () => Promise<void>;
  setAudioConfig: (config: AudioTrackConfig) => void;
  // 导出 / 保存
  saveProject: () => Promise<void>;
  exportReviewNotes: () => Promise<void>;
  locateIssueFrame: (issue: QualityGateIssue) => void;
  // 剧本
  exportScript: (format: string) => void;
  // 自定义
  setCharacters: (characters: Character[]) => void;
  setComposition: (composition: CompositionProject) => void;
}

/** Context Provider 暴露的完整 value 形状（内部使用）。 */
export interface ProjectEditContextValue {
  state: ProjectEditState;
  actions: ProjectEditActions;
}

export const initialProjectEditState: ProjectEditState = {
  content: '',
  novelMetadata: null,
  loading: false,
  storyAnalysis: null,
  analysisDraft: '',
  analysisState: 'idle',
  focusFrameId: undefined,
  commentDraft: '',
  versionLabel: '',
  audioConfig: {
    voiceTracks: [],
    backgroundMusic: null,
    soundEffects: [],
    masterVolume: 80,
    voiceVolume: 80,
    musicVolume: 50,
    effectVolume: 70,
  },
  audioEditorKey: 'audio-init',
  audioGenerating: false,
  characters: [],
  composition: null,
};
