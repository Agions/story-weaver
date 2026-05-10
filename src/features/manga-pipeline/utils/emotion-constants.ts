/**
 * 情感常量定义
 * 统一管理所有情感相关的映射关系
 */

// 情感关键词映射（用于提示词）
export const EMOTION_KEYWORDS: Record<string, string> = {
  tense: 'dark atmosphere, suspenseful',
  angry: 'red tones, harsh lighting, dramatic',
  sad: 'blue tones, soft lighting, melancholic',
  happy: 'bright colors, warm lighting, cheerful',
  surprising: 'dynamic composition, dramatic lighting',
  neutral: 'balanced lighting, natural colors',
};

// 情感提示词数组（用于组合提示词）
export const EMOTION_PROMPTS: Record<string, string[]> = {
  tense: ['dark atmosphere', 'suspenseful lighting', 'dynamic tension'],
  angry: ['red tones', 'harsh lighting', 'dramatic shadows'],
  sad: ['blue tones', 'soft lighting', 'melancholic mood'],
  happy: ['bright colors', 'warm lighting', 'cheerful atmosphere'],
  surprising: ['dynamic composition', 'dramatic lighting', 'unexpected angle'],
  neutral: ['balanced lighting', 'natural colors', 'calm atmosphere'],
};

// 所有情感类型列表
export const EMOTION_TYPES = Object.keys(EMOTION_KEYWORDS);

// 获取默认情感
export const DEFAULT_EMOTION = 'neutral';
