/**
 * Video Export Feature Slice
 *
 * AI 视频生成 + 后期剪辑 + 发布垂直切片。
 * 对应 pipeline 步骤: step-video-editing + step-composition
 *
 * @module features/video-export
 */

// ========== 类型定义 ==========

/** 导出预设 */
export interface ExportPreset {
  id: string;
  name: string;
  resolution: '1080p' | '720p' | '4k';
  format: 'mp4' | 'webm';
  fps: number;
  bitrate: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
}

/** 视频导出配置 */
export interface VideoExportConfig {
  presetId: string;
  includeWatermark?: boolean;
  outputPath?: string;
}

// ========== 预设 ==========

export const DEFAULT_EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    resolution: '1080p',
    format: 'mp4',
    fps: 30,
    bitrate: '8M',
    aspectRatio: '16:9',
  },
  {
    id: 'shorts',
    name: 'Short',
    resolution: '1080p',
    format: 'mp4',
    fps: 30,
    bitrate: '5M',
    aspectRatio: '9:16',
  },
  {
    id: 'square',
    name: 'Square',
    resolution: '1080p',
    format: 'mp4',
    fps: 30,
    bitrate: '4M',
    aspectRatio: '1:1',
  },
];

// ========== 服务胶水 ==========

/**
 * 获取导出预设
 */
export function getExportPreset(presetId: string): ExportPreset | undefined {
  return DEFAULT_EXPORT_PRESETS.find((p) => p.id === presetId);
}

/**
 * 列出所有导出预设
 */
export function listExportPresets(): ExportPreset[] {
  return [...DEFAULT_EXPORT_PRESETS];
}

// ========== 导出 ==========

export const videoExportService = {
  getExportPreset,
  listExportPresets,
  /**
   * 模拟发布到平台
   * @param platform 平台标识：youtube | bilibili | douyin | kuaishou
   * @param videoUrl 视频 URL
   * @param title 视频标题
   * @param description 视频描述
   * @returns 发布结果
   */
  publishToPlatform: async (params: {
    platform: 'youtube' | 'bilibili' | 'douyin' | 'kuaishou';
    videoUrl: string;
    title: string;
    description?: string;
  }): Promise<{ success: boolean; platform: string; url?: string; error?: string }> => {
    // 模拟网络请求延迟
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

    // 模拟 90% 成功率
    if (Math.random() < 0.1) {
      return {
        success: false,
        platform: params.platform,
        error: '平台接口暂时不可用，请稍后重试',
      };
    }

    return {
      success: true,
      platform: params.platform,
      url: `https://${params.platform}.com/watch?v=${Date.now()}`,
    };
  },
  /**
   * 批量发布到多个平台
   */
  publishToMultiplePlatforms: async (params: {
    platforms: Array<'youtube' | 'bilibili' | 'douyin' | 'kuaishou'>;
    videoUrl: string;
    title: string;
    description?: string;
  }): Promise<
    Array<{ platform: string; success: boolean; url?: string; error?: string }>
  > => {
    return Promise.all(
      params.platforms.map((platform) =>
        videoExportService.publishToPlatform({
          platform,
          videoUrl: params.videoUrl,
          title: params.title,
          description: params.description,
        })
      )
    );
  },
};

export default videoExportService;
