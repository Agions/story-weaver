/**
 * Video Analysis Service Tests
 * 测试 AI 视频分析服务的各项功能
 */

import { aiService } from '@/core/services/ai/text/ai-service';
import {
  videoAnalysisService,
  DEFAULT_ANALYSIS_CONFIG,
  SCENE_TYPES,
} from '@/core/services/video/video-analysis-service';
import type {
  VideoInfo,
  VideoAnalysis,
  Scene,
  Keyframe,
  ObjectDetection,
  EmotionAnalysis,
} from '@/shared/types';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(7)),
}));

// Mock logger to prevent console output during tests
jest.mock('@/core/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock ai service
jest.mock('@/core/services/ai/text/ai-service', () => ({
  aiService: {
    generate: jest.fn(),
  },
}));

describe('VideoAnalysisService', () => {
  // 测试用的视频信息
  const mockVideoInfo: VideoInfo = {
    id: 'video-test-123',
    path: 'blob:test-video',
    name: 'test-video.mp4',
    duration: 90,
    width: 1920,
    height: 1080,
    fps: 30,
    format: 'mp4',
    size: 10485760,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeVideo', () => {
    it('should perform complete video analysis with default config', async () => {
      (aiService.generate as jest.Mock).mockResolvedValue('这是一个测试视频的内容摘要。');

      const result = await videoAnalysisService.analyzeVideo(mockVideoInfo);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.videoId).toBe(mockVideoInfo.id);
      expect(result.scenes).toBeDefined();
      expect(result.scenes.length).toBeGreaterThan(0);
      expect(result.keyframes).toBeDefined();
      expect(result.keyframes.length).toBe(DEFAULT_ANALYSIS_CONFIG.maxKeyframes);
      expect(result.objects).toBeDefined();
      expect(result.emotions).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should respect custom config options', async () => {
      const customConfig = {
        enableSceneDetection: true,
        enableObjectDetection: false,
        enableEmotionAnalysis: false,
        enableContentSummary: false,
        enableKeyframeExtraction: true,
        maxKeyframes: 5,
      };

      const result = await videoAnalysisService.analyzeVideo(mockVideoInfo, customConfig);

      expect(result.keyframes.length).toBe(5);
      expect(result.objects.length).toBe(0);
      expect(result.emotions.length).toBe(0);
      expect(result.summary).toBe('');
    });

    it('should handle analysis with only keyframes enabled', async () => {
      const config = {
        enableSceneDetection: false,
        enableObjectDetection: false,
        enableEmotionAnalysis: false,
        enableContentSummary: false,
        enableKeyframeExtraction: true,
        maxKeyframes: 3,
      };

      const result = await videoAnalysisService.analyzeVideo(mockVideoInfo, config);

      expect(result.keyframes.length).toBe(3);
      expect(result.scenes.length).toBe(0);
      expect(result.objects.length).toBe(0);
      expect(result.emotions.length).toBe(0);
    });

    it('should calculate correct statistics', async () => {
      const result = await videoAnalysisService.analyzeVideo(mockVideoInfo);

      expect(result.stats).toBeDefined();
      expect(result.stats.sceneCount).toBe(result.scenes.length);
      expect(result.stats.objectCount).toBe(result.objects.length);
      expect(result.stats.avgSceneDuration).toBeGreaterThan(0);
      expect(result.stats.sceneTypes).toBeDefined();
      expect(result.stats.objectCategories).toBeDefined();
      expect(result.stats.dominantEmotions).toBeDefined();
    });

    it('should handle videos with missing duration', async () => {
      const invalidVideoInfo = { ...mockVideoInfo, duration: undefined };

      // The service should handle this gracefully and not throw
      const result = await videoAnalysisService.analyzeVideo(invalidVideoInfo as any);

      // Should still return a result, even if some values are NaN
      expect(result).toBeDefined();
      expect(result.videoId).toBe(invalidVideoInfo.id);
    });
  });

  describe('extractKeyframes', () => {
    it('should extract correct number of keyframes', async () => {
      const count = 5;
      const keyframes = await videoAnalysisService.extractKeyframes(mockVideoInfo, count);

      expect(keyframes).toHaveLength(count);
      keyframes.forEach((kf) => {
        expect(kf.id).toBeDefined();
        expect(kf.timestamp).toBeGreaterThanOrEqual(0);
        expect(kf.timestamp).toBeLessThanOrEqual(mockVideoInfo.duration!);
        expect(kf.description).toBeDefined();
      });
    });

    it('should distribute keyframes evenly across video duration', async () => {
      const keyframes = await videoAnalysisService.extractKeyframes(mockVideoInfo, 3);
      const duration = mockVideoInfo.duration!;
      const interval = duration / 4; // (count + 1)

      // Use Math.round for comparison since the service uses Math.round
      expect(keyframes[0].timestamp).toBe(Math.round(interval));
      expect(keyframes[1].timestamp).toBe(Math.round(interval * 2));
      expect(keyframes[2].timestamp).toBe(Math.round(interval * 3));
    });

    it('should handle single keyframe extraction', async () => {
      const keyframes = await videoAnalysisService.extractKeyframes(mockVideoInfo, 1);

      expect(keyframes).toHaveLength(1);
      expect(keyframes[0].timestamp).toBeGreaterThan(0);
      expect(keyframes[0].timestamp).toBeLessThan(mockVideoInfo.duration!);
    });

    it('should generate keyframe descriptions', async () => {
      const keyframes = await videoAnalysisService.extractKeyframes(mockVideoInfo, 2);

      expect(keyframes[0].description).toContain('第 1 个关键帧');
      expect(keyframes[1].description).toContain('第 2 个关键帧');
    });
  });

  describe('detectScenes', () => {
    it('should detect scenes based on video duration', async () => {
      const scenes = await videoAnalysisService.detectScenes(mockVideoInfo, 0.3);

      expect(scenes.length).toBeGreaterThan(0);
      scenes.forEach((scene) => {
        expect(scene.id).toBeDefined();
        expect(scene.startTime).toBeGreaterThanOrEqual(0);
        expect(scene.endTime).toBeLessThanOrEqual(mockVideoInfo.duration!);
        expect(scene.startTime).toBeLessThan(scene.endTime);
        expect(scene.description).toBeDefined();
        expect(scene.tags).toBeDefined();
        expect(scene.type).toBeDefined();
        expect(scene.confidence).toBeGreaterThanOrEqual(0.7);
        expect(scene.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should assign scene types from predefined list', async () => {
      const scenes = await videoAnalysisService.detectScenes(mockVideoInfo, 0.3);

      scenes.forEach((scene) => {
        expect(SCENE_TYPES).toContain(scene.type as any);
      });
    });

    it('should create non-overlapping scenes', async () => {
      const scenes = await videoAnalysisService.detectScenes(mockVideoInfo, 0.3);

      for (let i = 0; i < scenes.length - 1; i++) {
        expect(scenes[i].endTime).toBeLessThanOrEqual(scenes[i + 1].startTime);
      }
    });

    it('should cover entire video duration', async () => {
      const scenes = await videoAnalysisService.detectScenes(mockVideoInfo, 0.3);

      if (scenes.length > 0) {
        expect(scenes[0].startTime).toBe(0);
        expect(scenes[scenes.length - 1].endTime).toBe(mockVideoInfo.duration);
      }
    });

    it('should handle short videos', async () => {
      const shortVideo: VideoInfo = { ...mockVideoInfo, duration: 15 };
      const scenes = await videoAnalysisService.detectScenes(shortVideo, 0.3);

      expect(scenes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('detectObjects', () => {
    let mockScenes: Scene[];

    beforeEach(async () => {
      mockScenes = await videoAnalysisService.detectScenes(mockVideoInfo, 0.3);
    });

    it('should detect objects in scenes', async () => {
      const objects = await videoAnalysisService.detectObjects(mockVideoInfo, mockScenes);

      expect(objects.length).toBeGreaterThan(0);
      objects.forEach((obj) => {
        expect(obj.id).toBeDefined();
        expect(obj.sceneId).toBeDefined();
        expect(obj.category).toBeDefined();
        expect(obj.label).toBeDefined();
        expect(obj.confidence).toBeGreaterThanOrEqual(0.5);
        expect(obj.confidence).toBeLessThanOrEqual(1);
        expect(obj.bbox).toBeDefined();
        expect(obj.bbox.x).toBeGreaterThanOrEqual(0);
        expect(obj.bbox.y).toBeGreaterThanOrEqual(0);
        expect(obj.bbox.width).toBeGreaterThan(0);
        expect(obj.bbox.height).toBeGreaterThan(0);
        expect(obj.timestamp).toBeDefined();
      });
    });

    it('should assign objects to valid scenes', async () => {
      const objects = await videoAnalysisService.detectObjects(mockVideoInfo, mockScenes);
      const sceneIds = mockScenes.map((s) => s.id);

      objects.forEach((obj) => {
        expect(sceneIds).toContain(obj.sceneId);
      });
    });

    it('should use predefined object categories', async () => {
      const objects = await videoAnalysisService.detectObjects(mockVideoInfo, mockScenes);
      const validCategories = ['人物', '物品', '文字', '背景', '动物', '车辆'];

      objects.forEach((obj) => {
        expect(validCategories).toContain(obj.category);
      });
    });

    it('should handle empty scenes array', async () => {
      const objects = await videoAnalysisService.detectObjects(mockVideoInfo, []);

      expect(objects).toHaveLength(0);
    });
  });

  describe('analyzeEmotions', () => {
    let mockScenes: Scene[];

    beforeEach(async () => {
      mockScenes = await videoAnalysisService.detectScenes(mockVideoInfo, 0.3);
    });

    it('should analyze emotions for each scene', async () => {
      const emotions = await videoAnalysisService.analyzeEmotions(mockVideoInfo, mockScenes);

      expect(emotions).toHaveLength(mockScenes.length);
      emotions.forEach((emo) => {
        expect(emo.id).toBeDefined();
        expect(emo.sceneId).toBeDefined();
        expect(emo.timestamp).toBeDefined();
        expect(emo.emotions).toBeDefined();
        expect(emo.emotions.length).toBeGreaterThan(0);
        expect(emo.dominant).toBeDefined();
        expect(emo.intensity).toBeGreaterThan(0);
        expect(emo.intensity).toBeLessThanOrEqual(1);
      });
    });

    it('should normalize emotion scores to sum to 1', async () => {
      const emotions = await videoAnalysisService.analyzeEmotions(mockVideoInfo, mockScenes);

      emotions.forEach((emo) => {
        const sum = emo.emotions.reduce((acc, e) => acc + e.score, 0);
        expect(sum).toBeCloseTo(1, 5);
      });
    });

    it('should identify dominant emotion correctly', async () => {
      const emotions = await videoAnalysisService.analyzeEmotions(mockVideoInfo, mockScenes);

      emotions.forEach((emo) => {
        const maxEmotion = emo.emotions.reduce((max, e) => (e.score > max.score ? e : max));
        expect(emo.dominant).toBe(maxEmotion.name);
        expect(emo.intensity).toBe(maxEmotion.score);
      });
    });

    it('should use valid emotion types', async () => {
      const emotions = await videoAnalysisService.analyzeEmotions(mockVideoInfo, mockScenes);
      const validEmotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fear'];

      emotions.forEach((emo) => {
        expect(validEmotions).toContain(emo.dominant);
        emo.emotions.forEach((e) => {
          expect(validEmotions).toContain(e.name);
        });
      });
    });

    it('should handle empty scenes array', async () => {
      const emotions = await videoAnalysisService.analyzeEmotions(mockVideoInfo, []);

      expect(emotions).toHaveLength(0);
    });
  });

  describe('generateSummary', () => {
    let mockAnalysis: Partial<VideoAnalysis>;

    beforeEach(async () => {
      const scenes = await videoAnalysisService.detectScenes(mockVideoInfo, 0.3);
      const objects = await videoAnalysisService.detectObjects(mockVideoInfo, scenes);

      mockAnalysis = {
        scenes,
        objects,
        stats: {
          sceneCount: scenes.length,
          objectCount: objects.length,
          avgSceneDuration: 30,
          sceneTypes: { intro: 1, dialogue: 2 },
          objectCategories: { 人物: 5, 物品: 3 },
          dominantEmotions: { neutral: 2, happy: 1 },
        },
      };
    });

    it('should generate summary using AI service', async () => {
      const mockSummary = '这是一个90秒的测试视频，包含多个场景和人物。';
      (aiService.generate as jest.Mock).mockResolvedValue(mockSummary);

      const summary = await videoAnalysisService.generateSummary(mockVideoInfo, mockAnalysis);

      expect(summary).toBe(mockSummary);
      expect(aiService.generate).toHaveBeenCalledWith(
        expect.stringContaining('视频信息'),
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          provider: 'openai',
        })
      );
    });

    it('should fallback to default summary on AI failure', async () => {
      (aiService.generate as jest.Mock).mockRejectedValue(new Error('AI service error'));

      const summary = await videoAnalysisService.generateSummary(mockVideoInfo, mockAnalysis);

      expect(summary).toBeDefined();
      expect(summary).toContain('1:30'); // 90 seconds formatted
      expect(summary).toContain('1920x1080');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should include video metadata in summary', async () => {
      (aiService.generate as jest.Mock).mockRejectedValue(new Error('Fallback'));

      const summary = await videoAnalysisService.generateSummary(mockVideoInfo, mockAnalysis);

      expect(summary).toContain('1920x1080');
      expect(summary).toContain(mockAnalysis.scenes!.length.toString());
    });
  });

  describe('calculateStats', () => {
    it('should calculate correct statistics from analysis', async () => {
      const analysis = await videoAnalysisService.analyzeVideo(mockVideoInfo);

      expect(analysis.stats.sceneCount).toBe(analysis.scenes.length);
      expect(analysis.stats.objectCount).toBe(analysis.objects.length);
      expect(analysis.stats.avgSceneDuration).toBeGreaterThan(0);
    });

    it('should group scene types correctly', async () => {
      const analysis = await videoAnalysisService.analyzeVideo(mockVideoInfo);

      const typeSum = Object.values(analysis.stats.sceneTypes).reduce(
        (a, b) => (a as number) + (b as number),
        0
      );
      expect(typeSum).toBe(analysis.scenes.length);
    });

    it('should group object categories correctly', async () => {
      const analysis = await videoAnalysisService.analyzeVideo(mockVideoInfo);

      const categorySum = Object.values(analysis.stats.objectCategories).reduce(
        (a, b) => (a as number) + (b as number),
        0
      );
      expect(categorySum).toBe(analysis.objects.length);
    });

    it('should group dominant emotions correctly', async () => {
      const analysis = await videoAnalysisService.analyzeVideo(mockVideoInfo);

      const emotionSum = Object.values(analysis.stats.dominantEmotions).reduce(
        (a, b) => (a as number) + (b as number),
        0
      );
      expect(emotionSum).toBe(analysis.emotions.length);
    });
  });

  describe('getSuggestions', () => {
    it('should suggest adding intro scene if missing', async () => {
      const mockAnalysis: VideoAnalysis = {
        id: 'test',
        videoId: 'test',
        scenes: [{ id: '1', startTime: 0, endTime: 30, thumbnail: '', tags: [], type: 'dialogue' }],
        keyframes: [],
        objects: [],
        emotions: [],
        summary: '',
        stats: {
          sceneCount: 1,
          objectCount: 0,
          avgSceneDuration: 30,
          sceneTypes: { dialogue: 1 },
          objectCategories: {},
          dominantEmotions: {},
        },
        createdAt: new Date().toISOString(),
      };

      const suggestions = videoAnalysisService.getSuggestions(mockAnalysis);

      expect(suggestions).toContain('建议添加开场场景来吸引观众');
    });

    it('should suggest adding conclusion scene if missing', async () => {
      const mockAnalysis: VideoAnalysis = {
        id: 'test',
        videoId: 'test',
        scenes: [{ id: '1', startTime: 0, endTime: 30, thumbnail: '', tags: [], type: 'intro' }],
        keyframes: [],
        objects: [],
        emotions: [],
        summary: '',
        stats: {
          sceneCount: 1,
          objectCount: 0,
          avgSceneDuration: 30,
          sceneTypes: { intro: 1 },
          objectCategories: {},
          dominantEmotions: {},
        },
        createdAt: new Date().toISOString(),
      };

      const suggestions = videoAnalysisService.getSuggestions(mockAnalysis);

      expect(suggestions).toContain('建议添加结尾总结来强化内容');
    });

    it('should suggest emotion variation if too neutral', async () => {
      const mockAnalysis: VideoAnalysis = {
        id: 'test',
        videoId: 'test',
        scenes: [],
        keyframes: [],
        objects: [],
        emotions: [],
        summary: '',
        stats: {
          sceneCount: 0,
          objectCount: 0,
          avgSceneDuration: 0,
          sceneTypes: {},
          objectCategories: {},
          dominantEmotions: { neutral: 0.8 },
        },
        createdAt: new Date().toISOString(),
      };

      const suggestions = videoAnalysisService.getSuggestions(mockAnalysis);

      expect(suggestions).toContain('情感比较单一，可以增加情感变化');
    });

    it('should suggest more visual elements if too few objects', async () => {
      const mockAnalysis: VideoAnalysis = {
        id: 'test',
        videoId: 'test',
        scenes: [],
        keyframes: [],
        objects: [],
        emotions: [],
        summary: '',
        stats: {
          sceneCount: 0,
          objectCount: 0,
          avgSceneDuration: 0,
          sceneTypes: {},
          objectCategories: { 人物: 1 },
          dominantEmotions: {},
        },
        createdAt: new Date().toISOString(),
      };

      const suggestions = videoAnalysisService.getSuggestions(mockAnalysis);

      expect(suggestions).toContain('画面元素较少，可以增加更多视觉元素');
    });

    it('should return empty array for well-structured video', async () => {
      const mockAnalysis: VideoAnalysis = {
        id: 'test',
        videoId: 'test',
        scenes: [],
        keyframes: [],
        objects: [],
        emotions: [],
        summary: '',
        stats: {
          sceneCount: 5,
          objectCount: 10,
          avgSceneDuration: 20,
          sceneTypes: { intro: 1, dialogue: 2, conclusion: 1, action: 1 },
          objectCategories: { 人物: 5, 物品: 3, 背景: 2 },
          dominantEmotions: { neutral: 0.3, happy: 0.4, surprised: 0.3 },
        },
        createdAt: new Date().toISOString(),
      };

      const suggestions = videoAnalysisService.getSuggestions(mockAnalysis);

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('cancelAnalysis', () => {
    it('should cancel analysis with valid ID', () => {
      // This method manages abort controllers, test it doesn't throw
      expect(() => {
        videoAnalysisService.cancelAnalysis('test-id');
      }).not.toThrow();
    });

    it('should handle cancellation of non-existent analysis', () => {
      expect(() => {
        videoAnalysisService.cancelAnalysis('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('formatTime', () => {
    // Test the time formatting through the generated descriptions
    it('should format time correctly in keyframe descriptions', async () => {
      const keyframes = await videoAnalysisService.extractKeyframes(mockVideoInfo, 2);

      // Should contain formatted time like "1:30" for 90 seconds
      keyframes.forEach((kf) => {
        expect(kf.description).toMatch(/\d+:\d{2}/);
      });
    });
  });

  describe('constants', () => {
    it('should export DEFAULT_ANALYSIS_CONFIG', () => {
      expect(DEFAULT_ANALYSIS_CONFIG).toBeDefined();
      expect(DEFAULT_ANALYSIS_CONFIG.enableSceneDetection).toBe(true);
      expect(DEFAULT_ANALYSIS_CONFIG.enableObjectDetection).toBe(true);
      expect(DEFAULT_ANALYSIS_CONFIG.enableEmotionAnalysis).toBe(true);
      expect(DEFAULT_ANALYSIS_CONFIG.enableContentSummary).toBe(true);
      expect(DEFAULT_ANALYSIS_CONFIG.enableKeyframeExtraction).toBe(true);
      expect(DEFAULT_ANALYSIS_CONFIG.sceneThreshold).toBe(0.3);
      expect(DEFAULT_ANALYSIS_CONFIG.maxKeyframes).toBe(10);
    });

    it('should export SCENE_TYPES', () => {
      expect(SCENE_TYPES).toBeDefined();
      expect(SCENE_TYPES).toContain('intro');
      expect(SCENE_TYPES).toContain('dialogue');
      expect(SCENE_TYPES).toContain('action');
      expect(SCENE_TYPES).toContain('conclusion');
      expect(SCENE_TYPES.length).toBe(10);
    });
  });

  describe('service singleton', () => {
    it('should be available as export', () => {
      expect(videoAnalysisService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof videoAnalysisService.analyzeVideo).toBe('function');
      expect(typeof videoAnalysisService.extractKeyframes).toBe('function');
      expect(typeof videoAnalysisService.detectScenes).toBe('function');
      expect(typeof videoAnalysisService.detectObjects).toBe('function');
      expect(typeof videoAnalysisService.analyzeEmotions).toBe('function');
      expect(typeof videoAnalysisService.generateSummary).toBe('function');
      expect(typeof videoAnalysisService.cancelAnalysis).toBe('function');
      expect(typeof videoAnalysisService.getSuggestions).toBe('function');
    });
  });
});
