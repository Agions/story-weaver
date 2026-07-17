/**
 * 视频服务常量集中
 * ==================
 * 把分散在 video-service 中的 magic number / map / 默认样式 全部命名集中。
 * 单一职责：常量字典。无逻辑。
 */

/** 默认帧率 (DOM 拿不到 fps 时的兜底) */
export const DEFAULT_VIDEO_FPS = 30;

/** 默认视频格式后缀 (拿不到时用 mp4) */
export const DEFAULT_VIDEO_FORMAT = 'mp4';

/** 默认缩略图宽度 */
export const DEFAULT_THUMBNAIL_WIDTH = 320;

/** 默认缩略图 JPEG 质量 (0-1) */
export const THUMBNAIL_JPEG_QUALITY = 0.8;

/** 默认关键帧抽取数量 */
export const DEFAULT_KEYFRAME_COUNT = 10;

/** 默认场景切片长度 (秒) */
export const DEFAULT_SCENE_DURATION_SEC = 30;

/** 默认场景检测阈值 (保留签名兼容性) */
export const DEFAULT_SCENE_DETECTION_THRESHOLD = 0.3;

/** convertFormat 默认模拟延迟 (毫秒) */
export const CONVERT_FORMAT_DELAY_MS = 2000;

/** H.264 / AAC 默认编码器组合 */
export const DEFAULT_VIDEO_CODEC_FLAGS = ['-c:v', 'libx264', '-c:a', 'aac'];

/** 视频复制 (clip 时) 编码选项 */
export const CLIP_CODEC_FLAGS = ['-c', 'copy'];

/** 字幕流复制 (addSubtitles) 编码选项 */
export const SUBTITLE_CODEC_FLAGS = ['-c:v', 'libx264', '-c:a', 'copy'];

/**
 * 质量 → CRF (Constant Rate Factor) 映射
 * CRF 越低画质越高，体积越大
 */
export const QUALITY_CRF_MAP: Record<string, string[]> = {
  low: ['-crf', '28'],
  medium: ['-crf', '23'],
  high: ['-crf', '18'],
  ultra: ['-crf', '15'],
};

/** 默认质量档位 */
export const DEFAULT_QUALITY = 'high';

/** 分辨率 → 标量映射 (W:H) */
export const RESOLUTION_MAP: Record<string, string> = {
  '720p': '1280:720',
  '1080p': '1920:1080',
  '2k': '2560:1440',
  '4k': '3840:2160',
};

/** 默认分辨率档位 */
export const DEFAULT_RESOLUTION = '1080p';

/**
 * 目标格式 → 编码器组合映射
 * 不同容器需要不同的视频/音频编码
 */
export const FORMAT_CODEC_MAP: Record<string, string[]> = {
  mp4: ['-c:v', 'libx264', '-c:a', 'aac'],
  webm: ['-c:v', 'libvpx-vp9', '-c:a', 'libopus'],
  mov: ['-c:v', 'libx264', '-c:a', 'aac', '-f', 'mov'],
  avi: ['-c:v', 'libx264', '-c:a', 'mp3', '-f', 'avi'],
};

/** 字幕样式默认值 */
export const DEFAULT_SUBTITLE_STYLE = {
  fontSize: 24,
  fontColor: '#FFFFFF',
  backgroundColor: '#000000',
  position: 'bottom' as const,
};

/** 字幕文件占位名 (FFmpeg 滤镜引用) */
export const SUBTITLE_FILTER_FILENAME = 'subtitle.srt';
