/**
 * 视频缩略图生成 (DOM Canvas)
 * =============================
 * 把 video 帧绘制到 canvas 并转 dataURL。
 * 单一职责：canvas 截帧。无业务编排。
 */
import { DEFAULT_THUMBNAIL_WIDTH, THUMBNAIL_JPEG_QUALITY } from './video-constants';

/**
 * 在指定时间戳截取视频帧，返回 JPEG dataURL。
 *
 * - 用 onloadeddata → 设置 currentTime → onseeked → drawImage 链路
 * - 保持视频原始宽高比，width 参数控制输出宽度
 *
 * @throws canvas 2d context 不可用 / 视频加载失败
 */
export function captureVideoFrameAsDataURL(
  videoPath: string,
  timestamp: number = 0,
  width: number = DEFAULT_THUMBNAIL_WIDTH
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.crossOrigin = 'anonymous';

    video.onloadeddata = () => {
      const aspectRatio = video.videoHeight / video.videoWidth;
      canvas.width = width;
      canvas.height = Math.round(width * aspectRatio);

      video.currentTime = timestamp;
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', THUMBNAIL_JPEG_QUALITY);
        resolve(thumbnail);
      } else {
        reject(new Error('Failed to create canvas context'));
      }
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    video.src = videoPath;
  });
}
