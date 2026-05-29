/**
 * 字幕领域实体类型
 */

export interface SubtitleItem {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style?: SubtitleStyle;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outline: boolean;
  outlineColor: string;
  position: 'top' | 'middle' | 'bottom';
  alignment: 'left' | 'center' | 'right';
}

export interface SubtitleEditorProps {
  subtitles: SubtitleItem[];
  onChange: (subtitles: SubtitleItem[]) => void;
  currentTime?: number;
  videoWidth?: number;
  videoHeight?: number;
  showPreview?: boolean;
  readonly?: boolean;
  className?: string;
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: 'Microsoft YaHei',
  fontSize: 24,
  color: '#ffffff',
  backgroundColor: 'transparent',
  outline: true,
  outlineColor: '#000000',
  position: 'bottom',
  alignment: 'center',
};

export const FONT_FAMILY_OPTIONS = [
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '黑体', value: 'SimHei' },
  { label: '楷体', value: 'KaiTi' },
  { label: '苹方', value: 'PingFang SC' },
  { label: '思源黑体', value: 'Source Han Sans SC' },
];

export const POSITION_OPTIONS = [
  { label: '顶部', value: 'top' },
  { label: '中间', value: 'middle' },
  { label: '底部', value: 'bottom' },
];

export const ALIGNMENT_OPTIONS = [
  { label: 'left', value: 'left' },
  { label: 'center', value: 'center' },
  { label: 'right', value: 'right' },
];
