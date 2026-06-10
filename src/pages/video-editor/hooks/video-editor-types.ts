/**
 * 视频编辑器类型定义
 */
export interface VideoSegment {
  id: string;
  start: number;
  end: number;
  type: string;
  content?: string;
}

export type OutputFormat = 'mp4' | 'mov' | 'mkv' | 'webm';
export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';
