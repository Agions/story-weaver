/**
 * 场景分析服务
 * AI 驱动的场景解析、角色提取、对话分析和描述生成
 */

import { aiService } from '@/core/services/ai/text/ai.service';
import {
  extractCharacterNames,
  generateDefaultPrompt,
  DIALOGUE_PATTERNS,
} from '@/core/services/ai/text/novel-helpers';
import { concurrentLimit } from '@/core/utils/concurrency';
import { logger } from '@/core/utils/logger';
import { type NovelScene, type Character, type SceneDescription } from '@/shared/types';

export interface SceneAnalyzerConfig {
  provider?: string;
  model?: string;
}

/**
 * 场景分析器
 * 负责 AI 驱动的场景解析、角色提取、对话分析和描述生成
 */
export class SceneAnalyzer {
  private config: Required<SceneAnalyzerConfig>;

  constructor(config: SceneAnalyzerConfig = {}) {
    this.config = {
      provider: config.provider ?? 'alibaba',
      model: config.model ?? 'qwen-3.5',
    };
  }

  /**
   * 提取角色
   */
  async extractCharacters(content: string): Promise<Character[]> {
    const prompt = `
请从以下小说内容中提取所有角色信息。

小说内容（前5000字）：
${content.slice(0, 5000)}

请以 JSON 数组格式返回角色信息：
[
  {
    "name": "角色名",
    "aliases": ["别名1", "别名2"],
    "description": "角色描述",
    "appearance": "外貌特征",
    "personality": "性格特点",
    "background": "背景故事",
    "role": "main/supporting/minor",
    "importance": 重要性分数(1-10)
  }
]

注意：
1. 主角 importance 为 8-10
2. 配角 importance 为 4-7
3. 龙套 importance 为 1-3
4. 返回 JSON 数组格式
`;

    try {
      const response = await aiService.generate(prompt, {
        provider: this.config.provider,
        model: this.config.model,
      });

      const characters = JSON.parse(response);

      return characters.map((char: Partial<Character>, index: number) => ({
        id: `char_${Date.now()}_${index}`,
        name: char.name ?? '未知角色',
        aliases: char.aliases ?? [],
        description: char.description ?? '',
        appearance: char.appearance ?? '',
        personality: char.personality ?? '',
        background: char.background ?? '',
        role: char.role ?? 'minor',
        importance: char.importance || 1,
        dialogues: [],
        relationships: [],
      }));
    } catch {
      // 提取失败，返回空列表
      return [];
    }
  }

  /**
   * 提取对话
   */
  extractDialogues(scene: NovelScene, characters: Character[]): void {
    const dialogueMap = new Map<string, { content: string; position: number }[]>();

    for (const pattern of DIALOGUE_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(scene.content)) !== null) {
        let characterName = '';
        let dialogueContent = '';

        if (pattern.source.includes('[A-Z]')) {
          characterName = match[1];
          dialogueContent = match[2];
        } else if (/[\u4e00-\u9fa5]{2,4}[：:]/.test(match[0])) {
          characterName = match[1];
          dialogueContent = match[2];
        } else {
          dialogueContent = match[1];
        }

        if (dialogueContent) {
          const key = characterName || 'unknown';
          if (!dialogueMap.has(key)) {
            dialogueMap.set(key, []);
          }
          dialogueMap.get(key)!.push({
            content: dialogueContent.trim(),
            position: match.index,
          });
        }
      }
    }

    // 转换为 Dialogue 对象
    scene.dialogues = [];
    for (const [character, dialogues] of dialogueMap) {
      for (const dialog of dialogues) {
        const matchedCharacter = characters.find(
          (c) => c.name === character || c.aliases?.includes(character)
        );

        scene.dialogues.push({
          id: `dialogue_${scene.id}_${scene.dialogues.length}`,
          sceneId: scene.id,
          character: matchedCharacter?.name ?? character,
          content: dialog.content,
          position: dialog.position,
        });

        if (matchedCharacter) {
          matchedCharacter.dialogues ??= [];
          matchedCharacter.dialogues.push(dialog.content);
        }
      }
    }

    // 提取旁白
    const dialogueContent = scene.dialogues.map((d) => d.content).join(' ');
    const paragraphs = scene.content.split(/\n/);
    for (const para of paragraphs) {
      if (para.trim() && !dialogueContent.includes(para.trim())) {
        if (para.length > 20 && !/^[「『""]/.test(para)) {
          scene.narrator = (scene.narrator ?? '') + para;
        }
      }
    }
  }

  /**
   * 生成场景描述
   */
  async generateSceneDescriptions(scenes: NovelScene[]): Promise<SceneDescription[]> {
    const MAX_CONCURRENCY = 5;

    const processScene = async (scene: NovelScene): Promise<SceneDescription> => {
      const prompt = `
请为以下小说场景生成详细的图像生成描述。

场景信息：
- 地点：${scene.location ?? '未指定'}
- 时间：${scene.time ?? '未指定'}
- 内容：${scene.content.slice(0, 500)}
- 角色：${scene.characters.join('、')}

请返回以下 JSON 格式：
{
  "description": "场景视觉描述",
  "visualElements": [
    {
      "type": "character/object/background/effect",
      "name": "元素名称",
      "description": "元素描述",
      "attributes": { "颜色": "描述", "动作": "描述" }
    }
  ],
  "mood": "氛围描述",
  "colorPalette": ["颜色1", "颜色2"],
  "lighting": "光线描述",
  "cameraAngle": "镜头角度",
  "imagePrompt": "AI 图像生成提示词（英文）",
  "negativePrompt": "负面提示词（英文）"
}

注意：
1. imagePrompt 应适合 AI 图像生成
2. 使用英文描述以便 AI 理解
3. 保持画面简洁，避免过多元素
`;

      try {
        const response = await aiService.generate(prompt, {
          provider: this.config.provider,
          model: this.config.model,
        });

        const data = JSON.parse(response);

        return {
          sceneId: scene.id,
          description: data.description ?? '',
          visualElements: data.visualElements ?? [],
          mood: data.mood ?? '',
          colorPalette: data.colorPalette,
          lighting: data.lighting,
          cameraAngle: data.cameraAngle,
          imagePrompt: data.imagePrompt ?? generateDefaultPrompt(scene),
          negativePrompt: data.negativePrompt ?? 'low quality, blurry, distorted',
        };
      } catch {
        return {
          sceneId: scene.id,
          description: scene.content.slice(0, 100),
          visualElements: [],
          mood: '',
          imagePrompt: generateDefaultPrompt(scene),
          negativePrompt: 'low quality, blurry, distorted',
        };
      }
    };

    const { results, errors } = await concurrentLimit(scenes, MAX_CONCURRENCY, processScene);

    if (errors.length > 0) {
      logger.warn(`[SceneAnalyzer] ${errors.length} 个场景描述生成失败`);
    }

    return results;
  }

  /**
   * 提取对话（静态版本，供外部调用）
   */
  static extractDialoguesStatic(scene: NovelScene, characters: Character[]): void {
    const instance = new SceneAnalyzer();
    instance.extractDialogues(scene, characters);
  }
}

// 导出单例
export const sceneAnalyzer = new SceneAnalyzer();
