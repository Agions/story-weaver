/**
 * 多格式导出服务（Facade）
 *
 * 原 503 行单文件混合了"类型定义 / 辅助工具 / 字幕生成 / 图片打包 /
 * 视频合成 / PDF 生成 / 格式分发"7 类职责。现拆为 7 个子模块，主文件
 * 仅保留对外 API + re-export：
 *
 * - export-types           ProjectExportFormat/ExportQuality/Options + 默认参数常量
 * - export-utils           getFileExtension / generateFileName / getSupportedFormats
 *                          + adaptFFmpegProgressToExport（进度回调适配器）
 *                          + storyboardToVideoScenes（场景映射器）
 * - subtitle-generators    generateSRT / generateASS
 * - image-export           exportAsZip（含图片压缩逻辑）
 * - video-export           exportAsMP4 / exportAsGIF
 * - pdf-export             exportAsPDF
 * - export-dispatcher      exportProject（统一入口分发）
 *
 * 公开 API 与原版逐字一致：6 个类型 + 5 个函数。8 个调用方无需修改。
 */

// 类型与枚举 re-export（保持旧 import 路径有效）
export {
  ExportQuality,
  ProjectExportFormat,
  type ExportProgress,
  type ProjectExportOptions,
  type ProgressCallback,
  type SceneData,
  type StoryboardData,
} from './export-types';

// 函数 re-export
export { generateFileName, getFileExtension, getSupportedFormats } from './export-utils';

export { generateASS, generateSRT } from './subtitle-generators';
export { exportAsZip } from './image-export';
export { exportAsMP4, exportAsGIF } from './video-export';
export { exportProject } from './export-dispatcher';
