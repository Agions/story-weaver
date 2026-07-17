/**
 * Video Service Tests
 */

import { videoService } from '@/core/services/video/video-service';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
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

describe('VideoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVideoInfo', () => {
    it('should return VideoInfo from File object', async () => {
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      Object.defineProperty(mockFile, 'size', { value: 1024000 });

      // Mock video element
      const mockVideo = {
        onloadedmetadata: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        onerror: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        videoWidth: 1920,
        videoHeight: 1080,
        duration: 120,
        src: '',
      };

      const createElementSpy = jest.spyOn(document, 'createElement');
      createElementSpy.mockReturnValue(mockVideo as unknown as HTMLVideoElement);

      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      jest.spyOn(URL, 'revokeObjectURL').mockReturnValue();

      // Trigger the callback immediately
      setTimeout(() => {
        mockVideo.onloadedmetadata!({} as Event);
      }, 0);

      const result = await videoService.getVideoInfo(mockFile);

      expect(result.name).toBe('test.mp4');
      expect(result.format).toBe('mp4');
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);

      createElementSpy.mockRestore();
    }, 15000);

    it('should reject with error when video fails to load', async () => {
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });

      const mockVideo = {
        onloadedmetadata: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        onerror: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        videoWidth: 0,
        videoHeight: 0,
        duration: 0,
        src: '',
      };

      jest
        .spyOn(document, 'createElement')
        .mockReturnValue(mockVideo as unknown as HTMLVideoElement);
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      jest.spyOn(URL, 'revokeObjectURL').mockReturnValue();

      setTimeout(() => {
        mockVideo.onerror!({} as Event);
      }, 0);

      await expect(videoService.getVideoInfo(mockFile)).rejects.toThrow(
        'Failed to read video file'
      );
    }, 15000);
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail as data URL', async () => {
      const mockCanvasContext = {
        drawImage: jest.fn(),
      };

      const mockCanvas = {
        getContext: jest.fn().mockReturnValue(mockCanvasContext),
        width: 320,
        height: 180,
        toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,test'),
      };

      const mockVideo = {
        onloadeddata: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        onseeked: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        onerror: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        crossOrigin: '',
        videoWidth: 1920,
        videoHeight: 1080,
        currentTime: 0,
        src: '',
      };

      jest
        .spyOn(document, 'createElement')
        .mockReturnValueOnce(mockVideo as unknown as HTMLVideoElement)
        .mockReturnValueOnce(mockCanvas as unknown as HTMLCanvasElement);

      setTimeout(() => {
        mockVideo.onloadeddata!({} as Event);
        mockVideo.onseeked!({} as Event);
      }, 0);

      const result = await videoService.generateThumbnail('blob:test', 0, 320);

      expect(result).toContain('data:image/jpeg');
    }, 15000);

    it('should reject when canvas context is not available', async () => {
      const mockVideo = {
        onloadeddata: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        onseeked: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        onerror: null as ((this: HTMLVideoElement, ev: Event) => any) | null,
        crossOrigin: '',
        videoWidth: 1920,
        videoHeight: 1080,
        currentTime: 0,
        src: '',
      };

      const mockCanvas = {
        getContext: jest.fn().mockReturnValue(null),
        width: 320,
        height: 180,
      };

      jest
        .spyOn(document, 'createElement')
        .mockReturnValueOnce(mockVideo as unknown as HTMLVideoElement)
        .mockReturnValueOnce(mockCanvas as unknown as HTMLCanvasElement);

      setTimeout(() => {
        mockVideo.onloadeddata!({} as Event);
        mockVideo.onseeked!({} as Event);
      }, 0);

      await expect(videoService.generateThumbnail('blob:test', 0, 320)).rejects.toThrow(
        'Failed to create canvas context'
      );
    }, 15000);
  });

  describe('extractKeyframes', () => {
    it('should extract keyframes from video', async () => {
      // Mock generateThumbnail to return a valid thumbnail
      jest
        .spyOn(videoService, 'generateThumbnail')
        .mockResolvedValue('data:image/jpeg;base64,thumbnail');

      const keyframes = await videoService.extractKeyframes('blob:test', 60, 3);

      expect(keyframes).toHaveLength(3);
      expect(videoService.generateThumbnail).toHaveBeenCalledTimes(3);

      // Check first keyframe
      expect(keyframes[0].thumbnail).toBe('data:image/jpeg;base64,thumbnail');
      expect(keyframes[0].description).toBe('Keyframe 1');
      expect(keyframes[0].timestamp).toBeGreaterThan(0);
    });

    it('should handle thumbnail generation errors gracefully', async () => {
      jest
        .spyOn(videoService, 'generateThumbnail')
        .mockResolvedValueOnce('data:image/jpeg;base64,thumbnail')
        .mockRejectedValueOnce(new Error('Thumbnail failed'))
        .mockResolvedValueOnce('data:image/jpeg;base64,thumbnail');

      const keyframes = await videoService.extractKeyframes('blob:test', 30, 3);

      // Should still return 2 keyframes (one failed)
      expect(keyframes).toHaveLength(2);
    });

    it('should calculate correct timestamps for keyframes', async () => {
      jest
        .spyOn(videoService, 'generateThumbnail')
        .mockResolvedValue('data:image/jpeg;base64,test');

      const keyframes = await videoService.extractKeyframes('blob:test', 60, 4);

      // For 60s video with 4 keyframes, interval = 60/5 = 12
      // timestamps should be at 12, 24, 36, 48
      expect(keyframes[0].timestamp).toBe(12);
      expect(keyframes[1].timestamp).toBe(24);
      expect(keyframes[2].timestamp).toBe(36);
      expect(keyframes[3].timestamp).toBe(48);
    });
  });

  describe('detectScenes', () => {
    it('should detect scenes from video duration', async () => {
      jest
        .spyOn(videoService, 'generateThumbnail')
        .mockResolvedValue('data:image/jpeg;base64,thumbnail');

      const scenes = await videoService.detectScenes('blob:test', 90);

      // 90s / 30s per scene = 3 scenes
      expect(scenes).toHaveLength(3);
      expect(scenes[0].startTime).toBe(0);
      expect(scenes[0].endTime).toBe(30);
      expect(scenes[1].startTime).toBe(30);
      expect(scenes[1].endTime).toBe(60);
      expect(scenes[2].startTime).toBe(60);
      expect(scenes[2].endTime).toBe(90);
    });

    it('should set scene description and tags', async () => {
      jest
        .spyOn(videoService, 'generateThumbnail')
        .mockResolvedValue('data:image/jpeg;base64,test');

      const scenes = await videoService.detectScenes('blob:test', 30);

      expect(scenes[0].description).toBe('Scene 1');
      expect(scenes[0].tags).toContain('scene1');
    });

    it('should handle thumbnail errors gracefully', async () => {
      jest.spyOn(videoService, 'generateThumbnail').mockRejectedValue(new Error('Failed'));

      const scenes = await videoService.detectScenes('blob:test', 60);

      expect(scenes).toHaveLength(0);
    });
  });

  describe('analyzeVideo', () => {
    it('should analyze video and return VideoAnalysis', async () => {
      jest
        .spyOn(videoService, 'extractKeyframes')
        .mockResolvedValue([
          { id: 'kf1', timestamp: 10, thumbnail: 'thumb1', description: 'Keyframe 1' },
        ]);
      jest.spyOn(videoService, 'detectScenes').mockResolvedValue([
        {
          id: 'sc1',
          startTime: 0,
          endTime: 30,
          thumbnail: 'thumb',
          description: 'Scene 1',
          tags: ['scene1'],
        },
      ]);

      const videoInfo = {
        id: 'video-1',
        path: 'blob:test',
        name: 'test.mp4',
        duration: 60,
        width: 1920,
        height: 1080,
      };

      const result = await videoService.analyzeVideo(videoInfo);

      expect(result.id).toBe('mock-uuid');
      expect(result.videoId).toBe('video-1');
      expect(result.scenes).toHaveLength(1);
      expect(result.keyframes).toHaveLength(1);
      expect(result.summary).toContain('1:00'); // formatDuration(60) = "1:00"
      expect(result.summary).toContain('1920x1080');
      expect(result.summary).toContain('1 scenes');
    });

    it('should handle errors in keyframe extraction', async () => {
      // Since analyzeVideo uses Promise.all, if extractKeyframes fails, the whole function fails
      // We test that the error is properly propagated
      jest.spyOn(videoService, 'extractKeyframes').mockImplementation(async () => {
        throw new Error('Keyframe error');
      });
      jest.spyOn(videoService, 'detectScenes').mockResolvedValue([
        {
          id: 'sc1',
          startTime: 0,
          endTime: 30,
          thumbnail: 'thumb',
          description: 'Scene 1',
          tags: ['scene1'],
        },
      ]);

      const videoInfo = {
        id: 'video-1',
        path: 'blob:test',
        name: 'test.mp4',
        duration: 60,
        width: 1920,
        height: 1080,
      };

      await expect(videoService.analyzeVideo(videoInfo)).rejects.toThrow('Keyframe error');
    });
  });

  describe('generatePreview', () => {
    it('should return video path as preview', async () => {
      const result = await videoService.generatePreview('blob:test', 0, 30);

      expect(result).toBe('blob:test');
    });
  });

  describe('exportVideo', () => {
    it('should export video with default options', async () => {
      const result = await videoService.exportVideo('/input.mp4', '/output.mp4', {});

      expect(result).toBe('/output.mp4');
    });

    it('should export video with custom quality', async () => {
      const result = await videoService.exportVideo('/input.mp4', '/output.mp4', {
        quality: 'ultra',
      });

      expect(result).toBe('/output.mp4');
    });

    it('should export video with custom resolution', async () => {
      const result = await videoService.exportVideo('/input.mp4', '/output.mp4', {
        resolution: '4k',
      });

      expect(result).toBe('/output.mp4');
    });

    it('should include subtitles when specified', async () => {
      const result = await videoService.exportVideo('/input.mp4', '/output.mp4', {
        includeSubtitles: true,
        subtitlePath: '/subtitle.srt',
      });

      expect(result).toBe('/output.mp4');
    });
  });

  describe('clipVideo', () => {
    it('should clip video between start and end time', async () => {
      const result = await videoService.clipVideo('/input.mp4', '/output.mp4', 10, 30);

      expect(result).toBe('/output.mp4');
    });
  });

  describe('mergeVideos', () => {
    it('should merge multiple videos', async () => {
      const result = await videoService.mergeVideos(['/input1.mp4', '/input2.mp4'], '/output.mp4');

      expect(result).toBe('/output.mp4');
    });
  });

  describe('addSubtitles', () => {
    it('should add subtitles with default style', async () => {
      const result = await videoService.addSubtitles('/input.mp4', '/subtitle.srt', '/output.mp4');

      expect(result).toBe('/output.mp4');
    });

    it('should add subtitles with custom style', async () => {
      const result = await videoService.addSubtitles('/input.mp4', '/subtitle.srt', '/output.mp4', {
        fontSize: 32,
        fontColor: '#FF0000',
        backgroundColor: '#000000',
        position: 'top',
      });

      expect(result).toBe('/output.mp4');
    });
  });

  describe('convertFormat', () => {
    it('should convert to mp4 format', async () => {
      const result = await videoService.convertFormat('/input.avi', '/output.mp4', 'mp4');

      expect(result).toBe('/output.mp4');
    });

    it('should convert to webm format', async () => {
      const result = await videoService.convertFormat('/input.mp4', '/output.webm', 'webm');

      expect(result).toBe('/output.webm');
    });

    it('should convert to mov format', async () => {
      const result = await videoService.convertFormat('/input.mp4', '/output.mov', 'mov');

      expect(result).toBe('/output.mov');
    });

    it('should default to mp4 codec for unknown formats', async () => {
      const result = await videoService.convertFormat('/input.mp4', '/output.avi', 'avi');

      expect(result).toBe('/output.avi');
    });
  });

  describe('videoService singleton', () => {
    it('should be available as export', () => {
      expect(videoService).toBeDefined();
    });

    it('should be the same instance when imported', () => {
      const { videoService: anotherInstance } = require('@/core/services/video/video-service');
      expect(anotherInstance).toBe(videoService);
    });

    it('should have all required methods', () => {
      expect(typeof videoService.getVideoInfo).toBe('function');
      expect(typeof videoService.generateThumbnail).toBe('function');
      expect(typeof videoService.extractKeyframes).toBe('function');
      expect(typeof videoService.detectScenes).toBe('function');
      expect(typeof videoService.analyzeVideo).toBe('function');
      expect(typeof videoService.generatePreview).toBe('function');
      expect(typeof videoService.exportVideo).toBe('function');
      expect(typeof videoService.clipVideo).toBe('function');
      expect(typeof videoService.mergeVideos).toBe('function');
      expect(typeof videoService.addSubtitles).toBe('function');
      expect(typeof videoService.convertFormat).toBe('function');
    });
  });
});
