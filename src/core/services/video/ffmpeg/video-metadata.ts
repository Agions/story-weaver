/**
 * 视频元信息读取
 *
 * 把"用浏览器 <video> 元素读 metadata"封装成 Promise，
 * 内部自动 revokeObjectURL 防泄露。
 */

import type { VideoMetadata } from './types';

/**
 * 从 Blob 读取视频时长/宽高。
 * fps/codec/bitrate 浏览器侧无法精确获取，返回估算/占位值（与原行为一致）。
 */
export async function getVideoInfoFromBlob(blob: Blob): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: 30,
        codec: 'unknown',
        bitrate: 0,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('无法读取视频信息'));
    };

    video.src = URL.createObjectURL(blob);
  });
}
