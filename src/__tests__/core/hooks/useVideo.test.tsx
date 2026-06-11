/**
 * useVideo Hook 测试
 */

import { renderHook, act } from '@testing-library/react';

import { createMockFile } from '@/__tests__/utils/test-utils';
import { useVideo } from '@/core/hooks/useVideo';

// Mock UUID
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
}));

describe('useVideo Hook', () => {
  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const { result } = renderHook(() => useVideo());

      expect(result.current.video).toBeNull();
      expect(result.current.analysis).toBeNull();
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadProgress).toBe(0);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.analysisProgress).toBe(0);
      expect(result.current.taskStatus).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('uploadVideo - 文件格式验证', () => {
    it('应该拒绝不支持的视频格式', async () => {
      const { result } = renderHook(() => useVideo());
      const file = createMockFile('test.xyz', 'video/mp4', 1024 * 1024);

      await act(async () => {
        await result.current.uploadVideo(file);
      });

      expect(result.current.error).toContain('不支持的格式');
      expect(result.current.video).toBeNull();
    });

    it('应该拒绝过大的文件 (超过2GB)', async () => {
      const { result } = renderHook(() => useVideo());
      // 3GB file (超过 2GB 限制)
      const file = createMockFile('large-video.mp4', 'video/mp4', 3 * 1024 * 1024 * 1024);

      await act(async () => {
        await result.current.uploadVideo(file);
      });

      expect(result.current.error).toContain('文件过大');
      expect(result.current.video).toBeNull();
    });

    it('应该拒绝无效的文件扩展名', async () => {
      const { result } = renderHook(() => useVideo());
      const file = createMockFile('video', 'video/mp4', 1024); // 没有扩展名

      await act(async () => {
        await result.current.uploadVideo(file);
      });

      expect(result.current.error).toContain('不支持的格式');
    });

    it('应该拒绝普通图片格式', async () => {
      const { result } = renderHook(() => useVideo());
      const file = createMockFile('photo.jpg', 'image/jpeg', 1024);

      await act(async () => {
        await result.current.uploadVideo(file);
      });

      expect(result.current.error).toContain('不支持的格式');
    });
  });

  describe('uploadVideo - 错误状态管理', () => {
    it('应该在上传失败后设置错误信息', async () => {
      const { result } = renderHook(() => useVideo());
      const wrongFile = createMockFile('test.xyz', 'video/mp4', 1024);

      await act(async () => {
        await result.current.uploadVideo(wrongFile);
      });

      expect(result.current.error).not.toBeNull();
    });

    it('错误信息应该包含支持的格式列表', async () => {
      const { result } = renderHook(() => useVideo());
      const wrongFile = createMockFile('test.unknownext', 'video/mp4', 1024);

      await act(async () => {
        await result.current.uploadVideo(wrongFile);
      });

      expect(result.current.error).toContain('mp4');
      expect(result.current.error).toContain('mov');
    });
  });

  describe('analyzeVideo', () => {
    it('应该在没有视频时返回null', async () => {
      const { result } = renderHook(() => useVideo());

      let analysisResult: unknown = null;
      await act(async () => {
        analysisResult = await result.current.analyzeVideo('any-video-id');
      });

      expect(analysisResult).toBeNull();
    });

    it('应该在没有视频时保持error为null', async () => {
      const { result } = renderHook(() => useVideo());

      await act(async () => {
        await result.current.analyzeVideo('any-video-id');
      });

      // 早期返回不会设置错误
      expect(result.current.error).toBeNull();
    });

    it('应该在没有视频时保持isAnalyzing为false', async () => {
      const { result } = renderHook(() => useVideo());

      await act(async () => {
        await result.current.analyzeVideo('any-video-id');
      });

      expect(result.current.isAnalyzing).toBe(false);
    });
  });

  describe('cancelAnalysis', () => {
    it('应该可以调用cancelAnalysis而不崩溃', () => {
      const { result } = renderHook(() => useVideo());

      act(() => {
        result.current.cancelAnalysis();
      });

      expect(result.current.isAnalyzing).toBe(false);
    });

    it('初始状态下taskStatus应该为null', () => {
      const { result } = renderHook(() => useVideo());

      expect(result.current.taskStatus).toBeNull();
    });
  });

  describe('extractThumbnail', () => {
    it('应该在没有视频时返回null', async () => {
      const { result } = renderHook(() => useVideo());

      let thumbnailResult: string | null = null;
      await act(async () => {
        thumbnailResult = await result.current.extractThumbnail(5);
      });

      expect(thumbnailResult).toBeNull();
    });
  });

  describe('extractKeyframes', () => {
    it('应该在没有视频时返回空数组', async () => {
      const { result } = renderHook(() => useVideo());

      let keyframesResult: string[] = [];
      await act(async () => {
        keyframesResult = await result.current.extractKeyframes(5);
      });

      expect(keyframesResult).toEqual([]);
    });

    it('应该接受默认参数', async () => {
      const { result } = renderHook(() => useVideo());

      let keyframesResult: string[] = [];
      await act(async () => {
        keyframesResult = await result.current.extractKeyframes();
      });

      expect(keyframesResult).toEqual([]);
    });

    it('应该接受自定义间隔值', async () => {
      const { result } = renderHook(() => useVideo());

      let keyframesResult: string[] = [];
      await act(async () => {
        keyframesResult = await result.current.extractKeyframes(10);
      });

      expect(keyframesResult).toEqual([]);
    });
  });

  describe('返回值的完整性', () => {
    it('应该返回所有必需的方法和属性', () => {
      const { result } = renderHook(() => useVideo());

      // Check all required properties exist and are functions or correct types
      expect(typeof result.current.uploadVideo).toBe('function');
      expect(typeof result.current.analyzeVideo).toBe('function');
      expect(typeof result.current.cancelAnalysis).toBe('function');
      expect(typeof result.current.extractThumbnail).toBe('function');
      expect(typeof result.current.extractKeyframes).toBe('function');

      expect(result.current.video).toBeNull();
      expect(result.current.analysis).toBeNull();
      expect(typeof result.current.isUploading).toBe('boolean');
      expect(typeof result.current.uploadProgress).toBe('number');
      expect(typeof result.current.isAnalyzing).toBe('boolean');
      expect(typeof result.current.analysisProgress).toBe('number');
      expect(result.current.error).toBeNull(); // error starts as null
      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('应该包含taskStatus属性', () => {
      const { result } = renderHook(() => useVideo());

      expect(result.current).toHaveProperty('taskStatus');
      expect(result.current).toHaveProperty('video');
      expect(result.current).toHaveProperty('analysis');
    });
  });

  describe('状态转换', () => {
    it('isUploading初始应该为false', () => {
      const { result } = renderHook(() => useVideo());
      expect(result.current.isUploading).toBe(false);
    });

    it('isAnalyzing初始应该为false', () => {
      const { result } = renderHook(() => useVideo());
      expect(result.current.isAnalyzing).toBe(false);
    });

    it('uploadProgress初始应该为0', () => {
      const { result } = renderHook(() => useVideo());
      expect(result.current.uploadProgress).toBe(0);
    });

    it('analysisProgress初始应该为0', () => {
      const { result } = renderHook(() => useVideo());
      expect(result.current.analysisProgress).toBe(0);
    });
  });

  describe('错误消息内容', () => {
    it('格式错误消息应该提到支持的格式', async () => {
      const { result } = renderHook(() => useVideo());
      const file = createMockFile('test.txt', 'text/plain', 1024);

      await act(async () => {
        await result.current.uploadVideo(file);
      });

      // 错误消息应该包含常见格式
      expect(result.current.error).toContain('mp4');
    });

    it('文件过大错误消息应该包含MB或GB', async () => {
      const { result } = renderHook(() => useVideo());
      const file = createMockFile('verylarge.mp4', 'video/mp4', 5 * 1024 * 1024 * 1024);

      await act(async () => {
        await result.current.uploadVideo(file);
      });

      // 错误消息应该包含大小单位和最大限制信息
      expect(result.current.error).toContain('2GB');
    });
  });

  describe('多文件上传', () => {
    it('每次上传应该独立处理', async () => {
      const { result: result1 } = renderHook(() => useVideo());
      const { result: result2 } = renderHook(() => useVideo());

      const file1 = createMockFile('test1.xyz', 'video/mp4', 1024);
      const file2 = createMockFile('test2.xyz', 'video/mp4', 1024);

      await act(async () => {
        await result1.current.uploadVideo(file1);
      });

      await act(async () => {
        await result2.current.uploadVideo(file2);
      });

      // 两个hook实例应该独立处理
      expect(result1.current.error).toContain('不支持的格式');
      expect(result2.current.error).toContain('不支持的格式');
    });
  });
});
