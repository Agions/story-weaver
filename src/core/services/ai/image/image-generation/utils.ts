/**
 * 共享工具函数
 */

import type { CharacterVideoRef, ImageSize } from './types';

export type { ImageSize } from './types';

/**
 * 把 CharacterVideoRef[] 映射为 Kling/Vidu API 期望的 { id, image_url } 格式。
 * 复用 front → fullBody 的回退逻辑，并过滤掉没有 image_url 的项。
 */
export function mapCharacterReferences(
  refs: CharacterVideoRef[] | undefined
): Array<{ id: string; image_url: string }> | undefined {
  return refs
    ?.map((ref) => ({
      id: ref.characterId,
      image_url: ref.referenceImageUrls?.front || ref.referenceImageUrls?.fullBody || '',
    }))
    .filter((r) => r.image_url);
}

/**
 * 获取 API Key
 */
export async function getAPIKey(service: string): Promise<string> {
  const { secureStorage } = await import('../../../project/secure-storage-service');
  const value = await secureStorage.getSecureConfig(`api_key_${service}`);

  if (typeof value === 'string' && value) {
    return value;
  }

  // Fallback: parse a bundled api_keys JSON if present
  const bundled = await secureStorage.getSecureConfig('api_keys');
  if (typeof bundled === 'string') {
    try {
      const keyObj = JSON.parse(bundled) as Record<string, string>;
      return keyObj[service] ?? keyObj[`${service}_api_key`] ?? '';
    } catch {
      return '';
    }
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
