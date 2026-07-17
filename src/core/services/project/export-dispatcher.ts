/**
 * Export 统一调度入口
 *
 * 从 export-service.ts 抽离 exportProject 主函数。
 * 按 ProjectExportFormat 分发到具体实现（ZIP/ASS/MP4/GIF）。
 *
 * 注：PDF 已被原 exportProject 标记为禁用（jsPDF 依赖已移除），
 * 因此 dispatcher 这里也保持一致行为。
 */

import { saveAs } from 'file-saver';

import {
  ProjectExportFormat,
  type ProjectExportOptions,
  type ProgressCallback,
  type StoryboardData,
} from './export-types';
import { generateFileName } from './export-utils';
import { exportAsZip } from './image-export';
import { generateASS } from './subtitle-generators';
import { exportAsGIF, exportAsMP4 } from './video-export';

/**
 * 统一导出入口：按 format 分发到对应实现 + 触发浏览器下载。
 * 行为与原 exportProject 逐字一致。
 */
export async function exportProject(
  storyboard: StoryboardData,
  options: ProjectExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const fileName = options.fileName || generateFileName(storyboard.title, options.format);

  switch (options.format) {
    case ProjectExportFormat.ZIP: {
      const zipBlob = await exportAsZip(storyboard, options, onProgress);
      saveAs(zipBlob, fileName);
      return zipBlob;
    }
    case ProjectExportFormat.ASS: {
      const assContent = generateASS(storyboard);
      const assBlob = new Blob([assContent], { type: 'text/plain' });
      saveAs(assBlob, fileName);
      return assBlob;
    }
    case ProjectExportFormat.PDF:
      // PDF 导出已禁用 (jsPDF 依赖已移除)
      throw new Error('PDF export is not supported');
    case ProjectExportFormat.MP4: {
      return exportAsMP4(storyboard, fileName, options, onProgress);
    }
    case ProjectExportFormat.GIF: {
      return exportAsGIF(storyboard, fileName, options, onProgress);
    }
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}
