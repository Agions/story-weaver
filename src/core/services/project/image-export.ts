/**
 * 图片导出（ZIP 压缩包）
 *
 * 从 export-service.ts 抽离 exportAsZip。
 * - 图片质量缩放（quality < 1.0 时通过 canvas 重采样）
 * - 把字幕 + 元数据一起打包
 */

import JSZip from 'jszip';

import { logger } from '@/core/utils/logger';

import {
  QUALITY_SCALE,
  type ProjectExportOptions,
  type ProgressCallback,
  type StoryboardData,
} from './export-types';
import { generateSRT } from './subtitle-generators';

/**
 * 把单张图片按 quality 缩放（quality=1.0 时直接返回原 blob）。
 *
 * 行为与原 exportAsZip 内联逻辑逐字一致：
 * - 通过 fetch → blob → Image → canvas → toBlob 重采样
 * - canvas.toBlob 失败时抛错（tainted 或过大）
 * - URL.revokeObjectURL 在缩放后清理
 */
async function fetchAndScaleImage(imageUrl: string, quality: number): Promise<Blob> {
  const response = await fetch(imageUrl);
  let blob = await response.blob();

  if (quality >= 1.0 || !blob.type.startsWith('image/')) {
    return blob;
  }

  const img = new Image();
  const imgUrl = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imgUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * quality);
    canvas.height = Math.round(img.height * quality);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await new Promise<Blob>((resolve, reject) => {
      const originalType = blob.type || 'image/jpeg';
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error('canvas.toBlob returned null — image may be tainted or too large'));
          }
        },
        originalType,
        0.92
      );
    });
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
  return blob;
}

/**
 * 根据 imageUrl 推断文件扩展名。
 * 与原逻辑一致：包含 `.png` 用 png，否则 jpg。
 */
function inferImageExtension(imageUrl: string): string {
  return imageUrl.includes('.png') ? 'png' : 'jpg';
}

/**
 * 把 storyboard 导出为 ZIP 压缩包。
 * - images/ 目录：所有场景图片（可选压缩）
 * - subtitles.srt：可选
 * - metadata.json：标题/导出时间/场景数/总时长
 */
export async function exportAsZip(
  storyboard: StoryboardData,
  options: ProjectExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const zip = new JSZip();
  const quality = QUALITY_SCALE[options.quality];

  onProgress?.({
    current: 0,
    total: storyboard.scenes.length,
    stage: 'preparing',
    message: '准备导出...',
  });

  const imgFolder = zip.folder('images');
  for (let i = 0; i < storyboard.scenes.length; i++) {
    const scene = storyboard.scenes[i];
    onProgress?.({
      current: i + 1,
      total: storyboard.scenes.length,
      stage: 'images',
      message: `处理场景 ${i + 1}/${storyboard.scenes.length}`,
    });

    if (scene.imageUrl) {
      try {
        const blob = await fetchAndScaleImage(scene.imageUrl, quality);
        const ext = inferImageExtension(scene.imageUrl);
        imgFolder?.file(`scene_${String(i + 1).padStart(3, '0')}.${ext}`, blob);
      } catch (err) {
        logger.warn(`Failed to fetch image for scene ${scene.id}:`, err);
      }
    }
  }

  if (options.includeSubtitles) {
    const subtitles = generateSRT(storyboard);
    zip.file('subtitles.srt', subtitles);
  }

  const metadata = {
    title: storyboard.title,
    exportDate: new Date().toISOString(),
    sceneCount: storyboard.scenes.length,
    totalDuration: storyboard.totalDuration,
    format: 'zip',
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  onProgress?.({
    current: storyboard.scenes.length,
    total: storyboard.scenes.length,
    stage: 'compressing',
    message: '压缩中...',
  });

  return await zip.generateAsync({ type: 'blob' });
}
