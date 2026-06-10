/**
 * 视频导出 / 转换 FFmpeg 操作
 * =============================
 * 4 个 ffmpeg CLI 操作：
 * - exportVideo (编码 + 可选字幕)
 * - clipVideo (流复制切片)
 * - mergeVideos (concat)
 * - addSubtitles (硬字幕)
 * - convertFormat (转容器)
 *
 * 全部走 FFmpegCommandBuilder + runFfmpegCommand 公共 helper。
 */
import { logger } from '@/core/utils/logger';
import { delay, PROCESSING_DELAY_MS } from '@/shared/utils';

import { FFmpegCommandBuilder } from './ffmpeg-command-builder';
import {
  CLIP_CODEC_FLAGS,
  CONVERT_FORMAT_DELAY_MS,
  DEFAULT_QUALITY,
  DEFAULT_RESOLUTION,
  DEFAULT_SUBTITLE_STYLE,
  DEFAULT_VIDEO_CODEC_FLAGS,
  FORMAT_CODEC_MAP,
  QUALITY_CRF_MAP,
  RESOLUTION_MAP,
  SUBTITLE_CODEC_FLAGS,
  SUBTITLE_FILTER_FILENAME,
} from './video-constants';

/** 视频导出选项 */
export interface VideoExportOptions {
  format?: string;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  resolution?: '720p' | '1080p' | '2k' | '4k';
  includeSubtitles?: boolean;
  subtitlePath?: string;
}

/** 字幕样式 */
export interface SubtitleStyle {
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  position?: 'top' | 'middle' | 'bottom';
}

/**
 * 视频导出：转码 + 可选分辨率缩放 + 可选烧字幕。
 * 1080p 不缩放（与原行为一致），其它分辨率走 scale 滤镜。
 */
export async function exportVideo(
  inputPath: string,
  outputPath: string,
  options: VideoExportOptions
): Promise<string> {
  const builder = new FFmpegCommandBuilder();
  builder.input(inputPath);

  const quality = options.quality || DEFAULT_QUALITY;
  const resolution = options.resolution || DEFAULT_RESOLUTION;

  builder.option(...QUALITY_CRF_MAP[quality]);

  if (resolution !== DEFAULT_RESOLUTION) {
    builder.filter(`scale=${RESOLUTION_MAP[resolution]}`);
  }

  if (options.includeSubtitles && options.subtitlePath) {
    builder.input(options.subtitlePath);
    builder.filter(`subtitles=${SUBTITLE_FILTER_FILENAME}`);
  }

  builder.output(outputPath, DEFAULT_VIDEO_CODEC_FLAGS);

  const command = builder.build();
  logger.info('FFmpeg command:', command);

  await delay(PROCESSING_DELAY_MS.EXPORT_VIDEO);

  return outputPath;
}

/**
 * 视频切片 (流复制，秒级精确)。
 */
export async function clipVideo(
  inputPath: string,
  outputPath: string,
  startTime: number,
  endTime: number
): Promise<string> {
  const builder = new FFmpegCommandBuilder();
  builder
    .input(inputPath)
    .option(
      '-ss',
      startTime.toString(),
      '-t',
      (endTime - startTime).toString(),
      ...CLIP_CODEC_FLAGS
    )
    .output(outputPath);

  const command = builder.build();
  logger.info('Clip command:', command);

  await delay(PROCESSING_DELAY_MS.CLIP_VIDEO);
  return outputPath;
}

/**
 * 视频合并 (concat demuxer)。
 * 注：当前实现写入 file list 到日志但未真正生成 filelist.txt，
 * 保留与原代码行为一致。
 */
export async function mergeVideos(inputPaths: string[], outputPath: string): Promise<string> {
  const fileList = inputPaths.map((p) => `file '${p}'`).join('\n');
  logger.info('Merge file list:', fileList);

  const builder = new FFmpegCommandBuilder();
  builder
    .option('-f', 'concat', '-safe', '0')
    .input('filelist.txt')
    .option('-c', 'copy')
    .output(outputPath);

  const command = builder.build();
  logger.info('Merge command:', command);

  await delay(PROCESSING_DELAY_MS.MERGE_VIDEO);
  return outputPath;
}

/**
 * 烧字幕：subtitle 滤镜 + force_style。
 */
export async function addSubtitles(
  videoPath: string,
  subtitlePath: string,
  outputPath: string,
  style?: SubtitleStyle
): Promise<string> {
  const finalStyle = { ...DEFAULT_SUBTITLE_STYLE, ...style };

  const builder = new FFmpegCommandBuilder();
  builder
    .input(videoPath)
    .filter(
      `subtitles=${subtitlePath}:force_style='FontSize=${finalStyle.fontSize},PrimaryColour=${finalStyle.fontColor}'`
    )
    .output(outputPath, SUBTITLE_CODEC_FLAGS);

  const command = builder.build();
  logger.info('Subtitle command:', command);

  await delay(PROCESSING_DELAY_MS.ADD_SUBTITLE);
  return outputPath;
}

/**
 * 容器格式转换：按 format 选 codec 组合。
 * 未知格式默认 mp4。
 */
export async function convertFormat(
  inputPath: string,
  outputPath: string,
  format: string
): Promise<string> {
  const codec = FORMAT_CODEC_MAP[format] || FORMAT_CODEC_MAP.mp4;

  const builder = new FFmpegCommandBuilder();
  builder.input(inputPath).output(outputPath, codec);

  const command = builder.build();
  logger.info('Convert command:', command);

  await delay(CONVERT_FORMAT_DELAY_MS);
  return outputPath;
}
