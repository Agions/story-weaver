/**
 * useAIAssistant — AIAssistant Container Hook
 *
 * 职责：
 * - 所有 useState 状态管理（16个状态）
 * - 业务逻辑函数（sendMessage/generateSubtitles/smartCut）
 * - 渲染逻辑（renderMessages）
 * - 无任何 JSX 直接渲染
 */

import { useReducer, useCallback } from 'react';

import type { ChatMessage, UseAIAssistantReturn } from '../../types/ai-assistant.entities';

import {
  aiAssistantReducer,
  initialAIAssistantState,
  createAIAssistantSetters,
} from './useAIAssistant.reducer';

export function useAIAssistant(): UseAIAssistantReturn {
  // ── 18 个 useState 已迁移到 useReducer 状态机 (2026-06-11) ──
  const [state, dispatch] = useReducer(aiAssistantReducer, initialAIAssistantState);
  const {
    setActiveTab,
    setPrompt,
    setMessages,
    setSelectedModel,
    setSelectedLang,
    setSubtitleFormat,
    setAutoSegment,
    setFilterFiller,
    setPrecision,
    setTranslateLang,
    setSmartCutMode,
    setTargetDuration,
    setRemoveSilence,
    setOptimizeTransition,
    setKeyContentPriority,
    setSceneSensitivity,
    setProcessing,
    setProgress,
  } = createAIAssistantSetters(dispatch);

  // 派生 state — 从 reducer state 拿
  const {
    activeTab,
    prompt,
    messages,
    selectedModel,
    selectedLang,
    subtitleFormat,
    autoSegment,
    filterFiller,
    precision,
    translateLang,
    smartCutMode,
    targetDuration,
    removeSilence,
    optimizeTransition,
    keyContentPriority,
    sceneSensitivity,
    processing,
    progress,
  } = state;

  // ── Business logic ────────────────────────────────────────

  /** 发送消息 */
  const sendMessage = useCallback(() => {
    if (!prompt.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      time: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');

    setProcessing(true);
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        role: 'ai',
        content: `我将帮您完成"${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"。正在处理您的请求...`,
        time: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setProcessing(false);
    }, 1500);
  }, [prompt]);

  /** 键盘事件处理 */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  /** 生成字幕 */
  const generateSubtitles = useCallback(() => {
    setProcessing(true);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setProcessing(false);

        const resultMessage: ChatMessage = {
          role: 'ai',
          content: '已成功生成字幕!字幕已经添加到时间轴上,您可以在编辑器中查看和修改。',
          time: new Date(),
        };
        setMessages((prev) => [...prev, resultMessage]);
      }
    }, 300);
  }, []);

  /** 智能剪辑 */
  const smartCut = useCallback(() => {
    setProcessing(true);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 3;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setProcessing(false);

        const resultMessage: ChatMessage = {
          role: 'ai',
          content: '智能剪辑完成!已为您移除了沉默部分并优化了节奏。可以在时间轴上查看剪辑结果。',
          time: new Date(),
        };
        setMessages((prev) => [...prev, resultMessage]);
      }
    }, 200);
  }, []);

  // ── Derived data (not state) ──────────────────────────────

  // ── Return full state + actions ────────────────────────────
  return {
    // State
    activeTab,
    prompt,
    messages,
    selectedModel,
    selectedLang,
    subtitleFormat,
    autoSegment,
    filterFiller,
    precision,
    translateLang,
    smartCutMode,
    targetDuration,
    removeSilence,
    optimizeTransition,
    keyContentPriority,
    sceneSensitivity,
    processing,
    progress,
    // Actions
    setActiveTab,
    setPrompt,
    sendMessage,
    handleKeyPress,
    setSelectedModel,
    generateSubtitles,
    setSelectedLang,
    setSubtitleFormat,
    setAutoSegment,
    setFilterFiller,
    setPrecision,
    setTranslateLang,
    smartCut,
    setSmartCutMode,
    setTargetDuration,
    setRemoveSilence,
    setOptimizeTransition,
    setKeyContentPriority,
    setSceneSensitivity,
  };
}
