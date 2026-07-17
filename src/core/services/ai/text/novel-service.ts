/**
 * Novel Service 门面
 *
 * 把原 512 行单文件拆为 5 个子模块：
 *   - novel-types.ts              5 个 interface + Script 别名
 *   - novel-prompt-templates.ts   3 个 prompt 模板 + truncateContent 工具
 *   - novel-ai-parser.ts          callAiAndParseJson 共享 AI+JSON 层
 *   - novel-suitability.ts        analyzeNovelSuitability 纯函数打分
 *   - novel-script-exporter.ts    exportScript + generateScriptText +
 *                                 generatePanelPrompt + 镜头/角度映射
 *
 * 本文件作为对外门面：
 *   - 类 NovelService 暴露 5 个原方法（parseNovel / convertToScenes /
 *     generateScript / generateStoryboard / analyzeNovelSuitability /
 *     exportScript）
 *   - 顶层 export 单例 novelService + 类型 re-export 保持兼容
 *
 * 业务行为完全不变：prompt 文案、JSON 失败消息、并发限制 3、cost 记录
 * 2000/1000 token、shotType/angle 映射表、export 错误消息均 1:1 保留。
 */

import { costService } from '@/core/services/project/cost-service';
import { concurrentLimit } from '@/core/utils/concurrency';
import { logger } from '@/core/utils/logger';

import { callAiAndParseJson } from './novel-ai-parser';
import {
  buildParsePrompt,
  buildConvertPrompt,
  buildStoryboardPrompt,
} from './novel-prompt-templates';
import { exportScript, generatePanelPrompt } from './novel-script-exporter';
import { analyzeNovelSuitability } from './novel-suitability';
import type {
  NovelChapter,
  NovelParseResult,
  NovelScript,
  ScriptScene,
  Storyboard,
} from './novel-types';

// 类型 re-export（外部 import 路径完全不变）
export type {
  NovelChapter,
  ScriptScene,
  NovelScript,
  NovelParseResult,
  Storyboard,
} from './novel-types';

/** 默认 provider / model（与原代码默认值保持一致） */
const DEFAULT_PROVIDER = 'alibaba';
const DEFAULT_MODEL = 'qwen-3.5';

/** generateScript 并发上限 */
const MAX_CHAPTER_CONCURRENCY = 3;

class NovelService {
  /**
   * 解析小说
   */
  async parseNovel(
    content: string,
    options: { maxChapters?: number; provider?: string; model?: string } = {}
  ): Promise<NovelParseResult> {
    const { maxChapters = 50, provider = DEFAULT_PROVIDER, model = DEFAULT_MODEL } = options;
    const prompt = buildParsePrompt(content, maxChapters);
    return callAiAndParseJson<NovelParseResult>(
      prompt,
      { provider, model },
      '小说解析失败：AI 返回格式错误'
    );
  }

  /**
   * 将小说章节转换为剧本场景
   */
  async convertToScenes(
    chapter: NovelChapter,
    characters: string[],
    options: { scenesPerChapter?: number; provider?: string; model?: string } = {}
  ): Promise<ScriptScene[]> {
    const { scenesPerChapter = 3, provider = DEFAULT_PROVIDER, model = DEFAULT_MODEL } = options;
    const prompt = buildConvertPrompt(chapter, characters, scenesPerChapter);

    const rawScenes = await callAiAndParseJson<unknown[]>(
      prompt,
      { provider, model },
      '场景转换失败：AI 返回格式错误'
    );

    return rawScenes.map((scene: unknown, index: number) => {
      if (typeof scene === 'object' && scene !== null) {
        return {
          id: `scene_${chapter.id}_${index}`,
          chapterId: chapter.id,
          ...(scene as Record<string, unknown>),
        } as ScriptScene;
      }
      // AI 返回非对象时降级为空骨架
      return {
        id: `scene_${chapter.id}_${index}`,
        chapterId: chapter.id,
        sceneNumber: index + 1,
        location: '',
        time: '',
        characters: [],
        action: '',
        dialogue: [],
        description: '',
        duration: 0,
      } as ScriptScene;
    });
  }

  /**
   * 生成完整剧本（并发调 convertToScenes + 汇总 + 记成本）
   */
  async generateScript(
    novelResult: NovelParseResult,
    options: {
      chaptersToUse?: number;
      scenesPerChapter?: number;
      provider?: string;
      model?: string;
    } = {}
  ): Promise<NovelScript> {
    const {
      chaptersToUse = 5,
      scenesPerChapter = 3,
      provider = DEFAULT_PROVIDER,
      model = DEFAULT_MODEL,
    } = options;

    const characterNames = novelResult.characters.map((c) => c.name);
    const selectedChapters = novelResult.chapters.slice(0, chaptersToUse);

    const processChapter = (chapter: NovelChapter): Promise<ScriptScene[]> =>
      this.convertToScenes(chapter, characterNames, {
        scenesPerChapter,
        provider,
        model,
      });

    const { results: allScenesArrays, errors } = await concurrentLimit(
      selectedChapters,
      MAX_CHAPTER_CONCURRENCY,
      processChapter
    );

    if (errors.length > 0) {
      logger.warn(`[NovelService] ${errors.length} 个章节转换失败`);
    }

    const allScenes: ScriptScene[] = allScenesArrays.flat();
    const totalDuration = allScenes.reduce((sum, s) => sum + s.duration, 0);

    const script: NovelScript = {
      id: `script_${Date.now()}`,
      title: `${novelResult.title} (改编)`,
      source: 'novel',
      novelId: novelResult.title,
      totalScenes: allScenes.length,
      totalDuration,
      characters: characterNames,
      scenes: allScenes,
      createdAt: new Date().toISOString(),
    };

    costService.recordLLMCost(provider, model, 2000 * chaptersToUse, 1000 * chaptersToUse, {
      operation: 'novel_to_script',
      chapters: chaptersToUse,
    });

    return script;
  }

  /**
   * 生成场景分镜
   */
  async generateStoryboard(
    scene: ScriptScene,
    options: { panelsPerScene?: number; provider?: string; model?: string } = {}
  ): Promise<Storyboard[]> {
    const { panelsPerScene = 3, provider = DEFAULT_PROVIDER, model = DEFAULT_MODEL } = options;
    const prompt = buildStoryboardPrompt(scene, panelsPerScene);

    const panels = await callAiAndParseJson<unknown[]>(
      prompt,
      { provider, model },
      '分镜生成失败：AI 返回格式错误'
    );

    return panels.map((panel: unknown, index: number) => {
      const panelObj =
        typeof panel === 'object' && panel !== null ? (panel as Record<string, unknown>) : {};
      return {
        id: `storyboard_${scene.id}_${index}`,
        sceneId: scene.id,
        ...panelObj,
        prompt: generatePanelPrompt(panel, scene),
      } as Storyboard;
    });
  }

  /** 分析小说适合度（委托给 novel-suitability 纯函数） */
  analyzeNovelSuitability(novelResult: NovelParseResult) {
    return analyzeNovelSuitability(novelResult);
  }

  /** 导出剧本（委托给 novel-script-exporter） */
  exportScript(script: NovelScript, format: 'json' | 'pdf' | 'docx'): string {
    return exportScript(script, format);
  }
}

// 单例
export const novelService = new NovelService();
export default NovelService;
