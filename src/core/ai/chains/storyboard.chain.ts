/**
 * 分镜生成 Chain
 * 根据剧本生成故事板
 */

import type { ChatMessage } from '../providers';

export interface StoryboardInput {
  script: string;
  numPanels?: number;
  style?: 'manga' | 'anime' | 'comic' | 'realistic';
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface Panel {
  panelNumber: number;
  description: string;
  visualPrompt: string;
  dialogue?: string;
  cameraAngle?: string;
  duration?: number;
}

export interface StoryboardOutput {
  panels: Panel[];
  totalDuration: string;
  estimatedCost: string;
}

export function buildStoryboardPrompt(input: StoryboardInput): ChatMessage[] {
  const styleDescriptions = {
    manga: '日本漫画风格，清晰的黑白线条，大面积阴影',
    anime: '日本动画风格，柔和的色彩，夸张的表情',
    comic: '美式漫画风格，动态线条，强烈的光影对比',
    realistic: '写实风格，电影级别的光影效果',
  };

  const style = styleDescriptions[input.style || 'manga'];
  const aspectDescriptions = {
    '16:9': '横向宽屏，适合电脑和电视观看',
    '9:16': '纵向竖屏，适合手机短视频',
    '1:1': '方形构图，适合社交媒体',
  };
  const aspect = aspectDescriptions[input.aspectRatio || '16:9'];

  const systemPrompt = `你是一位专业的分镜师，擅长将剧本转化为视觉化的故事板。每个分镜需要包含：
1. 画面描述（用于生成图像）
2. 对白/字幕
3. 镜头角度建议
4. 预估时长`;

  const userPrompt = `根据以下剧本，生成 ${input.numPanels || 8} 个分镜：

剧本：
${input.script}

风格要求：${style}
画面比例：${aspect}

请为每个分镜生成：
- 画面描述（用于 AI 图像生成的 prompt）
- 对白/字幕内容
- 镜头角度
- 预计时长（秒）

以 JSON 格式返回，格式如下：
{
  "panels": [
    {
      "panelNumber": 1,
      "description": "画面描述",
      "visualPrompt": "AI图像生成prompt",
      "dialogue": "对白",
      "cameraAngle": "镜头角度",
      "duration": 5
    }
  ],
  "totalDuration": "总时长",
  "estimatedCost": "预估成本"
}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

export function parseStoryboardResponse(raw: string): StoryboardOutput {
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/^(\{[\s\S]*\})$/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
  } catch (e) {
    // 忽略解析错误
  }
  
  return {
    panels: [],
    totalDuration: '0s',
    estimatedCost: 'unknown',
  };
}
