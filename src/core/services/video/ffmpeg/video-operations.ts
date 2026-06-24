/**
 * 字幕烧录 + 背景音乐混音 + 通用视频导出/合并
 *
 * 这四个函数结构高度同构（写入输入 → exec → 读取输出 → 清理），
 * 共享 ffmpeg-pipeline 工具，仅参数构造不同。
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

import { getFFmpegInstance, setActiveProgressCallback } from './ffmpeg-instance';
import { execFFmpegCommand, readOutputAsBlob, safeDeleteFiles } from './ffmpeg-pipeline';
import { generateSRTFile } from './srt-builder';
import type { ProgressCallback, SubtitleStyle, SubtitleTrack } from './types';

/**
 * 默认烧录样式 —— 与原行为保持一致。
 */
const DEFAULT_BURNED_SUBTITLE_STYLE =
  'FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2';

/**
 * 视频导出流程的"收尾步骤"——消除 3 个 export 函数尾部 11L 模板重复。
 * 内部 helper — 收 progress 通知 + 读取输出 + 清理临时文件 + 关闭 progress 回调。
 */
async function finalizeOutput(
  ff: FFmpeg,
  outputPath: string,
  outputFormat: 'mp4' | 'webm',
  cleanupFiles: string[],
  progressCallback?: ProgressCallback
): Promise<{ resultBlob: Blob; outputPath: string }> {
  progressCallback?.({
    progress: 90,
    status: 'encoding',
    message: '生成输出文件...',
  });

  const { blob: resultBlob } = await readOutputAsBlob(ff, outputPath, `video/${outputFormat}`);

  await safeDeleteFiles(ff, cleanupFiles);

  setActiveProgressCallback(null);
  return { resultBlob, outputPath };
}

/** 把字幕烧录到视频中（保留原 addSubtitlesWithFFmpeg 签名与行为）。 */
export async function addSubtitlesWithFFmpeg(
  videoBlob: Blob,
  subtitles: SubtitleTrack,
  _style: SubtitleStyle = {},
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<{ resultBlob: Blob; outputPath: string }> {
  setActiveProgressCallback(progressCallback ?? null);

  const ff = await getFFmpegInstance();
  const outputPath = `video_with_subtitles.${outputFormat}`;

  progressCallback?.({
    progress: 10,
    status: 'preparing',
    message: '准备添加字幕...',
  });

  await ff.writeFile('input_video', await fetchFile(videoBlob));

  const srtContent = generateSRTFile(subtitles.subtitles);
  await ff.writeFile('subtitles.srt', new TextEncoder().encode(srtContent));

  progressCallback?.({
    progress: 30,
    status: 'processing',
    message: '烧录字幕...',
  });

  await execFFmpegCommand(ff, [
    '-y',
    '-i',
    'input_video',
    '-vf',
    `subtitles=subtitles.srt:force_style='${DEFAULT_BURNED_SUBTITLE_STYLE}'`,
    '-c:a',
    'copy',
    outputPath,
  ]);

  return finalizeOutput(
    ff,
    outputPath,
    outputFormat,
    ['input_video', 'subtitles.srt', outputPath],
    progressCallback
  );
}

/** 添加背景音乐（保留原 addBackgroundMusicWithFFmpeg 签名与行为）。 */
export async function addBackgroundMusicWithFFmpeg(
  videoBlob: Blob,
  musicPath: string,
  options: {
    volume?: number;
    fadeIn?: number;
    fadeOut?: number;
    loop?: boolean;
  } = {},
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<{ resultBlob: Blob; outputPath: string }> {
  setActiveProgressCallback(progressCallback ?? null);

  const ff = await getFFmpegInstance();
  const outputPath = `video_with_music.${outputFormat}`;
  const musicExt = musicPath.split('.').pop() || 'mp3';
  const musicFileName = `background_music.${musicExt}`;

  progressCallback?.({
    progress: 10,
    status: 'preparing',
    message: '准备添加背景音乐...',
  });

  await ff.writeFile('input_video', await fetchFile(videoBlob));
  await ff.writeFile(musicFileName, await fetchFile(musicPath));

  progressCallback?.({
    progress: 40,
    status: 'processing',
    message: '混音处理...',
  });

  const volume = options.volume ?? 0.3;
  const fadeIn = options.fadeIn ?? 2;
  const fadeOut = options.fadeOut ?? 2;

  // 音频滤镜：调节音量 → 淡入 → 淡出 → 与视频原声 amix
  const audioFilter = `[1:a]volume=${volume},afade=t=in:d=${fadeIn},afade=t=out:st=-${fadeOut}:d=${fadeOut}[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]`;

  await execFFmpegCommand(ff, [
    '-y',
    '-i',
    'input_video',
    '-i',
    musicFileName,
    '-filter_complex',
    audioFilter,
    '-map',
    '0:v',
    '-map',
    '[aout]',
    '-c:v',
    'copy',
    outputPath,
  ]);

  return finalizeOutput(
    ff,
    outputPath,
    outputFormat,
    ['input_video', musicFileName, outputPath],
    progressCallback
  );
}

/**
 * 把视频按指定参数重新编码导出。
 * 保留原 exportVideoWithFFmpeg 签名与行为。
 */
export async function exportVideoWithFFmpeg(
  inputBlob: Blob,
  outputFormat: 'mp4' | 'webm',
  options: {
    bitrate?: string;
    fps?: number;
    resolution?: { width: number; height: number };
  } = {},
  progressCallback?: ProgressCallback
): Promise<{ resultBlob: Blob; outputPath: string }> {
  setActiveProgressCallback(progressCallback ?? null);

  const ff = await getFFmpegInstance();
  const outputPath = `exported.${outputFormat}`;

  progressCallback?.({
    progress: 10,
    status: 'preparing',
    message: '准备导出视频...',
  });

  await ff.writeFile('input', await fetchFile(inputBlob));

  progressCallback?.({
    progress: 30,
    status: 'processing',
    message: '转码中...',
  });

  const args: string[] = ['-y', '-i', 'input'];
  const filters: string[] = [];
  if (options.resolution) {
    filters.push(`scale=${options.resolution.width}:${options.resolution.height}`);
  }
  if (options.fps) {
    filters.push(`fps=${options.fps}`);
  }
  if (filters.length > 0) {
    args.push('-vf', filters.join(','));
  }

  // 编码器：mp4 → libx264 / webm → libvpx-vp9（与原行为一致）
  if (outputFormat === 'mp4') {
    args.push('-c:v', 'libx264', '-preset', 'fast');
    if (options.bitrate) {
      args.push('-b:v', options.bitrate);
    }
  } else {
    args.push('-c:v', 'libvpx-vp9');
    if (options.bitrate) {
      args.push('-b:v', options.bitrate);
    }
  }

  args.push('-c:a', 'aac', outputPath);

  await execFFmpegCommand(ff, args);

  progressCallback?.({
    progress: 90,
    status: 'encoding',
    message: '生成输出文件...',
  });

  const { blob: resultBlob } = await readOutputAsBlob(ff, outputPath, `video/${outputFormat}`);

  await safeDeleteFiles(ff, ['input', outputPath]);

  setActiveProgressCallback(null);
  return { resultBlob, outputPath };
}

/**
 * 使用 concat demuxer 拼接多段视频（保留原 concatenateVideosWithFFmpeg 行为）。
 */
export async function concatenateVideosWithFFmpeg(
  videoBlobs: Blob[],
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<{ resultBlob: Blob; outputPath: string }> {
  setActiveProgressCallback(progressCallback ?? null);

  const ff = await getFFmpegInstance();
  const outputPath = `concatenated.${outputFormat}`;
  const inputNames: string[] = [];

  progressCallback?.({
    progress: 10,
    status: 'preparing',
    message: '准备合并视频...',
  });

  for (let i = 0; i < videoBlobs.length; i++) {
    progressCallback?.({
      progress: 10 + Math.round((i / videoBlobs.length) * 30),
      status: 'loading',
      message: `加载视频 ${i + 1}/${videoBlobs.length}...`,
    });
    const name = `input_${i}`;
    await ff.writeFile(name, await fetchFile(videoBlobs[i]));
    inputNames.push(name);
  }

  progressCallback?.({
    progress: 45,
    status: 'processing',
    message: '合并视频...',
  });

  const concatList = inputNames.map((name) => `file '${name}'`).join('\n');
  await ff.writeFile('concat.txt', new TextEncoder().encode(concatList));

  await execFFmpegCommand(ff, [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    'concat.txt',
    '-c',
    'copy',
    outputPath,
  ]);

  return finalizeOutput(
    ff,
    outputPath,
    outputFormat,
    [...inputNames, 'concat.txt', outputPath],
    progressCallback
  );
}
