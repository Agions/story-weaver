/**
 * 场景分析 prompt 构造器
 * @module core/services/video/scene-analyzer-prompt-builder
 *
 * 提取自原 SceneAnalyzer 内联 prompt 字面量（角色提取 + 场景描述）。
 */

import { type NovelScene } from '@/shared/types';

import {
  CHARACTER_EXTRACTION_CONTENT_LIMIT,
  SCENE_DESCRIPTION_CONTENT_LIMIT,
} from './scene-analyzer-types';

/** 角色提取 prompt 模板（与原 extractCharacters 内联字符串字节级一致） */
const CHARACTER_EXTRACTION_PROMPT = `
请从以下小说内容中提取所有角色信息。

小说内容（前${CHARACTER_EXTRACTION_CONTENT_LIMIT}字）：
__CONTENT__

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

/** 构造角色提取 prompt */
export function buildCharacterExtractionPrompt(content: string): string {
  return CHARACTER_EXTRACTION_PROMPT.replace(
    '__CONTENT__',
    content.slice(0, CHARACTER_EXTRACTION_CONTENT_LIMIT)
  );
}

/** 场景描述 prompt 模板（与原 generateSceneDescriptions 内联字符串字节级一致） */
const SCENE_DESCRIPTION_PROMPT = `
请为以下小说场景生成详细的图像生成描述。

场景信息：
- 地点：__LOCATION__
- 时间：__TIME__
- 内容：__CONTENT__
- 角色：__CHARACTERS__

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

/** 构造场景描述 prompt */
export function buildSceneDescriptionPrompt(scene: NovelScene): string {
  return SCENE_DESCRIPTION_PROMPT.replace('__LOCATION__', scene.location ?? '未指定')
    .replace('__TIME__', scene.time ?? '未指定')
    .replace('__CONTENT__', scene.content.slice(0, SCENE_DESCRIPTION_CONTENT_LIMIT))
    .replace('__CHARACTERS__', scene.characters.join('、'));
}
