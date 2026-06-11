/**
 * useAIAssistant Reducer — 状态机化
 *
 * 架构决策 (2026-06-11):
 *   useAIAssistant.ts 18 useState 化, 1 个 reducer 集中管理:
 *   - activeTab / prompt / messages / selectedModel (Chat 4)
 *   - selectedLang / subtitleFormat / autoSegment / filterFiller /
 *     precision / translateLang (Subtitle 6)
 *   - smartCutMode / targetDuration / removeSilence / optimizeTransition /
 *     keyContentPriority / sceneSensitivity (SmartCut 6)
 *   - processing / progress (Common 2)
 *
 * 对外 API 不变: 18 setXxx 名字 + signature 保持兼容,
 * 调用方 0 改动, 业务 callback (sendMessage/generateSubtitles/smartCut)
 * 内部 setMessages(prev => ...) updater pattern 正常支持.
 */

import type {
  AIAssistantState,
  AIAssistantTab,
  ChatMessage,
} from '../../types/ai-assistant.entities';

// ─── Re-export State 类型 (供 useAIAssistant.ts 用) ────────────────────────
export type { AIAssistantState };

// ─── Action 类型 (generic set/update) ─────────────────────────────────────

export type AIAssistantAction =
  | { type: 'set'; key: keyof AIAssistantState; value: unknown }
  | {
      type: 'update';
      key: keyof AIAssistantState;
      updater: (prev: unknown) => unknown;
    };

// ─── 初始 State ────────────────────────────────────────────────────────────

const initialMessages: ChatMessage[] = [
  {
    role: 'ai',
    content:
      '您好!我是您的AI漫剧助手。我可以帮助您生成角色、撰写脚本、设计分镜、合成配音与字幕,提供创意建议。请告诉我您需要什么帮助?',
    time: new Date(),
  },
];

export const initialAIAssistantState: AIAssistantState = {
  // Tab
  activeTab: 'chat' as AIAssistantTab,
  // Chat
  prompt: '',
  messages: initialMessages,
  selectedModel: 'gpt-4o',
  // Subtitle
  selectedLang: 'zh',
  subtitleFormat: 'srt' as AIAssistantState['subtitleFormat'],
  autoSegment: true,
  filterFiller: true,
  precision: 80,
  translateLang: '',
  // SmartCut
  smartCutMode: 'content' as AIAssistantState['smartCutMode'],
  targetDuration: 'auto' as AIAssistantState['targetDuration'],
  removeSilence: true,
  optimizeTransition: true,
  keyContentPriority: 70,
  sceneSensitivity: 50,
  // Common
  processing: false,
  progress: 0,
};

// ─── Reducer ───────────────────────────────────────────────────────────────

export function aiAssistantReducer(
  state: AIAssistantState,
  action: AIAssistantAction
): AIAssistantState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value } as AIAssistantState;
    case 'update':
      return {
        ...state,
        [action.key]: action.updater(state[action.key]),
      } as AIAssistantState;
    default:
      return state;
  }
}

// ─── Setter 工厂 ───────────────────────────────────────────────────────────

type Updater<T> = T | ((prev: T) => T);

function makeSetter<K extends keyof AIAssistantState>(
  dispatch: (action: AIAssistantAction) => void,
  key: K
) {
  return (payload: Updater<AIAssistantState[K]>) => {
    if (typeof payload === 'function') {
      const updater = payload as unknown as (prev: unknown) => unknown;
      dispatch({ type: 'update', key, updater });
    } else {
      dispatch({ type: 'set', key, value: payload });
    }
  };
}

// ─── 18 setter wrap ────────────────────────────────────────────────────────

export interface AIAssistantSetter {
  setActiveTab: (v: Updater<AIAssistantTab>) => void;
  setPrompt: (v: Updater<string>) => void;
  setMessages: (v: Updater<ChatMessage[]>) => void;
  setSelectedModel: (v: Updater<string>) => void;
  setSelectedLang: (v: Updater<string>) => void;
  setSubtitleFormat: (v: Updater<AIAssistantState['subtitleFormat']>) => void;
  setAutoSegment: (v: Updater<boolean>) => void;
  setFilterFiller: (v: Updater<boolean>) => void;
  setPrecision: (v: Updater<number>) => void;
  setTranslateLang: (v: Updater<string>) => void;
  setSmartCutMode: (v: Updater<AIAssistantState['smartCutMode']>) => void;
  setTargetDuration: (v: Updater<AIAssistantState['targetDuration']>) => void;
  setRemoveSilence: (v: Updater<boolean>) => void;
  setOptimizeTransition: (v: Updater<boolean>) => void;
  setKeyContentPriority: (v: Updater<number>) => void;
  setSceneSensitivity: (v: Updater<number>) => void;
  setProcessing: (v: Updater<boolean>) => void;
  setProgress: (v: Updater<number>) => void;
}

export function createAIAssistantSetters(
  dispatch: (action: AIAssistantAction) => void
): AIAssistantSetter {
  return {
    setActiveTab: makeSetter(dispatch, 'activeTab'),
    setPrompt: makeSetter(dispatch, 'prompt'),
    setMessages: makeSetter(dispatch, 'messages'),
    setSelectedModel: makeSetter(dispatch, 'selectedModel'),
    setSelectedLang: makeSetter(dispatch, 'selectedLang'),
    setSubtitleFormat: makeSetter(dispatch, 'subtitleFormat'),
    setAutoSegment: makeSetter(dispatch, 'autoSegment'),
    setFilterFiller: makeSetter(dispatch, 'filterFiller'),
    setPrecision: makeSetter(dispatch, 'precision'),
    setTranslateLang: makeSetter(dispatch, 'translateLang'),
    setSmartCutMode: makeSetter(dispatch, 'smartCutMode'),
    setTargetDuration: makeSetter(dispatch, 'targetDuration'),
    setRemoveSilence: makeSetter(dispatch, 'removeSilence'),
    setOptimizeTransition: makeSetter(dispatch, 'optimizeTransition'),
    setKeyContentPriority: makeSetter(dispatch, 'keyContentPriority'),
    setSceneSensitivity: makeSetter(dispatch, 'sceneSensitivity'),
    setProcessing: makeSetter(dispatch, 'processing'),
    setProgress: makeSetter(dispatch, 'progress'),
  };
}
