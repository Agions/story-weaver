/**
 * AI Assistant 领域实体类型
 * @file AI 相关领域模型、配置和状态类型定义
 */

/** 聊天消息结构 */
export interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  time: Date;
}

/** AI 模型选项 */
export interface AIModelOption {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'baidu';
}

/** 字幕语言选项 */
export interface LanguageOption {
  code: string;
  name: string;
}

/** 字幕生成配置 */
export interface SubtitleConfig {
  language: string;
  format: 'srt' | 'vtt' | 'ass';
  autoSegment: boolean;
  filterFiller: boolean;
  precision: number;
  translateLang: string;
}

/** 智能剪辑配置 */
export interface SmartCutConfig {
  mode: 'content' | 'pace' | 'compact' | 'highlight';
  targetDuration: 'auto' | '30' | '60' | '120' | 'custom';
  removeSilence: boolean;
  optimizeTransition: boolean;
  keyContentPriority: number;
  sceneSensitivity: number;
}

/** AI Assistant Tab 类型 */
export type AIAssistantTab = 'chat' | 'subtitles' | 'smartcut' | 'enhance';

/** AI Assistant 状态 */
export interface AIAssistantState {
  activeTab: AIAssistantTab;
  // Chat
  prompt: string;
  messages: ChatMessage[];
  selectedModel: string;
  // Subtitles
  selectedLang: string;
  subtitleFormat: 'srt' | 'vtt' | 'ass';
  autoSegment: boolean;
  filterFiller: boolean;
  precision: number;
  translateLang: string;
  // SmartCut
  smartCutMode: 'content' | 'pace' | 'compact' | 'highlight';
  targetDuration: 'auto' | '30' | '60' | '120' | 'custom';
  removeSilence: boolean;
  optimizeTransition: boolean;
  keyContentPriority: number;
  sceneSensitivity: number;
  // Common
  processing: boolean;
  progress: number;
}

/** AI Assistant Actions */
export interface AIAssistantActions {
  setActiveTab: (tab: AIAssistantTab) => void;
  setPrompt: (prompt: string) => void;
  sendMessage: () => void;
  handleKeyPress: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  setSelectedModel: (model: string) => void;
  generateSubtitles: () => void;
  setSelectedLang: (lang: string) => void;
  setSubtitleFormat: (format: 'srt' | 'vtt' | 'ass') => void;
  setAutoSegment: (value: boolean) => void;
  setFilterFiller: (value: boolean) => void;
  setPrecision: (value: number) => void;
  setTranslateLang: (lang: string) => void;
  smartCut: () => void;
  setSmartCutMode: (mode: 'content' | 'pace' | 'compact' | 'highlight') => void;
  setTargetDuration: (duration: 'auto' | '30' | '60' | '120' | 'custom') => void;
  setRemoveSilence: (value: boolean) => void;
  setOptimizeTransition: (value: boolean) => void;
  setKeyContentPriority: (value: number) => void;
  setSceneSensitivity: (value: number) => void;
}

/** AI Assistant Hook 返回值 */
export type UseAIAssistantReturn = AIAssistantState & AIAssistantActions;

// Constants
export const AI_MODELS: AIModelOption[] = [
  { id: 'gpt-4o', name: 'GPT-4o (通用)', provider: 'openai' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus (高精度)', provider: 'anthropic' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (多模态)', provider: 'google' },
  { id: 'ernie-4.0', name: '文心一言 (中文优化)', provider: 'baidu' },
];

export const LANGUAGES: LanguageOption[] = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: '英语' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' },
  { code: 'es', name: '西班牙语' },
  { code: 'ru', name: '俄语' },
];

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  language: 'zh',
  format: 'srt',
  autoSegment: true,
  filterFiller: true,
  precision: 80,
  translateLang: '',
};

export const DEFAULT_SMART_CUT_CONFIG: SmartCutConfig = {
  mode: 'content',
  targetDuration: 'auto',
  removeSilence: true,
  optimizeTransition: true,
  keyContentPriority: 70,
  sceneSensitivity: 50,
};
