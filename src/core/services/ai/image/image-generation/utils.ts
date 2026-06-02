/**
 * 共享工具函数
 */

import type { ImageSize } from './types';

export type { ImageSize } from './types';

/**
 * 获取 API Key
 */
export async function getAPIKey(service: string): Promise<string> {
  const { storageService } = await import('@/shared/services/storage');
  const keys = await storageService.get('api_keys');

  if (keys && typeof keys === 'object') {
    const keyObj = keys as Record<string, string>;
    return keyObj[service] ?? keyObj[`${service}_api_key`] ?? '';
  }

  return '';
}

/**
 * 解析图像尺寸
 */
export function parseSize(size: ImageSize): { width: number; height: number } {
  if (size === '1K') return { width: 1024, height: 1024 };
  if (size === '2K') return { width: 2048, height: 2048 };
  if (size === '4K') return { width: 4096, height: 4096 };

  const [w, h] = size.split('x').map(Number);
  return { width: w ?? 1024, height: h ?? 1024 };
}

/**
 * 映射可灵尺寸
 */
export function mapKlingSize(size: ImageSize): string {
  const map: Record<string, string> = {
    '1K': '1024x1024',
    '2K': '2048x2048',
    '4K': '4096x4096',
  };
  return map[size] || size;
}

/**
 * 映射 Vidu 尺寸
 */
export function mapViduSize(size: ImageSize): string {
  const map: Record<string, string> = {
    '1K': '1024x1024',
    '2K': '1920x1920',
    '4K': '3840x2160',
  };
  return map[size] || size;
}
