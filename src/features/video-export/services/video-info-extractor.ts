/**
 * 视频信息提取 (DOM)
 * ===================
 * 把浏览器 HTMLVideoElement 的 metadata 异步读出为 VideoInfo。
 * 单一职责：把 File → VideoInfo。无业务编排。
 */
import { v4 as uuidv4 } from 'uuid';

import type { VideoInfo } from '@/shared/types';

import { DEFAULT_VIDEO_FPS, DEFAULT_VIDEO_FORMAT } from './video-constants';

/**
 * 异步读取 File 的视频元信息。
 *
 * - 用 URL.createObjectURL 触发浏览器解码
 * - onloadedmetadata 时收集 width/height/duration
 * - 资源用完 URL.revokeObjectURL 释放
 *
 * @throws 视频解码失败时 reject('Failed to read video file')
 */
export function extractVideoInfoFromFile(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);

      resolve({
        id: uuidv4(),
        path: url,
        name: file.name,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: DEFAULT_VIDEO_FPS,
        format: file.name.split('.').pop()?.toLowerCase() || DEFAULT_VIDEO_FORMAT,
        size: file.size,
        createdAt: new Date().toISOString(),
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read video file'));
    };

    video.src = url;
  });
}
