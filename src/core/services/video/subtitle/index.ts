/**
 * Subtitle 子模块统一入口（兼容 facade）
 *
 * 旧代码从 '@/core/services/video/subtitle-service' 导入。
 * 该文件改为薄壳，本目录为真正的实现。
 */

export { adjustTiming, generateFromScript, generateFromText, mergeTracks } from './generators';

export {
  buildVTTPosition,
  exportASS,
  exportSRT,
  exportSubtitles,
  exportTXT,
  exportVTT,
  toAssAlignment,
  toAssColor,
} from './exporters';

export { importSubtitles, parseSRT, parseVTT } from './parsers';

export { generateFromVideo, parseAIGeneratedSubtitles, translateSubtitles } from './ai-subtitle';

export { ASS_STYLE_PRESETS, DEFAULT_SUBTITLE_STYLE } from './types';

export type {
  ScriptSegmentInput,
  SubtitleFormat,
  SubtitleItem,
  SubtitleStyle,
  SubtitleTimeframe,
  SubtitleTrack,
} from './types';
