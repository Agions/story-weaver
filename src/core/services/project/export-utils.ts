/**
 * 导出辅助工具
 *
 * 把 export-service.ts 中"获取扩展名 / 生成文件名 / 列出支持格式"
 * 三个无副作用的辅助函数集中。
 */

import { ProjectExportFormat, type StoryboardData } from './export-types';

/**
 * 获取导出文件扩展名（与原 getFileExtension 行为一致）。
 */
export function getFileExtension(format: ProjectExportFormat): string {
  switch (format) {
    case ProjectExportFormat.PDF:
      return 'pdf';
    case ProjectExportFormat.ZIP:
      return 'zip';
    case ProjectExportFormat.MP4:
      return 'mp4';
    case ProjectExportFormat.GIF:
      return 'gif';
    case ProjectExportFormat.ASS:
      return 'ass';
    default:
      return 'bin';
  }
}

/**
 * 生成默认文件名：`<safeTitle>_<YYYY-MM-DD>.<ext>`
 * - 标题非中英数字字符替换为 `_`，最长 50 字符
 * - 时间戳取 ISO 字符串前 10 位
 */
export function generateFileName(title: string, format: ProjectExportFormat): string {
  const safeTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').slice(0, 50);
  const timestamp = new Date().toISOString().slice(0, 10);
  const ext = getFileExtension(format);
  return `${safeTitle}_${timestamp}.${ext}`;
}

/**
 * UI 用：列出所有支持的导出格式（含 label/description）。
 */
export function getSupportedFormats(): Array<{
  format: ProjectExportFormat;
  label: string;
  description: string;
}> {
  return [
    {
      format: ProjectExportFormat.PDF,
      label: 'PDF 漫画书',
      description: '导出为 PDF 格式的漫画书',
    },
    {
      format: ProjectExportFormat.ZIP,
      label: 'ZIP 压缩包',
      description: '包含所有图片和元数据的压缩包',
    },
    {
      format: ProjectExportFormat.ASS,
      label: 'ASS 字幕',
      description: 'Advanced SubStation Alpha 字幕文件',
    },
    {
      format: ProjectExportFormat.MP4,
      label: 'MP4 视频',
      description: '导出为 MP4 视频格式（需要先生成视频）',
    },
    {
      format: ProjectExportFormat.GIF,
      label: 'GIF 动图',
      description: '导出为 GIF 动画格式',
    },
  ];
}

/**
 * 公共进度回调工厂：把 FFmpeg.wasm 的 ExportProgress（progress/status/message）
 * 转换为项目级 ExportProgress（current/total/stage/message）。
 *
 * 原 exportProject 中 MP4/GIF 两处重复，提取到这里。
 */
export function adaptFFmpegProgressToExport(
  totalScenes: number,
  onProgress?: (progress: {
    current: number;
    total: number;
    stage: string;
    message: string;
  }) => void
): ((p: { progress: number; status: string; message?: string }) => void) | undefined {
  if (!onProgress) {
    return undefined;
  }
  return (p) => {
    onProgress({
      current: Math.round(p.progress * totalScenes),
      total: totalScenes,
      stage: p.status,
      message: p.message ?? '导出中...',
    });
  };
}

/**
 * 故事板 → 视频合成器场景数组的映射。
 * 原 MP4/GIF 两处重复，提取到这里。
 *
 * effects 故意留为空数组（与原行为一致：导出阶段不挂转场）。
 */
export function storyboardToVideoScenes(
  storyboard: StoryboardData,
  defaultDurationSeconds: number
): Array<{
  id: string;
  mediaPath: string;
  mediaType: 'image';
  startTime: number;
  duration: number;
  effects: never[];
}> {
  return storyboard.scenes.map((scene, index) => ({
    id: scene.id || `scene_${index}`,
    mediaPath: scene.imageUrl,
    mediaType: 'image' as const,
    startTime: 0,
    duration: scene.duration || defaultDurationSeconds,
    // 原代码 push `[]` 字面量，这里改为类型断言以匹配导出场景的 effects 字段
    effects: [] as never[],
  }));
}
