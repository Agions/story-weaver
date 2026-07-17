/**
 * 字幕服务（Facade）
 *
 * 业务行为完全不变；内部职责拆分到 subtitle/ 子目录：
 * - types            所有类型/默认样式/ASS 预设
 * - time-parser      SRT/VTT 时间字符串解析
 * - text-processor   字幕文本清洗
 * - generators       generateFromScript/Text、adjustTiming、mergeTracks
 * - exporters        exportSRT/VTT/ASS/TXT、统一 exportSubtitles 入口
 * - parsers          parseSRT/VTT、统一 importSubtitles 入口
 * - ai-subtitle      AI 生成字幕 + 翻译
 *
 * 类 SubtitleService 仅保留编排职责，方法签名与行为与原版完全一致。
 */

import { generateFromVideo, translateSubtitles } from './subtitle/ai-subtitle';
import { exportSubtitles } from './subtitle/exporters';
import {
  adjustTiming,
  generateFromScript,
  generateFromText,
  mergeTracks,
} from './subtitle/generators';
import { importSubtitles, parseSRT, parseVTT } from './subtitle/parsers';

// 类型与常量 —— 透传 re-export，保持旧 import 路径有效
export type {
  ScriptSegmentInput,
  SubtitleFormat,
  SubtitleItem,
  SubtitleStyle,
  SubtitleTimeframe,
  SubtitleTrack,
} from './subtitle/types';

export { ASS_STYLE_PRESETS, DEFAULT_SUBTITLE_STYLE } from './subtitle/types';

/**
 * 字幕服务类 —— 对外门面，方法签名/行为与重构前完全一致。
 */
class SubtitleService {
  /** 从脚本生成字幕（保留原 generateFromScript 签名） */
  generateFromScript = generateFromScript;

  /** 从时间帧生成字幕（保留原 generateFromText 签名：第一参 text 被忽略） */
  generateFromText = generateFromText;

  /** AI 生成字幕（保留原 generateFromVideo 签名） */
  generateFromVideo = generateFromVideo;

  /** 翻译字幕（保留原 translateSubtitles 签名） */
  translateSubtitles = translateSubtitles;

  /** 统一导出入口（保留原 exportSubtitles 签名） */
  exportSubtitles = exportSubtitles;

  /** 解析 SRT（保留原 parseSRT 签名） */
  parseSRT = parseSRT;

  /** 解析 VTT（保留原 parseVTT 签名） */
  parseVTT = parseVTT;

  /** 导入字幕（保留原 importSubtitles 签名） */
  importSubtitles = importSubtitles;

  /** 调整字幕时间（保留原 adjustTiming 签名） */
  adjustTiming = adjustTiming;

  /** 合并字幕轨道（保留原 mergeTracks 签名） */
  mergeTracks = mergeTracks;
}

export const subtitleService = new SubtitleService();
export default subtitleService;
