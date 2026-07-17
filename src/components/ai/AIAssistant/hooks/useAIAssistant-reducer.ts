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

import type { AIAssistantState, AIAssistantTab, ChatMessage } from '../types/ai-assistant-entities';

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

import { createFieldUpdater, type FieldUpdater as Updater } from '@/shared/utils/reducer-helpers';

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
    setActiveTab: createFieldUpdater(dispatch as (action: unknown) => void, 'activeTab'),
    setPrompt: createFieldUpdater(dispatch as (action: unknown) => void, 'prompt'),
    setMessages: createFieldUpdater(dispatch as (action: unknown) => void, 'messages'),
    setSelectedModel: createFieldUpdater(dispatch as (action: unknown) => void, 'selectedModel'),
    setSelectedLang: createFieldUpdater(dispatch as (action: unknown) => void, 'selectedLang'),
    setSubtitleFormat: createFieldUpdater(dispatch as (action: unknown) => void, 'subtitleFormat'),
    setAutoSegment: createFieldUpdater(dispatch as (action: unknown) => void, 'autoSegment'),
    setFilterFiller: createFieldUpdater(dispatch as (action: unknown) => void, 'filterFiller'),
    setPrecision: createFieldUpdater(dispatch as (action: unknown) => void, 'precision'),
    setTranslateLang: createFieldUpdater(dispatch as (action: unknown) => void, 'translateLang'),
    setSmartCutMode: createFieldUpdater(dispatch as (action: unknown) => void, 'smartCutMode'),
    setTargetDuration: createFieldUpdater(dispatch as (action: unknown) => void, 'targetDuration'),
    setRemoveSilence: createFieldUpdater(dispatch as (action: unknown) => void, 'removeSilence'),
    setOptimizeTransition: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'optimizeTransition'
    ),
    setKeyContentPriority: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'keyContentPriority'
    ),
    setSceneSensitivity: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'sceneSensitivity'
    ),
    setProcessing: createFieldUpdater(dispatch as (action: unknown) => void, 'processing'),
    setProgress: createFieldUpdater(dispatch as (action: unknown) => void, 'progress'),
  };
}
