/**
 * video-export.ts 单元测试
 * ========================
 * 测试 MP4/GIF 导出路径：场景转换 → 合成器调用 → 文件保存。
 * 核心手段：mock 动态导入的 video-compositor-service + file-saver。
 */

import type { StoryboardData, ProjectExportOptions } from '@/core/services/project/export-types';

// Mock 视频合成器（动态导入的依赖）
const mockCompose = jest.fn();
const mockInitializeVideoCompositor = jest.fn().mockResolvedValue(true);

jest.mock('@/core/services/video/video-compositor-service', () => ({
  videoCompositorService: {
    compose: (...args: unknown[]) => mockCompose(...args),
  },
  initializeVideoCompositor: (...args: unknown[]) => mockInitializeVideoCompositor(...args),
}));

// Mock file-saver（无全局 mock）
const mockSaveAs = jest.fn();
jest.mock('file-saver', () => ({
  saveAs: (...args: unknown[]) => mockSaveAs(...args),
}));

describe('video-export', () => {
  // 测试用 storyboard
  const storyboard: StoryboardData = {
    title: '测试故事板',
    scenes: [
      { id: 's1', imageUrl: '/img/1.jpg', duration: 3 },
      { id: 's2', imageUrl: '/img/2.jpg', duration: 5 },
      { id: 's3', imageUrl: '/img/3.jpg', duration: 2 },
    ],
    totalDuration: 10,
  };

  const exportOptions: ProjectExportOptions = {
    format: 'mp4' as any,
    quality: 'high' as any,
    includeVoice: false,
    includeSubtitles: false,
    includeBGM: false,
  };

  const outputBlob = new Blob(['fake-mp4-data'], { type: 'video/mp4' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCompose.mockResolvedValue({ outputBlob });
    mockInitializeVideoCompositor.mockResolvedValue(true);
  });

  describe('exportAsMP4', () => {
    it('应成功合成并保存 MP4', async () => {
      const { exportAsMP4 } = await import('@/core/services/project/video-export');
      const result = await exportAsMP4(storyboard, 'output.mp4', exportOptions);

      expect(mockInitializeVideoCompositor).toHaveBeenCalledTimes(1);
      expect(mockCompose).toHaveBeenCalledTimes(1);

      // 验证 compose 调用的参数结构
      const [scenesArg, optionsArg] = mockCompose.mock.calls[0];
      expect(scenesArg).toHaveLength(3);
      expect(optionsArg).toMatchObject({
        format: 'mp4',
        fps: 30,
        resolution: { width: 1920, height: 1080 },
      });

      // 验证 saveAs 被调用
      expect(mockSaveAs).toHaveBeenCalledWith(outputBlob, 'output.mp4');
      expect(result).toBe(outputBlob);
    });

    it('合成器返回 falsy outputBlob 时应抛出 "视频导出失败"', async () => {
      mockCompose.mockResolvedValue({ outputBlob: undefined });
      const { exportAsMP4 } = await import('@/core/services/project/video-export');

      await expect(exportAsMP4(storyboard, 'output.mp4', exportOptions)).rejects.toThrow(
        '视频导出失败'
      );
      expect(mockSaveAs).not.toHaveBeenCalled();
    });

    it('合成器返回 null outputBlob 时也应抛出错误', async () => {
      mockCompose.mockResolvedValue({ outputBlob: null });
      const { exportAsMP4 } = await import('@/core/services/project/video-export');

      await expect(exportAsMP4(storyboard, 'output.mp4', exportOptions)).rejects.toThrow(
        '视频导出失败'
      );
    });

    it('应正确传递进度回调', async () => {
      const onProgress = jest.fn();
      const { exportAsMP4 } = await import('@/core/services/project/video-export');

      await exportAsMP4(storyboard, 'output.mp4', exportOptions, onProgress);

      const progressCallback = mockCompose.mock.calls[0][2];
      expect(typeof progressCallback).toBe('function');

      // 触发进度回调并验证转换
      progressCallback({ progress: 0.5, status: 'composing', message: '正在合成...' });
      expect(onProgress).toHaveBeenCalledWith({
        current: Math.round(0.5 * 3),
        total: 3,
        stage: 'composing',
        message: '正在合成...',
      });
    });

    it('无进度回调时应传入 undefined', async () => {
      const { exportAsMP4 } = await import('@/core/services/project/video-export');

      await exportAsMP4(storyboard, 'output.mp4', exportOptions);

      const progressCallback = mockCompose.mock.calls[0][2];
      expect(progressCallback).toBeUndefined();
    });

    it('场景缺少 id 时应使用 scene_${index} 回退', async () => {
      const boardNoIds: StoryboardData = {
        title: 'no-ids',
        scenes: [
          { imageUrl: '/img/a.jpg', duration: 3 },
          { imageUrl: '/img/b.jpg', duration: 3 },
        ],
        totalDuration: 6,
      };

      const { exportAsMP4 } = await import('@/core/services/project/video-export');
      await exportAsMP4(boardNoIds, 'test.mp4', exportOptions);

      const scenesArg = mockCompose.mock.calls[0][0];
      expect(scenesArg[0].id).toBe('scene_0');
      expect(scenesArg[1].id).toBe('scene_1');
    });

    it('场景缺少 duration 时应使用默认值 3 秒', async () => {
      const boardNoDuration: StoryboardData = {
        title: 'no-durations',
        scenes: [{ id: 's1', imageUrl: '/img/a.jpg' }],
        totalDuration: 0,
      };

      const { exportAsMP4 } = await import('@/core/services/project/video-export');
      await exportAsMP4(boardNoDuration, 'test.mp4', exportOptions);

      const scenesArg = mockCompose.mock.calls[0][0];
      expect(scenesArg[0].duration).toBe(3); // MP4_DEFAULT_SCENE_DURATION
    });

    it('空场景数组应能执行（传递空数组给合成器）', async () => {
      const emptyBoard: StoryboardData = {
        title: 'empty',
        scenes: [],
        totalDuration: 0,
      };

      const { exportAsMP4 } = await import('@/core/services/project/video-export');
      const result = await exportAsMP4(emptyBoard, 'empty.mp4', exportOptions);

      const scenesArg = mockCompose.mock.calls[0][0];
      expect(scenesArg).toEqual([]);
      expect(result).toBe(outputBlob);
    });
  });

  describe('exportAsGIF', () => {
    it('应使用低分辨率和低帧率参数', async () => {
      const { exportAsGIF } = await import('@/core/services/project/video-export');
      const result = await exportAsGIF(storyboard, 'animation.gif', exportOptions);

      const optionsArg = mockCompose.mock.calls[0][1];
      expect(optionsArg).toMatchObject({
        format: 'mp4', // GIF 实质是低分辨率 MP4
        fps: 15,
        resolution: { width: 480, height: 270 },
      });

      expect(mockSaveAs).toHaveBeenCalledWith(outputBlob, 'animation.gif');
      expect(result).toBe(outputBlob);
    });

    it('文件名含 .mp4 后缀时应替换为 .gif', async () => {
      const { exportAsGIF } = await import('@/core/services/project/video-export');
      await exportAsGIF(storyboard, 'video.mp4', exportOptions);

      expect(mockSaveAs).toHaveBeenCalledWith(outputBlob, 'video.gif');
    });

    it('合成器返回 falsy outputBlob 时应抛出 "GIF 导出失败"', async () => {
      mockCompose.mockResolvedValue({ outputBlob: undefined });
      const { exportAsGIF } = await import('@/core/services/project/video-export');

      await expect(exportAsGIF(storyboard, 'test.gif', exportOptions)).rejects.toThrow(
        'GIF 导出失败'
      );
      expect(mockSaveAs).not.toHaveBeenCalled();
    });

    it('场景应使用 GIF 默认时长（1 秒）', async () => {
      const boardNoDuration: StoryboardData = {
        title: 'gif-no-duration',
        scenes: [{ id: 's1', imageUrl: '/img/a.jpg' }],
        totalDuration: 0,
      };

      const { exportAsGIF } = await import('@/core/services/project/video-export');
      await exportAsGIF(boardNoDuration, 'test.gif', exportOptions);

      const scenesArg = mockCompose.mock.calls[0][0];
      expect(scenesArg[0].duration).toBe(1); // GIF_DEFAULT_SCENE_DURATION
    });
  });

  describe('composeMp4Blob 共享逻辑', () => {
    it('合成器初始化失败时应传播错误', async () => {
      mockInitializeVideoCompositor.mockRejectedValue(new Error('FFmpeg 加载失败'));
      const { exportAsMP4 } = await import('@/core/services/project/video-export');

      await expect(exportAsMP4(storyboard, 'out.mp4', exportOptions)).rejects.toThrow(
        'FFmpeg 加载失败'
      );
      expect(mockCompose).not.toHaveBeenCalled();
    });

    it('合成器 compose 抛出错误时应传播', async () => {
      mockCompose.mockRejectedValue(new Error('合成过程出错'));
      const { exportAsMP4 } = await import('@/core/services/project/video-export');

      await expect(exportAsMP4(storyboard, 'out.mp4', exportOptions)).rejects.toThrow(
        '合成过程出错'
      );
      expect(mockSaveAs).not.toHaveBeenCalled();
    });
  });
});
