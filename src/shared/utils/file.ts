/**
 * 文件工具：下载、读取、剪贴板、类型检测
 */

/** 下载文件（Blob URL 触发浏览器下载） */
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
 * 通用 FileReader Promise 包装：根据 encoding 调用对应 readAs* 方法。
 * 内部 helper — 消除 readFileAsDataURL 与 readFileAsText 重复结构。
 */
function readFileAs(file: File, encoding: 'data-url' | 'text'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    if (encoding === 'data-url') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

/** 读取文件为 Data URL */
export function readFileAsDataURL(file: File): Promise<string> {
  return readFileAs(file, 'data-url');
}

/** 读取文件为文本 */
export function readFileAsText(file: File): Promise<string> {
  return readFileAs(file, 'text');
}

/** 复制到剪贴板（Clipboard API + execCommand fallback） */
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

/** 从剪贴板读取 */
export async function readFromClipboard(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return '';
  }
}

import { FILE_TYPE_MAP } from '@/core/constants';

/** 根据文件扩展名检测文件类型 */
export function detectFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return FILE_TYPE_MAP[ext] || 'unknown';
}
