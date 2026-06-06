import {
  subtitleService,
  DEFAULT_SUBTITLE_STYLE,
  ASS_STYLE_PRESETS,
} from '@/core/services/subtitle.service';
import type { ScriptSegment } from '@/shared/types';

// Mock aiService
jest.mock('@/core/services/ai/text/ai.service', () => ({
  aiService: {
    generate: jest.fn(),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// Mock logger to prevent console output during tests
jest.mock('@/core/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import { aiService } from '@/core/services/ai.service';

describe('SubtitleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFromScript', () => {
    it('should generate subtitle track from script segments', () => {
      const segments: ScriptSegment[] = [
        { id: 'seg1', content: '第一句台词', startTime: 0, endTime: 3, type: 'dialogue' as const },
        { id: 'seg2', content: '第二句台词', startTime: 3, endTime: 6, type: 'dialogue' as const },
      ];

      const track = subtitleService.generateFromScript(segments);

      expect(track).toBeDefined();
      expect(track.id).toBe('mock-uuid');
      expect(track.name).toBe('字幕轨道');
      expect(track.language).toBe('zh-CN');
      expect(track.format).toBe('srt');
      expect(track.items).toHaveLength(2);
      expect(track.items[0].text).toBe('第一句台词');
      expect(track.items[0].startTime).toBe(0);
      expect(track.items[0].endTime).toBe(3);
      expect(track.items[0].index).toBe(1);
    });

    it('should apply custom style', () => {
      const segments: ScriptSegment[] = [{ id: 'seg1', content: '测试', startTime: 0, endTime: 3 }];

      const track = subtitleService.generateFromScript(segments, {
        fontSize: 32,
        fontColor: '#FF0000',
      });

      expect(track.style.fontSize).toBe(32);
      expect(track.style.fontColor).toBe('#FF0000');
      expect(track.style.fontFamily).toBe(DEFAULT_SUBTITLE_STYLE.fontFamily);
    });

    it('should use uuid when segment has no id', () => {
      const segments: ScriptSegment[] = [{ content: '测试内容', startTime: 0, endTime: 3 }];

      const track = subtitleService.generateFromScript(segments);

      expect(track.items[0].id).toBe('mock-uuid');
    });

    it('should process text (remove extra whitespace)', () => {
      const segments: ScriptSegment[] = [
        { id: 'seg1', content: '测试    内容  ', startTime: 0, endTime: 3 },
      ];

      const track = subtitleService.generateFromScript(segments);

      expect(track.items[0].text).toBe('测试 内容');
    });
  });

  describe('generateFromText', () => {
    it('should generate subtitle track from text and timeframes', () => {
      const timeframes = [
        { start: 0, end: 5, text: '第一条字幕' },
        { start: 5, end: 10, text: '第二条字幕' },
      ];

      const track = subtitleService.generateFromText('文本内容', timeframes);

      expect(track.items).toHaveLength(2);
      expect(track.items[0].text).toBe('第一条字幕');
      expect(track.items[0].startTime).toBe(0);
      expect(track.items[0].endTime).toBe(5);
      expect(track.items[1].text).toBe('第二条字幕');
    });

    it('should apply custom style', () => {
      const timeframes = [{ start: 0, end: 5, text: '测试' }];

      const track = subtitleService.generateFromText('文本', timeframes, {
        fontSize: 28,
        position: 'top',
      });

      expect(track.style.fontSize).toBe(28);
      expect(track.style.position).toBe('top');
    });
  });

  describe('generateFromVideo (async)', () => {
    it('should generate subtitles using AI service', async () => {
      const mockAiResponse = `0-5|这是第一条字幕
5-10|这是第二条字幕`;

      (aiService.generate as jest.Mock).mockResolvedValue(mockAiResponse);

      const track = await subtitleService.generateFromVideo('视频内容描述', 10);

      expect(aiService.generate).toHaveBeenCalled();
      expect(track.items).toHaveLength(2);
      expect(track.items[0].text).toBe('这是第一条字幕');
    });

    it('should return empty track on AI error', async () => {
      (aiService.generate as jest.Mock).mockRejectedValue(new Error('AI error'));

      const track = await subtitleService.generateFromVideo('内容', 10);

      expect(track.items).toHaveLength(0);
    });
  });

  describe('translateSubtitles (async)', () => {
    it('should translate subtitle items', async () => {
      (aiService.generate as jest.Mock)
        .mockResolvedValueOnce('Hello world')
        .mockResolvedValueOnce('This is test');

      const track = subtitleService.generateFromScript([
        { id: '1', content: '你好世界', startTime: 0, endTime: 3 },
        { id: '2', content: '这是测试', startTime: 3, endTime: 6 },
      ]);

      const translated = await subtitleService.translateSubtitles(track, 'en');

      expect(translated.language).toBe('en');
      expect(translated.name).toBe('字幕轨道 (en)');
      expect(translated.items[0].text).toBe('Hello world');
      expect(translated.items[1].text).toBe('This is test');
    });

    it('should keep original item on translation error', async () => {
      (aiService.generate as jest.Mock).mockRejectedValue(new Error('Translation failed'));

      const track = subtitleService.generateFromScript([
        { id: '1', content: '你好', startTime: 0, endTime: 3 },
      ]);

      const translated = await subtitleService.translateSubtitles(track, 'en');

      expect(translated.items[0].text).toBe('你好');
    });
  });

  describe('exportSubtitles', () => {
    const createTestTrack = () => ({
      id: 'track1',
      name: '测试字幕',
      language: 'zh-CN',
      format: 'srt' as const,
      items: [
        { id: '1', index: 1, startTime: 0, endTime: 5, text: '第一句' },
        { id: '2', index: 2, startTime: 5, endTime: 10, text: '第二句' },
      ],
      style: { ...DEFAULT_SUBTITLE_STYLE },
    });

    describe('SRT export', () => {
      it('should export to SRT format', () => {
        const track = createTestTrack();
        const srt = subtitleService.exportSubtitles(track, 'srt');

        expect(srt).toContain('1\n00:00:00,000 --> 00:00:05,000\n第一句');
        expect(srt).toContain('2\n00:00:05,000 --> 00:00:10,000\n第二句');
      });

      it('should default to track format if no format specified', () => {
        const track = createTestTrack();
        const output = subtitleService.exportSubtitles(track);

        expect(output).toContain('第一句');
      });
    });

    describe('VTT export', () => {
      it('should export to VTT format', () => {
        const track = createTestTrack();
        const vtt = subtitleService.exportSubtitles(track, 'vtt');

        expect(vtt).toContain('WEBVTT');
        expect(vtt).toContain('00:00:00.000 --> 00:00:05.000');
        expect(vtt).toContain('第一句');
      });

      it('should include position for bottom position', () => {
        const track = createTestTrack();
        track.style.position = 'bottom';
        track.style.margin = 10;

        const vtt = subtitleService.exportSubtitles(track, 'vtt');

        expect(vtt).toContain('line:-10%');
      });
    });

    describe('ASS export', () => {
      it('should export to ASS format', () => {
        const track = createTestTrack();
        const ass = subtitleService.exportSubtitles(track, 'ass');

        expect(ass).toContain('[Script Info]');
        expect(ass).toContain('[V4+ Styles]');
        expect(ass).toContain('[Events]');
        expect(ass).toContain('Dialogue: 0,00:00.00,00:05.00');
        expect(ass).toContain('第一句');
      });

      it('should convert colors to ASS format', () => {
        const track = createTestTrack();
        track.style.fontColor = '#FF0000';

        const ass = subtitleService.exportSubtitles(track, 'ass');

        expect(ass).toContain('&H0000ff'); // BGR format, lowercase
      });
    });

    describe('TXT export', () => {
      it('should export to plain text', () => {
        const track = createTestTrack();
        const txt = subtitleService.exportSubtitles(track, 'txt');

        expect(txt).toBe('第一句\n第二句');
      });
    });
  });

  describe('parseSRT', () => {
    it('should parse valid SRT content', () => {
      const srtContent = `1
00:00:00,000 --> 00:00:05,000
第一句台词

2
00:00:05,000 --> 00:00:10,000
第二句台词
`;

      const track = subtitleService.parseSRT(srtContent);

      expect(track.items).toHaveLength(2);
      expect(track.items[0].text).toBe('第一句台词');
      expect(track.items[0].startTime).toBe(0);
      expect(track.items[0].endTime).toBe(5);
      expect(track.items[1].text).toBe('第二句台词');
    });

    it('should handle multi-line subtitle text', () => {
      const srtContent = `1
00:00:00,000 --> 00:00:05,000
第一行
第二行
`;

      const track = subtitleService.parseSRT(srtContent);

      expect(track.items[0].text).toBe('第一行\n第二行');
    });

    it('should skip malformed blocks', () => {
      const srtContent = `1
00:00:00,000 --> 00:00:05,000
Valid block

invalid
no timestamp

2
00:00:10,000 --> 00:00:15,000
Second valid
`;

      const track = subtitleService.parseSRT(srtContent);

      expect(track.items).toHaveLength(2);
    });
  });

  describe('parseVTT', () => {
    it('should parse valid VTT content', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
第一句

00:00:05.000 --> 00:00:10.000
第二句
`;

      const track = subtitleService.parseVTT(vttContent);

      expect(track.items).toHaveLength(2);
      expect(track.items[0].text).toBe('第一句');
      expect(track.items[0].startTime).toBe(0);
    });

    it('should handle short time format', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
测试
`;

      const track = subtitleService.parseVTT(vttContent);

      expect(track.items[0].startTime).toBe(0);
      expect(track.items[0].endTime).toBe(5);
    });

    it('should handle multi-line subtitle text', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
第一行
第二行
`;

      const track = subtitleService.parseVTT(vttContent);

      expect(track.items[0].text).toBe('第一行\n第二行');
    });
  });

  describe('importSubtitles', () => {
    it('should parse VTT when file extension is vtt', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
测试
`;

      const track = subtitleService.importSubtitles(vttContent, 'subtitles.vtt');

      expect(track.format).toBe('vtt');
    });

    it('should parse VTT when content starts with WEBVTT', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
测试
`;

      const track = subtitleService.importSubtitles(vttContent, 'file.srt');

      expect(track.format).toBe('vtt');
    });

    it('should default to SRT parsing', () => {
      const srtContent = `1
00:00:00,000 --> 00:00:05,000
测试
`;

      const track = subtitleService.importSubtitles(srtContent);

      expect(track.format).toBe('srt');
      expect(track.items[0].text).toBe('测试');
    });
  });

  describe('adjustTiming', () => {
    it('should apply offset to timing', () => {
      const track = subtitleService.generateFromScript([
        { id: '1', content: '第一句', startTime: 10, endTime: 15 },
      ]);

      const adjusted = subtitleService.adjustTiming(track, 5);

      expect(adjusted.items[0].startTime).toBe(15);
      expect(adjusted.items[0].endTime).toBe(20);
    });

    it('should apply scale to timing', () => {
      const track = subtitleService.generateFromScript([
        { id: '1', content: '第一句', startTime: 0, endTime: 10 },
      ]);

      const adjusted = subtitleService.adjustTiming(track, 0, 2);

      expect(adjusted.items[0].startTime).toBe(0);
      expect(adjusted.items[0].endTime).toBe(20);
    });

    it('should combine offset and scale', () => {
      const track = subtitleService.generateFromScript([
        { id: '1', content: '第一句', startTime: 5, endTime: 10 },
      ]);

      const adjusted = subtitleService.adjustTiming(track, 10, 2);

      expect(adjusted.items[0].startTime).toBe(20);
      expect(adjusted.items[0].endTime).toBe(30);
    });

    it('should not allow negative start/end times', () => {
      const track = subtitleService.generateFromScript([
        { id: '1', content: '第一句', startTime: 1, endTime: 3 },
      ]);

      const adjusted = subtitleService.adjustTiming(track, -10);

      expect(adjusted.items[0].startTime).toBe(0);
      expect(adjusted.items[0].endTime).toBe(0);
    });
  });

  describe('mergeTracks', () => {
    it('should merge multiple tracks', () => {
      const track1 = subtitleService.generateFromScript([
        { id: '1', content: 'Track1 Item', startTime: 0, endTime: 5 },
      ]);
      const track2 = subtitleService.generateFromScript([
        { id: '2', content: 'Track2 Item', startTime: 5, endTime: 10 },
      ]);

      const merged = subtitleService.mergeTracks([track1, track2]);

      expect(merged.items).toHaveLength(2);
      expect(merged.items[0].text).toBe('Track1 Item');
      expect(merged.items[1].text).toBe('Track2 Item');
      expect(merged.items[0].index).toBe(1);
      expect(merged.items[1].index).toBe(2);
      expect(merged.name).toBe('合并字幕');
    });

    it('should reindex items sequentially', () => {
      const track1 = subtitleService.generateFromScript([
        { id: '1', content: 'A', startTime: 0, endTime: 5 },
        { id: '2', content: 'B', startTime: 5, endTime: 10 },
      ]);
      const track2 = subtitleService.generateFromScript([
        { id: '3', content: 'C', startTime: 10, endTime: 15 },
        { id: '4', content: 'D', startTime: 15, endTime: 20 },
      ]);

      const merged = subtitleService.mergeTracks([track1, track2]);

      expect(merged.items[0].index).toBe(1);
      expect(merged.items[1].index).toBe(2);
      expect(merged.items[2].index).toBe(3);
      expect(merged.items[3].index).toBe(4);
    });
  });

  describe('ASS_STYLE_PRESETS', () => {
    it('should have karaoke preset', () => {
      expect(ASS_STYLE_PRESETS.karaoke).toEqual({
        fontSize: 28,
        fontColor: '#FFFF00',
        outline: 1,
      });
    });

    it('should have cinema preset', () => {
      expect(ASS_STYLE_PRESETS.cinema).toEqual({
        fontSize: 32,
        fontColor: '#FFFFFF',
        backgroundColor: '#80000000',
        outline: 3,
      });
    });

    it('should have minimal preset', () => {
      expect(ASS_STYLE_PRESETS.minimal).toEqual({
        fontSize: 20,
        fontColor: '#FFFFFF',
        outline: 0,
        shadow: 2,
      });
    });
  });
});
