/**
 * manga-pipeline-service.ts 测试
 */

import { MangaPipelineService, type PipelineScene, type PipelineProgress } from '@/core/services/domain/manga-pipeline-service';

// Mock 依赖的服务（路径必须匹配 src/core/services/domain/manga-pipeline-service.ts 真实 import）
jest.mock('@/core/services/ai/image/image-generation-service', () => ({
  generateImage: jest.fn(),
  generateVideo: jest.fn(),
}));

jest.mock('@/core/services/audio/lip-sync-service', () => ({
  syncLip: jest.fn(),
  generateTalkingHead: jest.fn(),
}));

jest.mock('@/core/services/audio/tts-service', () => ({
  ttsService: {
    synthesize: jest.fn(),
  },
}));

jest.mock('@/core/services/video/video-compositor-service', () => ({
  composeVideo: jest.fn(),
  addSubtitles: jest.fn(),
}));

import { generateImage, generateVideo } from '@/core/services/ai/image/image-generation-service';
import { syncLip, generateTalkingHead } from '@/core/services/audio/lip-sync-service';
import { ttsService } from '@/core/services/audio/tts-service';
import { composeVideo, addSubtitles } from '@/core/services/video/video-compositor-service';

describe('MangaPipelineService', () => {
  let service: MangaPipelineService;
  let progressUpdates: PipelineProgress[];

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MangaPipelineService();
    progressUpdates = [];

    // 设置进度回调
    service.onProgress((progress) => {
      progressUpdates.push(progress);
    });

    // 设置默认 mock 返回值
    (generateImage as jest.Mock).mockResolvedValue({
      url: 'https://example.com/image.jpg',
      width: 1920,
      height: 1080,
      model: 'seedream-5.0',
      processingTime: 1000,
    });

    (ttsService.synthesize as jest.Mock).mockResolvedValue({
      audio: new ArrayBuffer(128),
      duration: 2.3,
      size: 128,
      format: 'mp3',
    });

    (syncLip as jest.Mock).mockResolvedValue({
      url: 'https://example.com/video.mp4',
      width: 1920,
      height: 1080,
      duration: 5,
      status: 'completed',
    });

    (composeVideo as jest.Mock).mockResolvedValue({
      outputPath: 'https://example.com/final.mp4',
      duration: 15,
      size: 1024000,
    });

    (addSubtitles as jest.Mock).mockResolvedValue({
      outputPath: 'https://example.com/final_with_subs.mp4',
    });

    (generateVideo as jest.Mock).mockResolvedValue({
      url: 'https://example.com/generated-video.mp4',
      width: 1920,
      height: 1080,
      duration: 5,
      model: 'seedance-2.0',
    });

    (generateTalkingHead as jest.Mock).mockResolvedValue({
      url: 'https://example.com/talking-head.mp4',
      width: 1920,
      height: 1080,
      duration: 5,
    });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const instance = new MangaPipelineService();
      expect(instance).toBeDefined();
    });

    it('should create instance with custom config', () => {
      const config = {
        image: { model: 'seedream-5.0' as const },
        tts: { provider: 'edge' as const },
      };
      const instance = new MangaPipelineService(config);
      expect(instance).toBeDefined();
    });
  });

  describe('onProgress', () => {
    it('should register progress callback', () => {
      const callback = jest.fn();
      service.onProgress(callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should abort pipeline execution during image generation', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '一个美丽的日落',
          dialogue: '你好世界',
        },
      ];

      // 让 generateImage 在检测到中止时抛出错误
      (generateImage as jest.Mock).mockImplementation((prompt, options) => {
        return new Promise((resolve, reject) => {
          const checkAbort = () => {
            if (options?.signal?.aborted) {
              reject(new Error('流水线已被取消'));
            } else {
              setTimeout(checkAbort, 10);
            }
          };
          checkAbort();
        });
      });

      const promise = service.generateFromNovel('测试小说', scenes);
      
      // 稍微延迟后取消
      await new Promise(resolve => setTimeout(resolve, 50));
      service.cancel();

      const result = await promise;
      
      expect(result.status).toBe('failed');
      expect(result.error).toBe('流水线已被取消');
    });

    it('should abort during audio generation phase', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '一个美丽的日落',
          dialogue: '你好世界',
        },
        {
          id: '2',
          description: '场景2',
          imagePrompt: '星空',
          dialogue: '晚安',
        },
      ];

      // 让 generateImage 正常完成
      let audioCallCount = 0;
      (ttsService.synthesize as jest.Mock).mockImplementation(async () => {
        audioCallCount++;
        // 在第二次调用时检查中止
        if (audioCallCount === 2) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return {
          audio: new ArrayBuffer(128),
          duration: 2.3,
          size: 128,
          format: 'mp3',
        };
      });

      const promise = service.generateFromNovel('测试小说', scenes);
      
      // 等待图像生成完成，在音频生成时取消
      await new Promise(resolve => setTimeout(resolve, 100));
      service.cancel();

      const result = await promise;
      
      expect(result.status).toBe('failed');
      expect(result.error).toBe('流水线已被取消');
    });
  });

  describe('generateFromNovel', () => {
    it('should generate pipeline from novel content with single scene', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '一个美丽的日落',
          dialogue: '你好世界',
        },
      ];

      const result = await service.generateFromNovel('测试小说', scenes);

      expect(result.status).toBe('completed');
      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0].imageUrl).toBe('https://example.com/image.jpg');
      expect(result.scenes[0].audioUrl).toBe('tts_audio_0');
      expect(result.scenes[0].videoUrl).toBe('https://example.com/video.mp4');
      expect(result.scenes[0].finalVideoUrl).toBe('https://example.com/final.mp4');
      expect(result.totalProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should generate pipeline with multiple scenes', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
          dialogue: '你好世界',
        },
        {
          id: '2',
          description: '场景2',
          imagePrompt: '星空',
          dialogue: '晚安',
        },
        {
          id: '3',
          description: '场景3',
          imagePrompt: '森林',
          dialogue: '欢迎来到这里',
        },
      ];

      const result = await service.generateFromNovel('测试小说', scenes);

      expect(result.status).toBe('completed');
      expect(result.scenes).toHaveLength(3);
      expect(generateImage).toHaveBeenCalledTimes(3);
      expect(ttsService.synthesize).toHaveBeenCalledTimes(3);
      expect(syncLip).toHaveBeenCalledTimes(3);
    });

    it('should skip audio generation for scenes without dialogue', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
        },
        {
          id: '2',
          description: '场景2',
          imagePrompt: '星空',
          dialogue: '晚安',
        },
      ];

      const result = await service.generateFromNovel('测试小说', scenes);

      expect(result.status).toBe('completed');
      expect(ttsService.synthesize).toHaveBeenCalledTimes(1);
    });

    it('should report progress at each stage', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
          dialogue: '你好',
        },
      ];

      await service.generateFromNovel('测试小说', scenes);

      // 验证进度更新
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      const stages = progressUpdates.map(p => p.stage);
      expect(stages).toContain('generating_images');
      expect(stages).toContain('generating_audio');
      expect(stages).toContain('syncing_lips');
      expect(stages).toContain('composing');
      expect(stages).toContain('completed');
    });

    it('should handle errors gracefully', async () => {
      (generateImage as jest.Mock).mockRejectedValue(new Error('图像生成失败'));

      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
        },
      ];

      const result = await service.generateFromNovel('测试小说', scenes);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('图像生成失败');
    });

    it('should respect abort signal from options', async () => {
      const abortController = new AbortController();
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
        },
      ];

      (generateImage as jest.Mock).mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Aborted')), 100);
        })
      );

      // 立即中止
      abortController.abort();

      const result = await service.generateFromNovel('测试小说', scenes, { 
        signal: abortController.signal 
      });

      expect(result.status).toBe('failed');
      expect(result.error).toBe('流水线已被取消');
    });

    it('should pass config to image generation', async () => {
      const customConfig = {
        image: { 
          model: 'kling-3.0' as const,
          size: '4K' as const,
        },
      };
      const customService = new MangaPipelineService(customConfig);

      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
        },
      ];

      await customService.generateFromNovel('测试小说', scenes);

      expect(generateImage).toHaveBeenCalledWith(
        '美丽的日落',
        expect.objectContaining({
          model: 'kling-3.0',
          size: '4K',
        })
      );
    });

    it('should handle subtitle composition', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
          dialogue: '你好',
          subtitles: {
            id: 'sub1',
            subtitles: [
              { startTime: 0, endTime: 2, text: '你好' },
            ],
          },
        },
      ];

      await service.generateFromNovel('测试小说', scenes);

      expect(addSubtitles).toHaveBeenCalled();
    });

    it('should skip lip sync for scenes without image or audio', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
        },
      ];

      await service.generateFromNovel('测试小说', scenes);

      // 因为没有 dialogue，所以不会生成 audio，也就不会执行 lip sync
      expect(syncLip).not.toHaveBeenCalled();
    });

    it('should handle empty scenes array', async () => {
      const result = await service.generateFromNovel('测试小说', []);

      expect(result.status).toBe('completed');
      expect(result.scenes).toHaveLength(0);
      expect(generateImage).not.toHaveBeenCalled();
    });
  });

  describe('generateFromImages', () => {
    it('should generate videos from images', async () => {
      const images = [
        { url: 'https://example.com/img1.jpg', prompt: '动画效果1' },
        { url: 'https://example.com/img2.jpg', prompt: '动画效果2' },
      ];

      const results = await service.generateFromImages(images);

      expect(results).toHaveLength(2);
      expect(generateVideo).toHaveBeenCalledTimes(2);
      expect(generateVideo).toHaveBeenCalledWith(
        '动画效果1',
        expect.objectContaining({
          model: 'seedance-2.0',
          referenceImage: 'https://example.com/img1.jpg',
        })
      );
    });

    it('should respect abort signal', async () => {
      const abortController = new AbortController();
      const images = [
        { url: 'https://example.com/img1.jpg', prompt: '动画效果1' },
      ];

      (generateVideo as jest.Mock).mockImplementation(async (_, options) => {
        if (options.signal?.aborted) {
          throw new Error('流水线已被取消');
        }
        return {
          url: 'https://example.com/video.mp4',
          width: 1920,
          height: 1080,
          duration: 5,
        };
      });

      abortController.abort();

      await expect(
        service.generateFromImages(images, { signal: abortController.signal })
      ).rejects.toThrow('流水线已被取消');
    });

    it('should report progress during generation', async () => {
      const images = [
        { url: 'https://example.com/img1.jpg', prompt: '动画效果1' },
        { url: 'https://example.com/img2.jpg', prompt: '动画效果2' },
      ];

      await service.generateFromImages(images);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates.some(p => p.stage === 'generating_images')).toBe(true);
    });

    it('should use custom video config', async () => {
      const customConfig = {
        video: {
          model: 'kling-3.0' as const,
          duration: 10,
        },
      };
      const customService = new MangaPipelineService(customConfig);
      customService.onProgress((progress) => progressUpdates.push(progress));

      const images = [
        { url: 'https://example.com/img1.jpg', prompt: '动画效果1' },
      ];

      await customService.generateFromImages(images);

      expect(generateVideo).toHaveBeenCalledWith(
        '动画效果1',
        expect.objectContaining({
          model: 'kling-3.0',
          duration: 10,
        })
      );
    });

    it('should handle empty images array', async () => {
      const results = await service.generateFromImages([]);

      expect(results).toHaveLength(0);
      expect(generateVideo).not.toHaveBeenCalled();
    });
  });

  describe('generateTalkingVideo', () => {
    it('should generate talking head video', async () => {
      const imageUrl = 'https://example.com/face.jpg';
      const audioUrl = 'https://example.com/audio.mp3';

      const result = await service.generateTalkingVideo(imageUrl, audioUrl);

      expect(generateTalkingHead).toHaveBeenCalledWith(imageUrl, audioUrl);
      expect(result.url).toBe('https://example.com/talking-head.mp4');
    });

    it('should handle generation errors', async () => {
      (generateTalkingHead as jest.Mock).mockRejectedValue(new Error('生成失败'));

      const imageUrl = 'https://example.com/face.jpg';
      const audioUrl = 'https://example.com/audio.mp3';

      await expect(
        service.generateTalkingVideo(imageUrl, audioUrl)
      ).rejects.toThrow('生成失败');
    });
  });

  describe('Progress Tracking', () => {
    it('should track overall progress from 0 to 100', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
          dialogue: '你好',
        },
      ];

      await service.generateFromNovel('测试小说', scenes);

      const overallProgresses = progressUpdates.map(p => p.overallProgress);
      const minProgress = Math.min(...overallProgresses);
      const maxProgress = Math.max(...overallProgresses);

      expect(minProgress).toBeLessThanOrEqual(10); // 开始进度
      expect(maxProgress).toBe(100); // 完成进度
    });

    it('should track current scene index', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '场景1',
          imagePrompt: '美丽的日落',
          dialogue: '你好',
        },
        {
          id: '2',
          description: '场景2',
          imagePrompt: '星空',
          dialogue: '晚安',
        },
      ];

      await service.generateFromNovel('测试小说', scenes);

      const imageGenUpdates = progressUpdates.filter(p => p.stage === 'generating_images');
      const sceneIndices = imageGenUpdates.map(p => p.currentSceneIndex);

      expect(sceneIndices).toContain(0);
      expect(sceneIndices).toContain(1);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete pipeline with all features', async () => {
      const scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[] = [
        {
          id: '1',
          description: '开场',
          imagePrompt: '美丽的日落',
          dialogue: '欢迎来到这个故事',
          character: '主角',
          subtitles: {
            id: 'sub1',
            subtitles: [
              { startTime: 0, endTime: 2, text: '欢迎来到这个故事' },
            ],
          },
        },
        {
          id: '2',
          description: '发展',
          imagePrompt: '繁华的城市',
          dialogue: '这是一个关于梦想的故事',
          character: '旁白',
        },
      ];

      const result = await service.generateFromNovel('完整测试小说', scenes);

      // 验证结果
      expect(result.status).toBe('completed');
      expect(result.scenes).toHaveLength(2);
      expect(result.finalVideoUrl).toBeDefined();
      
      // 验证所有服务都被调用
      expect(generateImage).toHaveBeenCalled();
      expect(ttsService.synthesize).toHaveBeenCalled();
      expect(syncLip).toHaveBeenCalled();
      expect(composeVideo).toHaveBeenCalled();
      expect(addSubtitles).toHaveBeenCalled();
    });
  });
});
