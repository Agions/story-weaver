/**
 * AIAssistant — 向后兼容 re-export。
 * 真实实现位于 ./AIAssistant/AIAssistant, 本文件保留以兼容 `import AIAssistant from '@/components/ai/AIAssistant'`。
 */
export { default } from './AIAssistant/AIAssistant';

// Re-export types for backward compatibility
export type { ChatMessage } from './AIAssistant/types/ai-assistant-entities';
