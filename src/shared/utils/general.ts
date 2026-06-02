/**
 * frame-forge Shared Utils - General Utilities
 */

import { useState, useEffect, useCallback } from 'react';

type GenericFunction = (...args: unknown[]) => unknown;

/**
 * 防抖函数
 */
export function debounce<T extends GenericFunction>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends GenericFunction>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 深拷贝 - 使用 structuredClone 原生方法
 * 支持 Set、Map、RegExp、Error、Symbol 等复杂对象
 */
export function deepClone<T>(obj: T): T {
  // 处理原始类型和 null
  if (obj === null || typeof obj !== 'object') return obj;

  // 处理 Date
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;

  // 使用原生 structuredClone（支持更多类型，性能更好）
  try {
    return structuredClone(obj);
  } catch {
    // fallback: 手动处理不支持的类型
  }

  // 手动处理数组
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as unknown as T;

  // 手动处理普通对象
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 生成唯一 ID - 使用 crypto API 替代 Math.random()
 * 性能更好，碰撞概率更低
 */
export function generateId(): string {
  // 使用 crypto.randomUUID() (ES2021+), 降级到时间戳+随机数
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 降级方案: 时间戳 + 高随机性随机数
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${randomPart}`;
}

/**
 * 生成带前缀的唯一ID
 * @param prefix ID前缀，如 'scene', 'char', 'comp'
 * @example generatePrefixedId('scene') => 'scene_1a2b3c4d_x5y6z7'
 */
export function generatePrefixedId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/** 生成场景ID */
export const generateSceneId = () => generatePrefixedId('scene');
/** 生成帧ID */
export const generateFrameId = () => generatePrefixedId('frame');
/** 生成角色ID */
export const generateCharId = () => generatePrefixedId('char');
/** 生成合成ID */
export const generateCompId = () => generatePrefixedId('comp');
/** 生成项目ID */
export const generateProjectId = () => generatePrefixedId('proj');
/** 生成素材项ID */
export const generateItemId = () => generatePrefixedId('item');

/**
 * 下载文件
 */
export function downloadFile(content: string | Blob, filename: string, type?: string): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 读取文件为 Data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 读取文件为文本
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * 从剪贴板读取
 */
export async function readFromClipboard(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return '';
  }
}

/**
 * 随机颜色
 */
export function randomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * 颜色对比度
 */
export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 首字母大写
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 驼峰转短横线
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * 短横线转驼峰
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

/**
 * 数组分块
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 数组去重
 */
export function uniqueArray<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * 数组排序
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * 对象过滤
 */
export function filterObject<T extends Record<string, unknown>>(
  obj: T,
  predicate: (key: string, value: unknown) => boolean
): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (predicate(key, value)) {
      (result as Record<string, unknown>)[key as string] = value;
    }
  }
  return result;
}

/**
 * 对象映射
 */
export function mapObject<T, U>(
  obj: Record<string, T>,
  mapper: (key: string, value: T) => U
): Record<string, U> {
  const result: Record<string, U> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = mapper(key, value);
  }
  return result;
}

/**
 * 流水线处理延时常量（模拟真实操作耗时）
 */
export const PROCESSING_DELAY_MS = {
  // FFmpeg 各阶段
  FFMPEG_INIT: 800,
  FFMPEG_STREAM_MUX: 1200,
  FFMPEG_ENCODE: 1000,
  FFMPEG_AUDIO_MIX: 800,
  FFMPEG_MUX_MP4: 600,
  FFMPEG_FILE_WRITE: 500,
  // 导出操作
  EXPORT_VIDEO: 2000,
  CLIP_VIDEO: 1000,
  MERGE_VIDEO: 2000,
  ADD_SUBTITLE: 1500,
  // 模拟重审
  REVIEW_RECHECK: 1000,
} as const;

/**
 * 延迟
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 重试
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await delay(delayMs * Math.pow(2, i));
      }
    }
  }

  throw lastError!;
}

/**
 * 检测文件类型
 */
export function detectFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const typeMap: Record<string, string> = {
    mp4: 'video',
    mov: 'video',
    avi: 'video',
    mkv: 'video',
    webm: 'video',
    flv: 'video',
    wmv: 'video',
    mp3: 'audio',
    wav: 'audio',
    flac: 'audio',
    aac: 'audio',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    webp: 'image',
    svg: 'image',
    pdf: 'document',
    doc: 'document',
    docx: 'document',
    txt: 'text',
    json: 'code',
    js: 'code',
    ts: 'code',
    srt: 'subtitle',
    vtt: 'subtitle',
    ass: 'subtitle',
  };

  return typeMap[ext] || 'unknown';
}

/**
 * 验证邮箱
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * 验证 URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全 JSON 解析
 */
export function safeJSONParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 计算哈希
 */
export async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
