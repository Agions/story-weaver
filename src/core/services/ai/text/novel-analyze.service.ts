/**
 * 小说分析服务
 * 提供小说内容解析、场景分割、角色提取、情感分析等功能
 *
 * 职责：主流程编排 + 元数据提取 + 章节/场景分割
 * 子任务委托给：
 *   - scene-analyzer.service: 角色提取、对话分析、描述生成
 *   - script-analyzer.service: 剧本导出
 *   - novel-helpers: 纯函数工具
 */

import { aiService } from '@/core/services/ai/text/ai.service';
import {
  extractCharacterNames,
  extractLocations,
  extractTimePeriod,
  CHAPTER_PATTERNS,
  ruleBasedSegmentation,
} from '@/core/services/ai/text/novel-helpers';
import { scriptAnalyzer } from '@/core/services/ai/text/script-analyzer.service';
import { sceneAnalyzer } from '@/core/services/video/scene-analyzer.service';
import { logger } from '@/core/utils/logger';
import type {
  NovelMetadata,
  Chapter,
  NovelScene,
  Character,
  AnalyzeConfig,
  AnalyzeResult,
  NovelStatistics,
  EmotionType,
} from '@/shared/types';

/**
 * 并发控制辅助函数
 * 使用 Promise.allSettled 并发执行任务，支持限制并发数
 */
async function concurrentLimit<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T, index: number) => Promise<R>
): Promise<{ results: R[]; errors: Array<{ item: T; error: unknown; index: number }> }> {
  const results: R[] = new Array(items.length);
  const errors: Array<{ item: T; error: unknown; index: number }> = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map((item, batchIndex) => {
      const globalIndex = i + batchIndex;
      return processor(item, globalIndex)
        .then((result) => ({
          success: true as const,
          result,
          index: globalIndex,
          item: undefined as unknown as T,
        }))
        .catch((error) => ({ success: false as const, error, item, index: globalIndex }));
    });

    const batchResults = await Promise.all(batchPromises);

    for (const batchResult of batchResults) {
      if ('error' in batchResult && batchResult.success === false) {
        errors.push({ item: batchResult.item, error: batchResult.error, index: batchResult.index });
      } else if ('result' in batchResult) {
        results[batchResult.index] = batchResult.result;
      }
    }
  }

  return { results, errors };
}

/**
 * 小说分析器
 * 用于解析小说内容并生成结构化数据
 */
class NovelAnalyzer {
  private config: Required<AnalyzeConfig>;

  constructor(config: AnalyzeConfig = {}) {
    this.config = {
      maxChapters: config.maxChapters ?? 50,
      minChapterLength: config.minChapterLength ?? 100,
      sceneMinLength: config.sceneMinLength ?? 200,
      detectCharacters: config.detectCharacters ?? true,
      detectEmotions: config.detectEmotions ?? true,
      generatePrompts: config.generatePrompts ?? true,
      provider: config.provider ?? 'alibaba',
      model: config.model ?? 'qwen-3.5',
    };
  }

  /**
   * 解析小说内容
   * 将原始文本解析为结构化的小说数据
   */
  async parseNovelContent(content: string): Promise<AnalyzeResult> {
    const novelId = `novel_${Date.now()}`;

    // 1. 提取元数据
    const metadata = await this.extractMetadata(content, novelId);

    // 2. 分割章节
    const chapters = await this.segmentChapters(content, novelId, metadata.chapterCount);

    // 3. 分割场景
    const scenes = await this.segmentScenes(chapters);

    // 4. 提取角色（委托给 sceneAnalyzer）
    const characters = await sceneAnalyzer.extractCharacters(content);

    // 5. 提取对话（委托给 sceneAnalyzer）
    for (const scene of scenes) {
      sceneAnalyzer.extractDialogues(scene, characters);
    }

    // 6. 情感分析（通过 emotionDetector）
    // emotionDetector.detectEmotions(scenes);

    // 7. 生成图像提示词（委托给 sceneAnalyzer）
    if (this.config.generatePrompts) {
      await sceneAnalyzer.generateSceneDescriptions(scenes);
    }

    // 8. 计算统计信息
    const statistics = this.calculateStatistics(metadata, chapters, scenes, characters);

    return {
      metadata,
      chapters,
      scenes,
      characters,
      statistics,
    };
  }

  /**
   * 提取小说元数据
   */
  private async extractMetadata(content: string, novelId: string): Promise<NovelMetadata> {
    const prompt = `
请分析以下小说内容，提取元数据信息。

小说内容（前2000字）：
${content.slice(0, 2000)}

请以 JSON 格式返回以下信息：
{
  "title": "小说标题",
  "author": "作者（可选）",
  "genre": "题材类型",
  "summary": "故事概要（100字以内）",
  "wordCount": 总字数,
  "chapterCount": 预估章节数,
  "tags": ["标签1", "标签2"],
  "language": "语言"
}

注意：wordCount 是全文总字数，不是摘要字数。
`;

    try {
      const response = await aiService.generate(prompt, {
        provider: this.config.provider,
        model: this.config.model,
      });

      const data = JSON.parse(response);

      // Validate required fields
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid AI response format');
      }

      return {
        id: novelId,
        title: (data as Partial<NovelMetadata>).title ?? '未命名小说',
        author: data.author,
        genre: data.genre,
        summary: data.summary,
        wordCount: data.wordCount ?? content.length,
        chapterCount: data.chapterCount ?? 1,
        tags: data.tags ?? [],
        language: data.language ?? 'zh',
        createdAt: new Date().toISOString(),
      };
    } catch {
      // 如果 AI 解析失败，返回默认值
      return {
        id: novelId,
        title: '未命名小说',
        wordCount: content.length,
        chapterCount: 1,
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 分割章节
   */
  private async segmentChapters(
    content: string,
    novelId: string,
    estimatedChapterCount: number
  ): Promise<Chapter[]> {
    // 使用 CHAPTER_PATTERNS 检测章节标题
    const chapters: Chapter[] = [];
    let currentPosition = 0;

    // 尝试匹配章节标题
    for (const pattern of CHAPTER_PATTERNS) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        for (let i = 0; i < matches.length && i < this.config.maxChapters; i++) {
          const match = matches[i];
          const start = match.index;
          const title = match[1]?.trim() ?? match[0].trim();

          if (start !== undefined && start > currentPosition) {
            const chapterContent = content.slice(currentPosition, start).trim();
            if (chapterContent.length >= this.config.minChapterLength) {
              chapters.push({
                id: `chapter_${novelId}_${i}`,
                novelId,
                title: title ?? `第${i + 1}章`,
                content: chapterContent,
                order: i,
                wordCount: chapterContent.length,
              });
            }
          }
          if (start !== undefined) {
            currentPosition = start + match[0].length;
          }
        }
        break;
      }
    }

    // 如果没有检测到章节标题，按段落分割
    if (chapters.length === 0) {
      const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 50);
      const chapterSize = Math.ceil(paragraphs.length / estimatedChapterCount);

      for (let i = 0; i < paragraphs.length; i += chapterSize) {
        const chunk = paragraphs.slice(i, i + chapterSize).join('\n\n');
        if (chunk.length >= this.config.minChapterLength) {
          chapters.push({
            id: `chapter_${novelId}_${chapters.length}`,
            novelId,
            title: `第${chapters.length + 1}章`,
            content: chunk,
            order: chapters.length,
            wordCount: chunk.length,
          });
        }
      }
    }

    // 收集章节中的信息
    for (const chapter of chapters) {
      chapter.characters = extractCharacterNames(chapter.content);
      chapter.locations = extractLocations(chapter.content);
      chapter.timePeriod = extractTimePeriod(chapter.content);
    }

    return chapters;
  }

  /**
   * 分割场景
   */
  async segmentScenes(chapters: Chapter[]): Promise<NovelScene[]> {
    const MAX_CONCURRENCY = 3; // 限制同时处理的章节数

    const processChapter = async (chapter: Chapter): Promise<NovelScene[]> => {
      const prompt = `
请将以下小说章节分割为场景。每个场景应该有完整的情节发展。

章节内容：
${chapter.content.slice(0, 3000)}${chapter.content.length > 3000 ? '...' : ''}

请以 JSON 数组格式返回，每个场景包含：
{
  "sceneNumber": 场景序号,
  "title": "场景标题（可选）",
  "content": "场景内容",
  "location": "地点",
  "time": "时间",
  "characters": ["出场角色"]
}

注意：
1. 场景要有明确的时间地点转换
2. 每个场景至少 200 字
3. 返回 JSON 数组格式
`;

      try {
        const response = await aiService.generate(prompt, {
          provider: this.config.provider,
          model: this.config.model,
        });

        const aiScenes = JSON.parse(response);
        const scenes: NovelScene[] = [];

        for (let i = 0; i < aiScenes.length; i++) {
          const sceneData = aiScenes[i];
          const sceneId = `scene_${chapter.id}_${i}`;

          scenes.push({
            id: sceneId,
            chapterId: chapter.id,
            sceneNumber: sceneData.sceneNumber || i + 1,
            title: sceneData.title,
            content: sceneData.content,
            location: sceneData.location,
            time: sceneData.time,
            startPosition: 0,
            endPosition: sceneData.content?.length || 0,
            characters: sceneData.characters ?? [],
            dialogues: [],
            emotions: [],
            tags: [],
          });
        }
        return scenes;
      } catch {
        // AI 解析失败，使用规则分割
        return ruleBasedSegmentation(chapter, this.config.sceneMinLength);
      }
    };

    const { results: allScenesArrays, errors } = await concurrentLimit(
      chapters,
      MAX_CONCURRENCY,
      processChapter
    );

    // 记录错误（可选：可以在调试模式输出）
    if (errors.length > 0) {
      logger.warn(`[NovelAnalyzer] ${errors.length} 个章节处理失败，将使用规则分割`);
    }

    // 合并所有场景
    return allScenesArrays.flat();
  }

  /**
   * 基于规则的场景分割（备用方案）
   */
  private ruleBasedSegmentation(chapter: Chapter): NovelScene[] {
    const scenes: NovelScene[] = [];
    const content = chapter.content;

    // 按段落分割
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());

    let currentSceneContent = '';
    let sceneNumber = 0;

    for (const paragraph of paragraphs) {
      currentSceneContent += paragraph + '\n\n';

      // 根据段落长度和内容判断是否结束场景
      if (
        currentSceneContent.length >= this.config.sceneMinLength &&
        (paragraph.includes('。') || paragraph.includes('！') || paragraph.includes('？'))
      ) {
        sceneNumber++;
        scenes.push({
          id: `scene_${chapter.id}_${sceneNumber}`,
          chapterId: chapter.id,
          sceneNumber,
          content: currentSceneContent.trim(),
          characters: this.extractCharacterNames(currentSceneContent),
          startPosition: 0,
          endPosition: currentSceneContent.length,
          dialogues: [],
          emotions: [],
          tags: [],
        });
        currentSceneContent = '';
      }
    }

    // 处理剩余内容
    if (currentSceneContent.trim()) {
      sceneNumber++;
      scenes.push({
        id: `scene_${chapter.id}_${sceneNumber}`,
        chapterId: chapter.id,
        sceneNumber,
        content: currentSceneContent.trim(),
        characters: this.extractCharacterNames(currentSceneContent),
        startPosition: 0,
        endPosition: currentSceneContent.length,
        dialogues: [],
        emotions: [],
        tags: [],
      });
    }

    return scenes;
  }

  /**
   * 计算统计信息
   */
  private calculateStatistics(
    metadata: NovelMetadata,
    chapters: Chapter[],
    scenes: NovelScene[],
    characters: Character[]
  ): NovelStatistics {
    const emotionCounts = new Map<EmotionType, number>();
    const timePeriods = new Set<string>();
    const locations = new Set<string>();

    let dialogueCount = 0;

    for (const scene of scenes) {
      // 统计情感
      for (const emotion of scene.emotions) {
        emotionCounts.set(emotion.type, (emotionCounts.get(emotion.type) ?? 0) + 1);
      }

      // 收集时间和地点
      if (scene.time) timePeriods.add(scene.time);
      if (scene.location) locations.add(scene.location);

      // 统计对话
      dialogueCount += scene.dialogues.length;
    }

    return {
      totalWords: metadata.wordCount,
      totalChapters: chapters.length,
      totalScenes: scenes.length,
      totalCharacters: characters.length,
      mainCharacters: characters.filter((c) => c.role === 'main').length,
      supportingCharacters: characters.filter((c) => c.role === 'supporting').length,
      minorCharacters: characters.filter((c) => c.role === 'minor').length,
      dialogueCount,
      avgChapterLength:
        chapters.length > 0
          ? chapters.reduce((sum, c) => sum + c.wordCount, 0) / chapters.length
          : 0,
      avgSceneLength:
        scenes.length > 0
          ? scenes.reduce((sum, s) => sum + s.content.length, 0) / scenes.length
          : 0,
      locationCount: locations.size,
      timePeriods: Array.from(timePeriods),
      dominantEmotions: Object.fromEntries(emotionCounts) as Record<EmotionType, number>,
      genre: metadata.genre,
    };
  }

  /**
   * 从文本中提取人名
   */
  private extractCharacterNames(text: string): string[] {
    const names = new Set<string>();

    // 中文名模式
    const cnPattern = /[\u4e00-\u9fa5]{2,4}(?=(说|道|问|答|喊|叫|回答|告诉))/g;
    const cnMatches = text.match(cnPattern) ?? [];
    cnMatches.forEach((n) => names.add(n));

    // 英文名模式
    const enPattern = /[A-Z][a-z]+(?=\s+says|\s+asks|\s+answered)/g;
    const enMatches = text.match(enPattern) ?? [];
    enMatches.forEach((n) => names.add(n));

    return Array.from(names).slice(0, 5);
  }

  /**
   * 导出为剧本格式（委托给 scriptAnalyzer）
   */
  exportToScript(
    result: AnalyzeResult,
    format: 'screenplay' | 'comic' | 'manga' = 'manga'
  ): string {
    return scriptAnalyzer.exportToScript(result, format);
  }
}

// 导出单例
export const novelAnalyzer = new NovelAnalyzer();
export default NovelAnalyzer;
