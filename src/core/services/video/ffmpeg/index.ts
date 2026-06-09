/**
 * FFmpeg 子模块统一入口
 *
 * 外部直接 import 各子模块更精确，但为了 ffmpeg-wasm.service.ts
 * 兼容旧代码，这里集中 re-export。
 */

export { getFFmpegInstance, isFFmpegWasmAvailable, loadFFmpeg } from './ffmpeg-instance';

export { composeVideoWithFFmpeg } from './composer';
export { getVideoInfoFromBlob } from './video-metadata';
export {
  addBackgroundMusicWithFFmpeg,
  addSubtitlesWithFFmpeg,
  concatenateVideosWithFFmpeg,
  exportVideoWithFFmpeg,
} from './video-operations';
