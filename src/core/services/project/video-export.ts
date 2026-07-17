/**
 * 视频导出（MP4 / GIF）
 *
 * 把原 exportProject 中 MP4 + GIF 两个分支抽离。
 * 共享 storyboardToVideoScenes + adaptFFmpegProgressToExport 工具。
 */

import { saveAs } from 'file-saver';

import {
  GIF_DEFAULT_FPS,
  GIF_DEFAULT_RESOLUTION,
  GIF_DEFAULT_SCENE_DURATION,
  MP4_DEFAULT_FPS,
  MP4_DEFAULT_RESOLUTION,
  MP4_DEFAULT_SCENE_DURATION,
  type ProjectExportOptions,
  type ProgressCallback,
  type StoryboardData,
} from './export-types';
import { adaptFFmpegProgressToExport, storyboardToVideoScenes } from './export-utils';

/**
 * 通过视频合成器导出 MP4 视频。
 * 行为与原 exportProject MP4 分支逐字一致：
 * - 动态导入 video-compositor-service（懒加载）
 * - 默认 30fps、1920×1080、每场景 3 秒
 */
export async function exportAsMP4(
  storyboard: StoryboardData,
  fileName: string,
  _options: ProjectExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const scenes = storyboardToVideoScenes(storyboard, MP4_DEFAULT_SCENE_DURATION);
  const ffmpegProgressCallback = adaptFFmpegProgressToExport(storyboard.scenes.length, onProgress);

  const result = await composeMp4Blob(
    scenes,
    MP4_DEFAULT_FPS,
    MP4_DEFAULT_RESOLUTION,
    ffmpegProgressCallback
  );

  if (!result.outputBlob) {
    throw new Error('视频导出失败');
  }
  saveAs(result.outputBlob, fileName);
  return result.outputBlob;
}

/**
 * 通过视频合成器导出 GIF。
 * 行为与原 exportProject GIF 分支逐字一致：
 * - 用 FFmpeg.wasm 生成低分辨率 MP4（fps=15、480×270、每场景 1 秒）
 * - 当前实现没有真正的 MP4→GIF 转换（注释里说明），直接返回 MP4 blob
 *   并以 .gif 后缀保存（与原行为一致）
 */
export async function exportAsGIF(
  storyboard: StoryboardData,
  fileName: string,
  _options: ProjectExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const scenes = storyboardToVideoScenes(storyboard, GIF_DEFAULT_SCENE_DURATION);
  const ffmpegProgressCallback = adaptFFmpegProgressToExport(storyboard.scenes.length, onProgress);

  const mp4Result = await composeMp4Blob(
    scenes,
    GIF_DEFAULT_FPS,
    GIF_DEFAULT_RESOLUTION,
    ffmpegProgressCallback
  );

  if (!mp4Result.outputBlob) {
    throw new Error('GIF 导出失败');
  }
  // 注：原实现没有真正的 MP4→GIF 转换，GIF 实质是低分辨率 MP4 改后缀
  const gifBlob = mp4Result.outputBlob;
  saveAs(gifBlob, fileName.replace('.mp4', '.gif'));
  return gifBlob;
}

/** 共享骨架：动态加载 compositor + 初始化 + 调用 compose */
async function composeMp4Blob(
  scenes: ReturnType<typeof storyboardToVideoScenes>,
  fps: number,
  resolution: { width: number; height: number },
  onFfmpegProgress?: (p: { progress: number; status: string; message?: string }) => void
) {
  const { videoCompositorService, initializeVideoCompositor } =
    await import('@/core/services/video/video-compositor-service');

  await initializeVideoCompositor();

  return videoCompositorService.compose(
    scenes,
    { format: 'mp4', fps, resolution },
    onFfmpegProgress
  );
}
