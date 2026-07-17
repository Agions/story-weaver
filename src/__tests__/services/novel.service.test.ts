/**
 * 小说拆解服务测试
 */

import { aiService } from '@/core/services/ai/text/ai-service';
import { costService } from '@/core/services/project/cost-service';
import { novelService } from '@/core/services/ai/text/novel-service';
import type {
  NovelChapter,
  NovelParseResult,
  ScriptScene,
  Script,
  Storyboard,
} from '@/core/services/ai/text/novel-service';

// Mock AI 服务
jest.mock('@/core/services/ai/text/ai-service', () => ({
  aiService: {
    generate: jest.fn(),
    setMockMode: jest.fn(),
    isMockMode: jest.fn(),
  },
}));

// Mock 成本服务
jest.mock('@/core/services/project/cost-service', () => ({
  costService: {
    recordLLMCost: jest.fn(),
  },
}));

describe('NovelService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 启用 Mock 模式
    (aiService.setMockMode as jest.Mock).mockImplementation(() => {});
    (aiService.isMockMode as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseNovel', () => {
    const mockNovelContent = `
第一章：相遇
林雨晴在图书馆遇到了王思远。
第二章：相知
他们成为了好朋友。
第三章：分离
命运让他们不得不分开。
    `.trim();

    const mockParseResult: NovelParseResult = {
      title: '青春物语',
      author: '测试作者',
      summary: '一个关于青春和友谊的故事',
      characters: [
        {
          name: '林雨晴',
          description: '善良温柔的女主角',
          importance: 'main',
        },
        {
          name: '王思远',
          description: '阳光开朗的男主角',
          importance: 'main',
        },
      ],
      chapters: [
        {
          id: 'ch1',
          title: '第一章：相遇',
          content: '林雨晴在图书馆遇到了王思远。',
          wordCount: 100,
          order: 1,
        },
        {
          id: 'ch2',
          title: '第二章：相知',
          content: '他们成为了好朋友。',
          wordCount: 80,
          order: 2,
        },
        {
          id: 'ch3',
          title: '第三章：分离',
          content: '命运让他们不得不分开。',
          wordCount: 90,
          order: 3,
        },
      ],
      totalWords: 270,
    };

    it('应该成功解析小说内容', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockParseResult));

      const result = await novelService.parseNovel(mockNovelContent);

      expect(result).toEqual(mockParseResult);
      expect(aiService.generate).toHaveBeenCalledTimes(1);
      expect(aiService.generate).toHaveBeenCalledWith(
        expect.stringContaining('请解析以下小说内容'),
        expect.objectContaining({
          provider: 'alibaba',
          model: 'qwen-3.5',
        })
      );
    });

    it('应该使用自定义选项', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockParseResult));

      await novelService.parseNovel(mockNovelContent, {
        maxChapters: 10,
        provider: 'openai',
        model: 'gpt-4',
      });

      expect(aiService.generate).toHaveBeenCalledWith(
        expect.stringContaining('最多提取 10 个章节'),
        expect.objectContaining({
          provider: 'openai',
          model: 'gpt-4',
        })
      );
    });

    it('应该处理长文本内容（截断）', async () => {
      const longContent = 'a'.repeat(20000);
      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockParseResult));

      await novelService.parseNovel(longContent);

      const callArgs = (aiService.generate as jest.Mock).mock.calls[0][0];
      // 验证提示词包含截断标记
      expect(callArgs).toContain('...');
      // 验证长度被限制
      expect(callArgs.length).toBeLessThan(longContent.length);
    });

    it('应该在 AI 返回格式错误时抛出异常', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce('Invalid JSON response');

      await expect(novelService.parseNovel(mockNovelContent)).rejects.toThrow(
        '小说解析失败：AI 返回格式错误'
      );
    });

    it('应该在 AI 服务失败时抛出异常', async () => {
      (aiService.generate as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      await expect(novelService.parseNovel(mockNovelContent)).rejects.toThrow('API Error');
    });
  });

  describe('convertToScenes', () => {
    const mockChapter: NovelChapter = {
      id: 'ch1',
      title: '第一章：相遇',
      content: '林雨晴在图书馆遇到了王思远。两人一见如故，开始了愉快的交谈。',
      wordCount: 100,
      order: 1,
    };

    const mockScenes = [
      {
        sceneNumber: 1,
        location: '大学图书馆',
        time: '下午',
        characters: ['林雨晴', '王思远'],
        action: '林雨晴正在看书，王思远走过来',
        dialogue: [
          {
            character: '王思远',
            text: '你好，我可以坐这里吗？',
            emotion: '平静',
          },
          {
            character: '林雨晴',
            text: '当然可以。',
            emotion: '友好',
          },
        ],
        description: '阳光透过窗户洒在书桌上',
        duration: 45,
      },
    ];

    it('应该成功将章节转换为场景', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockScenes));

      const result = await novelService.convertToScenes(mockChapter, ['林雨晴', '王思远']);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: expect.stringContaining('scene_ch1_'),
        chapterId: 'ch1',
        sceneNumber: 1,
        location: '大学图书馆',
      });
      expect(aiService.generate).toHaveBeenCalledTimes(1);
    });

    it('应该使用自定义场景数量', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([mockScenes[0], mockScenes[0], mockScenes[0]])
      );

      await novelService.convertToScenes(mockChapter, ['林雨晴', '王思远'], {
        scenesPerChapter: 5,
      });

      expect(aiService.generate).toHaveBeenCalledWith(
        expect.stringContaining('转换为 5 个剧本场景'),
        expect.anything()
      );
    });

    it('应该处理长章节内容（截断）', async () => {
      const longChapter: NovelChapter = {
        ...mockChapter,
        content: 'a'.repeat(10000),
      };

      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockScenes));

      await novelService.convertToScenes(longChapter, ['林雨晴']);

      const callArgs = (aiService.generate as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain('...');
    });

    it('应该在 AI 返回格式错误时抛出异常', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce('Invalid JSON');

      await expect(novelService.convertToScenes(mockChapter, ['林雨晴'])).rejects.toThrow(
        '场景转换失败：AI 返回格式错误'
      );
    });

    it('应该处理空场景数据', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([null, undefined, {}])
      );

      const result = await novelService.convertToScenes(mockChapter, ['林雨晴']);

      expect(result).toHaveLength(3);
      // 验证默认值被正确设置
      result.forEach((scene, index) => {
        expect(scene).toMatchObject({
          id: `scene_${mockChapter.id}_${index}`,
          chapterId: mockChapter.id,
        });
      });
    });
  });

  describe('generateScript', () => {
    const mockNovelResult: NovelParseResult = {
      title: '青春物语',
      author: '测试作者',
      summary: '一个关于青春的故事',
      characters: [
        {
          name: '林雨晴',
          description: '女主角',
          importance: 'main',
        },
        {
          name: '王思远',
          description: '男主角',
          importance: 'main',
        },
      ],
      chapters: [
        {
          id: 'ch1',
          title: '第一章',
          content: '内容1',
          wordCount: 100,
          order: 1,
        },
        {
          id: 'ch2',
          title: '第二章',
          content: '内容2',
          wordCount: 100,
          order: 2,
        },
        {
          id: 'ch3',
          title: '第三章',
          content: '内容3',
          wordCount: 100,
          order: 3,
        },
      ],
      totalWords: 300,
    };

    const mockScene: ScriptScene = {
      id: 'scene1',
      chapterId: 'ch1',
      sceneNumber: 1,
      location: '图书馆',
      time: '下午',
      characters: ['林雨晴', '王思远'],
      action: '相遇',
      dialogue: [],
      description: '初次见面',
      duration: 30,
    };

    it('应该成功生成完整剧本', async () => {
      (aiService.generate as jest.Mock).mockResolvedValue(JSON.stringify([mockScene]));

      const result = await novelService.generateScript(mockNovelResult);

      expect(result).toMatchObject({
        id: expect.stringContaining('script_'),
        title: '青春物语 (改编)',
        source: 'novel',
        novelId: '青春物语',
        totalScenes: expect.any(Number),
        totalDuration: expect.any(Number),
        characters: ['林雨晴', '王思远'],
        scenes: expect.any(Array),
        createdAt: expect.any(String),
      });
    });

    it('应该使用指定数量的章节', async () => {
      (aiService.generate as jest.Mock).mockResolvedValue(JSON.stringify([mockScene]));

      await novelService.generateScript(mockNovelResult, {
        chaptersToUse: 2,
      });

      // 验证只调用了2次（对应2个章节）
      expect(aiService.generate).toHaveBeenCalledTimes(2);
    });

    it('应该正确计算总时长', async () => {
      const sceneWithDuration = { ...mockScene, duration: 60 };
      (aiService.generate as jest.Mock).mockResolvedValue(JSON.stringify([sceneWithDuration]));

      const result = await novelService.generateScript(mockNovelResult, {
        chaptersToUse: 2,
        scenesPerChapter: 1,
      });

      // 2个章节，每个1个场景，每个场景60秒 = 120秒
      expect(result.totalDuration).toBe(120);
    });

    it('应该记录成本', async () => {
      (aiService.generate as jest.Mock).mockResolvedValue(JSON.stringify([mockScene]));

      await novelService.generateScript(mockNovelResult, {
        chaptersToUse: 3,
        provider: 'openai',
        model: 'gpt-4',
      });

      expect(costService.recordLLMCost).toHaveBeenCalledWith(
        'openai',
        'gpt-4',
        6000, // 2000 * 3
        3000, // 1000 * 3
        { operation: 'novel_to_script', chapters: 3 }
      );
    });

    it('应该传递所有选项到 convertToScenes', async () => {
      (aiService.generate as jest.Mock).mockResolvedValue(JSON.stringify([mockScene]));

      await novelService.generateScript(mockNovelResult, {
        chaptersToUse: 1,
        scenesPerChapter: 5,
        provider: 'anthropic',
        model: 'claude-3',
      });

      expect(aiService.generate).toHaveBeenCalledWith(
        expect.stringContaining('转换为 5 个剧本场景'),
        expect.objectContaining({
          provider: 'anthropic',
          model: 'claude-3',
        })
      );
    });
  });

  describe('generateStoryboard', () => {
    const mockScene: ScriptScene = {
      id: 'scene1',
      chapterId: 'ch1',
      sceneNumber: 1,
      location: '图书馆',
      time: '下午',
      characters: ['林雨晴', '王思远'],
      action: '两人相遇并开始交谈',
      dialogue: [
        { character: '王思远', text: '你好', emotion: '友好' },
        { character: '林雨晴', text: '你好', emotion: '害羞' },
      ],
      description: '温馨的图书馆场景',
      duration: 60,
    };

    const mockStoryboards = [
      {
        panelNumber: 1,
        shotType: 'wide',
        angle: 'eye_level',
        movement: 'static',
        description: '图书馆全景',
        characters: ['林雨晴', '王思远'],
        background: '书架和窗户',
        lighting: '柔和的自然光',
        mood: '温暖',
        duration: 20,
      },
    ];

    it('应该成功生成分镜', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockStoryboards));

      const result = await novelService.generateStoryboard(mockScene);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: expect.stringContaining('storyboard_scene1_'),
        sceneId: 'scene1',
        panelNumber: 1,
        shotType: 'wide',
        angle: 'eye_level',
        prompt: expect.any(String),
      });
    });

    it('应该生成正确的提示词', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockStoryboards));

      const result = await novelService.generateStoryboard(mockScene);

      expect(result[0].prompt).toContain('全景');
      expect(result[0].prompt).toContain('平视');
      expect(result[0].prompt).toContain('图书馆全景');
      expect(result[0].prompt).toContain('林雨晴、王思远');
      expect(result[0].prompt).toContain('漫画风格');
    });

    it('应该使用自定义分镜数量', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([mockStoryboards[0], mockStoryboards[0]])
      );

      await novelService.generateStoryboard(mockScene, {
        panelsPerScene: 5,
      });

      expect(aiService.generate).toHaveBeenCalledWith(
        expect.stringContaining('生成 5 个分镜'),
        expect.anything()
      );
    });

    it('应该在 AI 返回格式错误时抛出异常', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce('Invalid JSON');

      await expect(novelService.generateStoryboard(mockScene)).rejects.toThrow(
        '分镜生成失败：AI 返回格式错误'
      );
    });

    it('应该处理所有镜头类型和角度', async () => {
      const allTypes = [
        {
          panelNumber: 1,
          shotType: 'medium',
          angle: 'high',
          movement: 'pan',
          description: '测试',
          characters: [],
          background: '',
          lighting: '',
          mood: '',
          duration: 10,
        },
      ];

      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(allTypes));

      const result = await novelService.generateStoryboard(mockScene);

      expect(result[0].prompt).toContain('中景');
      expect(result[0].prompt).toContain('俯视');
    });

    it('应该处理未知的镜头类型和角度（fallback）', async () => {
      const unknownTypes = [
        {
          panelNumber: 1,
          shotType: 'unknown_shot',
          angle: 'unknown_angle',
          movement: 'static',
          description: '未知类型测试',
          characters: ['角色A'],
          background: '背景',
          lighting: '光线',
          mood: '氛围',
          duration: 10,
        },
      ];

      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(unknownTypes));

      const result = await novelService.generateStoryboard(mockScene);

      // 应该使用原始值而不是映射值
      expect(result[0].prompt).toContain('unknown_shot');
      expect(result[0].prompt).toContain('unknown_angle');
    });

    it('应该处理空对象和缺失字段', async () => {
      const emptyPanel = [
        {
          panelNumber: 1,
          // 大部分字段缺失
        },
      ];

      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(emptyPanel));

      const result = await novelService.generateStoryboard(mockScene);

      // 应该不会崩溃，并生成默认提示词
      expect(result[0].prompt).toBeDefined();
      expect(result[0].prompt).toContain('漫画风格');
    });

    it('应该处理非数组的 characters 字段', async () => {
      const invalidCharacters = [
        {
          panelNumber: 1,
          shotType: 'wide',
          angle: 'eye_level',
          characters: 'invalid', // 不是数组
          description: '测试',
          background: '',
          lighting: '',
          mood: '',
          duration: 10,
        },
      ];

      (aiService.generate as jest.Mock).mockResolvedValueOnce(JSON.stringify(invalidCharacters));

      const result = await novelService.generateStoryboard(mockScene);

      // 应该处理为空字符串
      expect(result[0].prompt).not.toContain('invalid');
    });
  });

  describe('analyzeNovelSuitability', () => {
    it('应该给高质量小说高分', () => {
      const goodNovel: NovelParseResult = {
        title: '优质小说',
        author: '作者',
        summary: '很好的故事',
        characters: [
          { name: '主角1', description: '描述', importance: 'main' },
          { name: '主角2', description: '描述', importance: 'main' },
          { name: '配角1', description: '描述', importance: 'supporting' },
        ],
        chapters: [
          { id: '1', title: '章节1', content: '内容', wordCount: 1000, order: 1 },
          { id: '2', title: '章节2', content: '内容', wordCount: 1000, order: 2 },
          { id: '3', title: '章节3', content: '内容', wordCount: 1000, order: 3 },
        ],
        totalWords: 30000,
      };

      const result = novelService.analyzeNovelSuitability(goodNovel);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.reasons).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('应该检测字数过少', () => {
      const shortNovel: NovelParseResult = {
        title: '短篇',
        summary: '',
        characters: [{ name: '主角', description: '', importance: 'main' }],
        chapters: [{ id: '1', title: '章节', content: '', wordCount: 1000, order: 1 }],
        totalWords: 3000,
      };

      const result = novelService.analyzeNovelSuitability(shortNovel);

      expect(result.score).toBeLessThan(100);
      expect(result.reasons).toContain('字数较少，内容可能不够丰富');
      expect(result.suggestions).toContain('建议选择 1 万字以上的小说');
    });

    it('应该检测字数过多', () => {
      const longNovel: NovelParseResult = {
        title: '长篇',
        summary: '',
        characters: [{ name: '主角', description: '', importance: 'main' }],
        chapters: [{ id: '1', title: '章节', content: '', wordCount: 50000, order: 1 }],
        totalWords: 150000,
      };

      const result = novelService.analyzeNovelSuitability(longNovel);

      expect(result.score).toBeLessThan(100);
      expect(result.reasons).toContain('字数过多，需要精简处理');
      expect(result.suggestions).toContain('建议提取核心章节进行改编');
    });

    it('应该检测角色太少', () => {
      const fewCharacters: NovelParseResult = {
        title: '单人剧',
        summary: '',
        characters: [{ name: '唯一', description: '', importance: 'main' }],
        chapters: [{ id: '1', title: '章节', content: '', wordCount: 5000, order: 1 }],
        totalWords: 15000,
      };

      const result = novelService.analyzeNovelSuitability(fewCharacters);

      expect(result.score).toBeLessThan(100);
      expect(result.reasons).toContain('角色太少，缺乏互动');
      expect(result.suggestions).toContain('建议选择有多角色互动的小说');
    });

    it('应该检测角色太多', () => {
      const manyCharacters: NovelParseResult = {
        title: '多人剧',
        summary: '',
        characters: Array.from({ length: 25 }, (_, i) => ({
          name: `角色${i}`,
          description: '',
          importance: 'minor' as const,
        })),
        chapters: [{ id: '1', title: '章节', content: '', wordCount: 5000, order: 1 }],
        totalWords: 15000,
      };

      const result = novelService.analyzeNovelSuitability(manyCharacters);

      expect(result.score).toBeLessThan(100);
      expect(result.reasons).toContain('角色太多，观众难以记忆');
      expect(result.suggestions).toContain('建议聚焦主要角色，简化配角');
    });

    it('应该检测章节太少', () => {
      const fewChapters: NovelParseResult = {
        title: '短篇',
        summary: '',
        characters: [
          { name: '主角', description: '', importance: 'main' },
          { name: '配角', description: '', importance: 'supporting' },
        ],
        chapters: [
          { id: '1', title: '章节1', content: '', wordCount: 5000, order: 1 },
          { id: '2', title: '章节2', content: '', wordCount: 5000, order: 2 },
        ],
        totalWords: 10000,
      };

      const result = novelService.analyzeNovelSuitability(fewChapters);

      expect(result.score).toBeLessThan(100);
      expect(result.reasons).toContain('章节太少，故事可能不完整');
    });

    it('应该检测缺少主角', () => {
      const noMainCharacter: NovelParseResult = {
        title: '群像剧',
        summary: '',
        characters: [
          { name: '配角1', description: '', importance: 'supporting' },
          { name: '配角2', description: '', importance: 'supporting' },
        ],
        chapters: [
          { id: '1', title: '章节', content: '', wordCount: 5000, order: 1 },
          { id: '2', title: '章节', content: '', wordCount: 5000, order: 2 },
          { id: '3', title: '章节', content: '', wordCount: 5000, order: 3 },
        ],
        totalWords: 15000,
      };

      const result = novelService.analyzeNovelSuitability(noMainCharacter);

      expect(result.score).toBeLessThan(100);
      expect(result.reasons).toContain('缺少明确的主角');
      expect(result.suggestions).toContain('建议选择有清晰主角的小说');
    });

    it('应该确保分数不低于0', () => {
      const badNovel: NovelParseResult = {
        title: '问题小说',
        summary: '',
        characters: [], // 没有角色
        chapters: [{ id: '1', title: '章节', content: '', wordCount: 500, order: 1 }], // 字数太少，章节太少
        totalWords: 500,
      };

      const result = novelService.analyzeNovelSuitability(badNovel);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('exportScript', () => {
    const mockScript: Script = {
      id: 'script1',
      title: '测试剧本',
      source: 'novel',
      novelId: 'novel1',
      totalScenes: 2,
      totalDuration: 120,
      characters: ['林雨晴', '王思远'],
      scenes: [
        {
          id: 'scene1',
          chapterId: 'ch1',
          sceneNumber: 1,
          location: '图书馆',
          time: '下午',
          characters: ['林雨晴', '王思远'],
          action: '相遇',
          dialogue: [
            { character: '王思远', text: '你好', emotion: '友好' },
            { character: '林雨晴', text: '你好', emotion: '害羞' },
          ],
          description: '初次见面',
          duration: 60,
        },
        {
          id: 'scene2',
          chapterId: 'ch1',
          sceneNumber: 2,
          location: '咖啡厅',
          time: '傍晚',
          characters: ['林雨晴', '王思远'],
          action: '深入交谈',
          dialogue: [{ character: '林雨晴', text: '很高兴认识你', emotion: '开心' }],
          description: '愉快的交流',
          duration: 60,
        },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    it('应该导出为 JSON 格式', () => {
      const result = novelService.exportScript(mockScript, 'json');

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(mockScript);
    });

    it('应该导出为文本格式（PDF/DOCX）', () => {
      const resultPdf = novelService.exportScript(mockScript, 'pdf');
      const resultDocx = novelService.exportScript(mockScript, 'docx');

      // 验证包含必要信息
      expect(resultPdf).toContain('《测试剧本》');
      expect(resultPdf).toContain('改编剧本');
      expect(resultPdf).toContain('总场景数: 2');
      expect(resultPdf).toContain('预估时长: 2分0秒');
      expect(resultPdf).toContain('角色: 林雨晴、王思远');
      expect(resultPdf).toContain('场景 1');
      expect(resultPdf).toContain('地点: 图书馆');
      expect(resultPdf).toContain('时间: 下午');
      expect(resultPdf).toContain('王思远 (友好): 你好');

      // PDF 和 DOCX 格式应该生成相同的文本
      expect(resultDocx).toEqual(resultPdf);
    });

    it('应该抛出不支持格式的错误', () => {
      expect(() => novelService.exportScript(mockScript, 'unknown' as any)).toThrow('不支持的格式');
    });

    it('应该正确格式化时长', () => {
      const scriptWith125Seconds: Script = {
        ...mockScript,
        totalDuration: 125,
      };

      const result = novelService.exportScript(scriptWith125Seconds, 'pdf');

      expect(result).toContain('预估时长: 2分5秒');
    });

    it('应该处理没有对话的场景', () => {
      const scriptNoDialogue: Script = {
        ...mockScript,
        scenes: [
          {
            ...mockScript.scenes[0],
            dialogue: [],
          },
        ],
      };

      const result = novelService.exportScript(scriptNoDialogue, 'pdf');

      expect(result).toContain('对话:');
      expect(() => novelService.exportScript(scriptNoDialogue, 'pdf')).not.toThrow();
    });
  });

  describe('边缘情况和错误处理', () => {
    it('应该处理空字符串输入', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          title: '未命名',
          chapters: [],
          characters: [],
          totalWords: 0,
        })
      );

      const result = await novelService.parseNovel('');

      expect(result).toBeDefined();
      expect(aiService.generate).toHaveBeenCalled();
    });

    it('应该处理没有章节的小说解析结果', async () => {
      const emptyResult: NovelParseResult = {
        title: '空小说',
        summary: '',
        characters: [],
        chapters: [],
        totalWords: 0,
      };

      (aiService.generate as jest.Mock).mockResolvedValue(JSON.stringify([]));

      const script = await novelService.generateScript(emptyResult);

      expect(script.totalScenes).toBe(0);
      expect(script.totalDuration).toBe(0);
      expect(script.scenes).toEqual([]);
    });

    it('应该处理特殊字符', async () => {
      const specialContent = '特殊字符：\n\t"引号" \'单引号\' <标签> & 和号';

      (aiService.generate as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          title: '特殊字符测试',
          chapters: [],
          characters: [],
          totalWords: 10,
        })
      );

      await expect(novelService.parseNovel(specialContent)).resolves.toBeDefined();
    });
  });

  describe('类型安全性', () => {
    it('NovelChapter 类型应该正确', () => {
      const chapter: NovelChapter = {
        id: 'ch1',
        title: '章节',
        content: '内容',
        wordCount: 100,
        order: 1,
      };

      expect(chapter.id).toBeDefined();
      expect(chapter.title).toBeDefined();
      expect(chapter.content).toBeDefined();
      expect(chapter.wordCount).toBeGreaterThan(0);
      expect(chapter.order).toBeGreaterThan(0);
    });

    it('ScriptScene 类型应该正确', () => {
      const scene: ScriptScene = {
        id: 'scene1',
        chapterId: 'ch1',
        sceneNumber: 1,
        location: '地点',
        time: '时间',
        characters: ['角色1'],
        action: '动作',
        dialogue: [{ character: '角色1', text: '台词', emotion: '情绪' }],
        description: '描述',
        duration: 30,
      };

      expect(scene.dialogue[0]).toHaveProperty('character');
      expect(scene.dialogue[0]).toHaveProperty('text');
      expect(scene.dialogue[0].emotion).toBeDefined();
    });

    it('Storyboard 类型应该正确', () => {
      const storyboard: Storyboard = {
        id: 'sb1',
        sceneId: 'scene1',
        panelNumber: 1,
        shotType: 'wide',
        angle: 'eye_level',
        movement: 'static',
        description: '描述',
        characters: ['角色1'],
        background: '背景',
        lighting: '光线',
        mood: '氛围',
        duration: 10,
        prompt: '提示词',
      };

      expect(storyboard.shotType).toMatch(/wide|medium|close|extreme_close|over_shoulder/);
      expect(storyboard.angle).toMatch(/eye_level|high|low|dutch/);
      expect(storyboard.movement).toMatch(/static|pan|tilt|zoom|track/);
    });
  });
});
