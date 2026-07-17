/**
 * 图像生成服务测试 - Image Generation Service Tests
 */

import axios from 'axios';
import type { AxiosResponse } from 'axios';

import {
  generateImage,
  generateVideo,
  getVideoStatus,
  generateWithSeedream,
  generateWithKling,
  generateWithVidu,
  generateVideoWithKling,
  generateVideoWithVidu,
  generateVideoWithSeedance,
  imageGenerationService,
  type ImageGenerationOptions,
  type ImageGenerationResult,
  type VideoGenerationOptions,
  type VideoGenerationResult,
} from '@/core/services/ai/image/image-generation-service';

// Mock axios
jest.mock('axios');

const mockedAxios = axios as any;

// Mock secure storage service
jest.mock('@/core/services/project/secure-storage-service', () => ({
  secureStorage: {
    getSecureConfig: jest.fn().mockImplementation((key: string) => {
      if (key === 'api_keys') {
        return Promise.resolve(
          JSON.stringify({
            seedream: 'test-seedream-key',
            seedream_api_key: 'test-seedream-key',
            kling: 'test-kling-key',
            kling_api_key: 'test-kling-key',
            vidu: 'test-vidu-key',
            vidu_api_key: 'test-vidu-key',
            seedance: 'test-seedance-key',
            seedance_api_key: 'test-seedance-key',
          })
        );
      }
      return Promise.resolve(null);
    }),
  },
}));

// Test data helpers
const createMockImageResponse = (overrides: Partial<any> = {}): AxiosResponse => ({
  data: {
    data: [
      {
        url: 'https://example.com/image.jpg',
        width: 2048,
        height: 2048,
        ...overrides,
      },
    ],
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

const createMockKlingImageResponse = (overrides: Partial<any> = {}): AxiosResponse => ({
  data: {
    images: [
      {
        url: 'https://example.com/kling-image.jpg',
        width: 2048,
        height: 2048,
        ...overrides,
      },
    ],
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

const createMockVideoResponse = (overrides: Partial<any> = {}): AxiosResponse => ({
  data: {
    data: [
      {
        url: 'https://example.com/video.mp4',
        cover_image_url: 'https://example.com/cover.jpg',
        width: 1920,
        height: 1080,
        duration: 5,
        task_id: 'task-123',
        status: 'processing',
        ...overrides,
      },
    ],
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

const createMockKlingVideoResponse = (overrides: Partial<any> = {}): AxiosResponse => ({
  data: {
    url: 'https://example.com/kling-video.mp4',
    cover_url: 'https://example.com/kling-cover.jpg',
    width: 1920,
    height: 1080,
    duration: 5,
    task_id: 'kling-task-123',
    status: 'processing',
    ...overrides,
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

describe('Image Generation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateWithSeedream', () => {
    it('应该使用默认参数生成图像', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const result = await generateWithSeedream('测试提示词');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-seedream-key',
            'Content-Type': 'application/json',
          }),
          data: expect.objectContaining({
            model: 'doubao-seedream-4-0-250828',
            prompt: '测试提示词',
            size: '2K',
            n: 1,
            response_format: 'url',
            quality: 'standard',
          }),
        })
      );

      expect(result).toEqual({
        url: 'https://example.com/image.jpg',
        width: 2048,
        height: 2048,
        model: 'seedream-5.0',
        processingTime: expect.any(Number),
      });
    });

    it('应该使用自定义参数生成图像', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const options: ImageGenerationOptions = {
        size: '4K',
        numImages: 2,
        negativePrompt: '低质量',
        quality: 'high',
      };

      await generateWithSeedream('测试提示词', options);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            size: '4K',
            n: 2,
            negative_prompt: '低质量',
            quality: 'high',
          }),
        })
      );
    });

    it('应该支持 AbortSignal', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const controller = new AbortController();
      const options: ImageGenerationOptions = {
        signal: controller.signal,
      };

      await generateWithSeedream('测试提示词', options);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });

    it('应该正确解析不同尺寸', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const result1K = await generateWithSeedream('测试', { size: '1K' });
      expect(result1K.width).toBe(1024);
      expect(result1K.height).toBe(1024);

      const result2K = await generateWithSeedream('测试', { size: '2K' });
      expect(result2K.width).toBe(2048);
      expect(result2K.height).toBe(2048);

      const result4K = await generateWithSeedream('测试', { size: '4K' });
      expect(result4K.width).toBe(4096);
      expect(result4K.height).toBe(4096);

      const resultCustom = await generateWithSeedream('测试', { size: '1920x1080' });
      expect(resultCustom.width).toBe(1920);
      expect(resultCustom.height).toBe(1080);
    });

    it('应该计算处理时间', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const result = await generateWithSeedream('测试提示词');

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateWithKling', () => {
    it('应该使用默认参数生成图像', async () => {
      mockedAxios.mockResolvedValue(createMockKlingImageResponse());

      const result = await generateWithKling('测试提示词');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://api.klingai.com/v1/images/generations',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-kling-key',
            'Content-Type': 'application/json',
          }),
          data: expect.objectContaining({
            model: 'kling-v1-6',
            prompt: '测试提示词',
            size: '2048x2048',
            image_count: 1,
          }),
        })
      );

      expect(result).toEqual({
        url: 'https://example.com/kling-image.jpg',
        width: 2048,
        height: 2048,
        model: 'kling-1.6',
        processingTime: expect.any(Number),
      });
    });

    it('应该正确映射可灵尺寸', async () => {
      mockedAxios.mockResolvedValue(createMockKlingImageResponse());

      await generateWithKling('测试', { size: '1K' });
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            size: '1024x1024',
          }),
        })
      );

      await generateWithKling('测试', { size: '2K' });
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            size: '2048x2048',
          }),
        })
      );

      await generateWithKling('测试', { size: '4K' });
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            size: '4096x4096',
          }),
        })
      );
    });
  });

  describe('generateWithVidu', () => {
    it('应该使用默认参数生成图像', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const result = await generateWithVidu('测试提示词');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://api.vidu.cn/v1/images/generations',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-vidu-key',
            'Content-Type': 'application/json',
          }),
          data: expect.objectContaining({
            model: 'vidu-2-0',
            prompt: '测试提示词',
            size: '1920x1920',
            num_images: 1,
          }),
        })
      );

      expect(result).toEqual({
        url: 'https://example.com/image.jpg',
        width: 2048,
        height: 2048,
        model: 'vidu-2.0',
        processingTime: expect.any(Number),
      });
    });

    it('应该正确映射 Vidu 尺寸', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      await generateWithVidu('测试', { size: '1K' });
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            size: '1024x1024',
          }),
        })
      );

      await generateWithVidu('测试', { size: '2K' });
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            size: '1920x1920',
          }),
        })
      );

      await generateWithVidu('测试', { size: '4K' });
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            size: '3840x2160',
          }),
        })
      );
    });
  });

  describe('generateImage - 统一入口', () => {
    it('默认应该使用 Seedream', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const result = await generateImage('测试提示词');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
        })
      );
      expect(result.model).toBe('seedream-5.0');
    });

    it('应该根据 model 选择 Seedream', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const result = await generateImage('测试', { model: 'seedream-5.0' });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
        })
      );
      expect(result.model).toBe('seedream-5.0');
    });

    it('应该根据 model 选择 Kling', async () => {
      mockedAxios.mockResolvedValue(createMockKlingImageResponse());

      const result = await generateImage('测试', { model: 'kling-1.6' });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.klingai.com/v1/images/generations',
        })
      );
      expect(result.model).toBe('kling-1.6');
    });

    it('应该根据 model 选择 Vidu', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const result = await generateImage('测试', { model: 'vidu-2.0' });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.vidu.cn/v1/images/generations',
        })
      );
      expect(result.model).toBe('vidu-2.0');
    });

    it('未知 model 应该回退到 Seedream', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      // Testing with invalid model type to ensure fallback
      const result = await generateImage('测试', { model: 'unknown-model' as any });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
        })
      );
      expect(result.model).toBe('seedream-5.0');
    });
  });

  describe('generateVideoWithKling', () => {
    it('应该使用默认参数生成视频', async () => {
      mockedAxios.mockResolvedValue(createMockKlingVideoResponse());

      const result = await generateVideoWithKling('测试提示词');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://api.klingai.com/v1/videos/generations',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-kling-key',
            'Content-Type': 'application/json',
          }),
          data: expect.objectContaining({
            model: 'kling-v1-6',
            prompt: '测试提示词',
            duration: 5,
            aspect_ratio: '16:9',
          }),
        })
      );

      expect(result).toEqual({
        url: 'https://example.com/kling-video.mp4',
        coverUrl: 'https://example.com/kling-cover.jpg',
        duration: 5,
        width: 1920,
        height: 1080,
        model: 'kling-1.6',
        taskId: 'kling-task-123',
        status: 'processing',
      });
    });

    it('应该支持参考图片和自定义参数', async () => {
      mockedAxios.mockResolvedValue(createMockKlingVideoResponse());

      const options: VideoGenerationOptions = {
        duration: 10,
        referenceImage: 'https://example.com/ref.jpg',
        negativePrompt: '低质量',
        aspectRatio: '9:16',
      };

      await generateVideoWithKling('测试提示词', options);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            duration: 10,
            image_url: 'https://example.com/ref.jpg',
            negative_prompt: '低质量',
            aspect_ratio: '9:16',
          }),
        })
      );
    });
  });

  describe('generateVideoWithVidu', () => {
    it('应该使用默认参数生成视频', async () => {
      const mockViduVideoResponse: AxiosResponse = {
        data: {
          url: 'https://example.com/vidu-video.mp4',
          cover_image_url: 'https://example.com/vidu-cover.jpg',
          width: 1920,
          height: 1080,
          duration: 5,
          task_id: 'vidu-task-123',
          status: 'processing',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockedAxios.mockResolvedValue(mockViduVideoResponse);

      const result = await generateVideoWithVidu('测试提示词');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://api.vidu.cn/v1/videos/generations',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-vidu-key',
            'Content-Type': 'application/json',
          }),
          data: expect.objectContaining({
            model: 'vidu-2-0',
            prompt: '测试提示词',
            duration: 5,
            aspect_ratio: '16:9',
          }),
        })
      );

      expect(result).toEqual({
        url: 'https://example.com/vidu-video.mp4',
        coverUrl: 'https://example.com/vidu-cover.jpg',
        duration: 5,
        width: 1920,
        height: 1080,
        model: 'vidu-2.0',
        taskId: 'vidu-task-123',
        status: 'processing',
      });
    });
  });

  describe('generateVideoWithSeedance', () => {
    it('应该使用默认参数生成视频', async () => {
      mockedAxios.mockResolvedValue(createMockVideoResponse());

      const result = await generateVideoWithSeedance('测试提示词');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://ark.cn-beijing.volces.com/api/v3/video/generations',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-seedance-key',
            'Content-Type': 'application/json',
          }),
          data: expect.objectContaining({
            model: 'seedance-2-0-250212',
            prompt: '测试提示词',
            duration: 5,
            aspect_ratio: '16:9',
          }),
        })
      );

      expect(result).toEqual({
        url: 'https://example.com/video.mp4',
        coverUrl: 'https://example.com/cover.jpg',
        duration: 5,
        width: 1920,
        height: 1080,
        model: 'seedance-2.0',
        taskId: 'task-123',
        status: 'processing',
      });
    });
  });

  describe('generateVideo - 统一入口', () => {
    it('默认应该使用 Seedance', async () => {
      mockedAxios.mockResolvedValue(createMockVideoResponse());

      const result = await generateVideo('测试提示词');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://ark.cn-beijing.volces.com/api/v3/video/generations',
        })
      );
      expect(result.model).toBe('seedance-2.0');
    });

    it('应该根据 model 选择 Seedance', async () => {
      mockedAxios.mockResolvedValue(createMockVideoResponse());

      const result = await generateVideo('测试', { model: 'seedance-2.0' });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://ark.cn-beijing.volces.com/api/v3/video/generations',
        })
      );
      expect(result.model).toBe('seedance-2.0');
    });

    it('应该根据 model 选择 Kling', async () => {
      mockedAxios.mockResolvedValue(createMockKlingVideoResponse());

      const result = await generateVideo('测试', { model: 'kling-1.6' });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.klingai.com/v1/videos/generations',
        })
      );
      expect(result.model).toBe('kling-1.6');
    });

    it('应该根据 model 选择 Vidu', async () => {
      mockedAxios.mockResolvedValue(createMockVideoResponse());

      const result = await generateVideo('测试', { model: 'vidu-2.0' });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.vidu.cn/v1/videos/generations',
        })
      );
      expect(result.model).toBe('vidu-2.0');
    });
  });

  describe('getVideoStatus', () => {
    it('应该查询 Seedance 视频状态', async () => {
      const mockStatusResponse: AxiosResponse = {
        data: {
          data: {
            url: 'https://example.com/completed-video.mp4',
            cover_image_url: 'https://example.com/cover.jpg',
            duration: 5,
            width: 1920,
            height: 1080,
            status: 'completed',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockedAxios.mockResolvedValue(mockStatusResponse);

      const result = await getVideoStatus('task-123', 'seedance-2.0');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: 'https://ark.cn-beijing.volces.com/api/v3/video/tasks/task-123',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-seedance-key',
          }),
        })
      );

      expect(result).toEqual({
        url: 'https://example.com/completed-video.mp4',
        coverUrl: 'https://example.com/cover.jpg',
        duration: 5,
        width: 1920,
        height: 1080,
        model: 'seedance-2.0',
        taskId: 'task-123',
        status: 'completed',
      });
    });

    it('应该查询 Kling 视频状态', async () => {
      const mockStatusResponse: AxiosResponse = {
        data: {
          url: 'https://example.com/kling-completed.mp4',
          cover_url: 'https://example.com/kling-cover.jpg',
          duration: 10,
          width: 1920,
          height: 1080,
          status: 'completed',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockedAxios.mockResolvedValue(mockStatusResponse);

      const result = await getVideoStatus('kling-task-456', 'kling-1.6');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: 'https://api.klingai.com/v1/videos/tasks/kling-task-456',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-kling-key',
          }),
        })
      );

      expect(result.status).toBe('completed');
    });

    it('应该查询 Vidu 视频状态', async () => {
      const mockStatusResponse: AxiosResponse = {
        data: {
          data: {
            url: 'https://example.com/vidu-completed.mp4',
            cover_image_url: 'https://example.com/vidu-cover.jpg',
            duration: 8,
            width: 1920,
            height: 1080,
            status: 'failed',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockedAxios.mockResolvedValue(mockStatusResponse);

      const result = await getVideoStatus('vidu-task-789', 'vidu-2.0');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: 'https://api.vidu.cn/v1/videos/tasks/vidu-task-789',
        })
      );

      expect(result.status).toBe('failed');
    });

    it('默认应该使用 Seedance', async () => {
      const mockStatusResponse: AxiosResponse = {
        data: { data: {} },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockedAxios.mockResolvedValue(mockStatusResponse);

      await getVideoStatus('task-default');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://ark.cn-beijing.volces.com/api/v3/video/tasks/task-default',
        })
      );
    });
  });

  describe('imageGenerationService - 服务导出', () => {
    it('应该导出所有方法', () => {
      expect(imageGenerationService.generateImage).toBe(generateImage);
      expect(imageGenerationService.generateVideo).toBe(generateVideo);
      expect(imageGenerationService.getVideoStatus).toBe(getVideoStatus);
      expect(imageGenerationService.seedream).toBe(generateWithSeedream);
      expect(imageGenerationService.kling.image).toBe(generateWithKling);
      expect(imageGenerationService.kling.video).toBe(generateVideoWithKling);
      expect(imageGenerationService.vidu.image).toBe(generateWithVidu);
      expect(imageGenerationService.vidu.video).toBe(generateVideoWithVidu);
      expect(imageGenerationService.seedance).toBe(generateVideoWithSeedance);
    });

    it('应该通过服务对象调用方法', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      await imageGenerationService.generateImage('测试');

      expect(mockedAxios).toHaveBeenCalled();
    });

    it('应该通过服务对象调用 Seedream', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      await imageGenerationService.seedream('测试');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
        })
      );
    });

    it('应该通过服务对象调用 Kling 图像', async () => {
      mockedAxios.mockResolvedValue(createMockKlingImageResponse());

      await imageGenerationService.kling.image('测试');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.klingai.com/v1/images/generations',
        })
      );
    });

    it('应该通过服务对象调用 Kling 视频', async () => {
      mockedAxios.mockResolvedValue(createMockKlingVideoResponse());

      await imageGenerationService.kling.video('测试');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.klingai.com/v1/videos/generations',
        })
      );
    });
  });

  describe('错误处理', () => {
    it('应该传播 Seedream 错误', async () => {
      const error = new Error('API Error');
      mockedAxios.mockRejectedValue(error);

      await expect(generateWithSeedream('测试')).rejects.toThrow('API Error');
    });

    it('应该传播 Kling 错误', async () => {
      const error = new Error('Kling API Error');
      mockedAxios.mockRejectedValue(error);

      await expect(generateWithKling('测试')).rejects.toThrow('Kling API Error');
    });

    it('应该传播 Vidu 错误', async () => {
      const error = new Error('Vidu API Error');
      mockedAxios.mockRejectedValue(error);

      await expect(generateWithVidu('测试')).rejects.toThrow('Vidu API Error');
    });

    it('应该传播视频生成错误', async () => {
      const error = new Error('Video Generation Error');
      mockedAxios.mockRejectedValue(error);

      await expect(generateVideoWithKling('测试')).rejects.toThrow('Video Generation Error');
    });

    it('应该传播状态查询错误', async () => {
      const error = new Error('Status Query Error');
      mockedAxios.mockRejectedValue(error);

      await expect(getVideoStatus('task-123')).rejects.toThrow('Status Query Error');
    });
  });

  describe('API Key 处理', () => {
    it('应该从存储服务获取 API Key', async () => {
      const { secureStorage } = await import('@/core/services/project/secure-storage-service');
      mockedAxios.mockResolvedValue(createMockImageResponse());

      await generateWithSeedream('测试');

      expect(secureStorage.getSecureConfig).toHaveBeenCalledWith('api_keys');
    });
  });

  describe('边界情况', () => {
    it('应该处理缺少 URL 的响应', async () => {
      mockedAxios.mockResolvedValue({
        data: { data: [{}] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await generateWithSeedream('测试');

      expect(result.url).toBe('');
    });

    it('应该处理缺少宽高的响应', async () => {
      mockedAxios.mockResolvedValue({
        data: {
          images: [{ url: 'https://example.com/image.jpg' }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await generateWithKling('测试');

      expect(result.width).toBe(1024);
      expect(result.height).toBe(1024);
    });

    it('应该处理自定义尺寸字符串', async () => {
      mockedAxios.mockResolvedValue(createMockImageResponse());

      const result = await generateWithSeedream('测试', { size: '1920x1080' });

      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });
  });
});
