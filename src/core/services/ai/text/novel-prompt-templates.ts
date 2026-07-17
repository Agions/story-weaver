/**
 * Novel Service Prompt 模板集合
 *
 * 把原 novel-service.ts 中 3 个巨型 prompt 模板（parseNovel /
 * convertToScenes / generateStoryboard）集中到这个模块。
 *
 * 拆分理由：
 *   1. 每个 prompt 模板 30+ 行中文模板字符串，与业务流程混在一起
 *      拖慢阅读
 *   2. 模板集中后，UI 层 / 调试工具可以直接 import 用于"展示给用户
 *      当前用的 prompt 长什么样"
 *   3. 模板里共同的"长内容截断"模式被抽成 truncateContent 工具
 */

import type { NovelChapter, ScriptScene } from './novel-types';

/** 默认内容截断长度（解析小说时只看前 10000 字） */
const PARSE_CONTENT_MAX_CHARS = 10000;
/** 转换场景时只看章节前 5000 字 */
const CONVERT_CONTENT_MAX_CHARS = 5000;

/**
 * 把长文本按 N 字截断，超过则末尾追加 '...'。
 * 原代码 3 处都用了 `${content.slice(0, N)}${content.length > N ? '...' : ''}`
 * 重复模式，统一收口。
 */
export function truncateContent(content: string, maxLength: number): string {
  return content.length > maxLength ? `${content.slice(0, maxLength)}...` : content;
}

/**
 * 构建"解析小说"的 prompt
 */
export function buildParsePrompt(content: string, maxChapters: number): string {
  return `
请解析以下小说内容，提取关键信息并以 JSON 格式返回：

小说内容：
${truncateContent(content, PARSE_CONTENT_MAX_CHARS)}

请返回以下格式的 JSON：
{
  "title": "小说标题",
  "author": "作者（如有）",
  "summary": "故事概要（200字以内）",
  "characters": [
    {
      "name": "角色名",
      "description": "角色描述",
      "importance": "main/supporting/minor"
    }
  ],
  "chapters": [
    {
      "title": "章节标题",
      "content": "章节内容摘要",
      "wordCount": 字数,
      "order": 章节序号
    }
  ],
  "totalWords": 总字数
}

注意：
1. 最多提取 ${maxChapters} 个章节
2. 角色按重要性分类：主角(main)、配角(supporting)、龙套(minor)
3. 章节内容只需摘要，不需要全文
4. 确保 JSON 格式正确
`;
}

/**
 * 构建"章节→场景"的 prompt
 */
export function buildConvertPrompt(
  chapter: NovelChapter,
  characters: string[],
  scenesPerChapter: number
): string {
  return `
请将以下小说章节转换为 ${scenesPerChapter} 个剧本场景。

章节标题：${chapter.title}
章节内容：
${truncateContent(chapter.content, CONVERT_CONTENT_MAX_CHARS)}

角色列表：${characters.join('、')}

请返回以下格式的 JSON 数组：
[
  {
    "sceneNumber": 1,
    "location": "场景地点",
    "time": "时间（白天/夜晚/清晨/黄昏）",
    "characters": ["出场角色"],
    "action": "角色动作",
    "dialogue": [
      {
        "character": "说话角色",
        "text": "对话内容",
        "emotion": "情绪（平静/激动/悲伤/开心/愤怒）"
      }
    ],
    "description": "场景描述",
    "duration": 预估秒数
  }
]

注意：
1. 每个场景要有明确的时间地点
2. 对话要符合角色性格
3. 场景之间要有连贯性
4. 总时长控制在 ${scenesPerChapter * 30}-${scenesPerChapter * 60} 秒
5. 确保 JSON 格式正确
`;
}

/**
 * 构建"场景→分镜"的 prompt
 */
export function buildStoryboardPrompt(scene: ScriptScene, panelsPerScene: number): string {
  const dialogueLines = scene.dialogue.map((d) => `${d.character}: ${d.text}`).join('\n');

  return `
请为以下剧本场景生成 ${panelsPerScene} 个分镜。

场景信息：
- 地点：${scene.location}
- 时间：${scene.time}
- 角色：${scene.characters.join('、')}
- 动作：${scene.action}
- 对话：${dialogueLines}
- 描述：${scene.description}

请返回以下格式的 JSON 数组：
[
  {
    "panelNumber": 1,
    "shotType": "镜头类型（wide/medium/close/extreme_close/over_shoulder）",
    "angle": "角度（eye_level/high/low/dutch）",
    "movement": "运动（static/pan/tilt/zoom/track）",
    "description": "画面描述",
    "characters": ["画面中角色"],
    "background": "背景描述",
    "lighting": "光线描述",
    "mood": "氛围情绪",
    "duration": 持续时间秒数
  }
]

注意：
1. 分镜要覆盖场景的关键时刻
2. 镜头类型要多样化
3. 画面要有电影感
4. 确保 JSON 格式正确
`;
}
