/**
 * 视频合成环境检测
 *
 * 集中 3 个运行时环境判断：
 *   - isTauri()                 是否在 Tauri 桌面环境运行
 *   - isFFmpegWasmAvailable()   浏览器是否支持 FFmpeg.wasm（需 SharedArrayBuffer）
 *   - getSupportedFeatures()    三种能力的快照（给 UI / 调试用）
 *
 * 单一职责：纯检测函数，不持有状态。
 */

/**
 * 检测是否在 Tauri 桌面环境运行（看 window.__TAURI__ 是否存在）。
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window;
}

/**
 * 检测浏览器是否支持 FFmpeg.wasm。
 * SharedArrayBuffer 是 FFmpeg.wasm 多线程模式的硬性要求。
 */
export function isSharedArrayBufferAvailable(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

/**
 * 检测浏览器是否支持 FFmpeg.wasm。
 * 实际上等同于 SharedArrayBuffer 检测——保持独立函数名便于
 * 上层用 isFFmpegWasmAvailable() 表达语义。
 */
export function isFFmpegWasmAvailable(): boolean {
  return isSharedArrayBufferAvailable();
}

/**
 * 返回当前环境的"能力快照"
 *   - ffmpegWasm        浏览器端 FFmpeg.wasm 可用
 *   - tauri             Tauri 桌面端可用
 *   - sharedArrayBuffer 底层 SharedArrayBuffer 原生支持
 */
export function getSupportedFeatures(): {
  ffmpegWasm: boolean;
  tauri: boolean;
  sharedArrayBuffer: boolean;
} {
  return {
    ffmpegWasm: isFFmpegWasmAvailable(),
    tauri: isTauri(),
    sharedArrayBuffer: isSharedArrayBufferAvailable(),
  };
}
