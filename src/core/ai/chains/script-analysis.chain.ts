/**
 * 剧本分析 Chain
 * 从小说/剧本中提取关键信息
 */

import type { ChatMessage } from '../providers';

export interface ScriptAnalysisInput {
  content: string;
  type: 'novel' | 'script';
  genre?: string;
}

export interface ScriptAnalysisOutput {
  title: string;
  synopsis: string;
  characters: Array<{
    name: string;
    description: string;
    personality: string;
  }>;
  scenes: Array<{
    description: string;
    location: string;
    timeOfDay: string;
    keyElements: string[];
  }>;
  suggestedDuration: string;
  targetAudience: string;
}

export function buildScriptAnalysisPrompt(input: ScriptAnalysisInput): ChatMessage[] {
  const systemPrompt = `你是一位专业的剧本分析师，擅长从小说或剧本中提取关键信息，生成结构化的故事分析报告。`;
  
  const userPrompt = input.type === 'novel' 
    ? `分析以下小说内容，提取可用于漫剧制作的信息：

${input.content}

请提取：
1. 标题（如果原文没有则生成一个吸引人的标题）
2. 故事梗概（100字以内）
3. 主要角色（名字、性格描述）
4. 场景设定（地点、时间、关键元素）
5. 预估时长
6. 目标受众`
    : `分析以下剧本，提取可用于漫剧制作的信息：

${input.content}

请提取：
1. 标题
2. 故事梗概
3. 主要角色
4. 场景设定
5. 预估时长
6. 目标受众`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

export function parseScriptAnalysisResponse(raw: string): Partial<ScriptAnalysisOutput> {
  // 简单的 JSON 解析，如果模型返回的是 JSON
  try {
    // 尝试匹配 ```json ... ``` 或直接是 JSON
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/^(\{[\s\S]*\})$/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
  } catch (e) {
    // 忽略 JSON 解析错误，尝试其他方式
  }
  
  // 如果不是 JSON，返回原始内容供后续处理
  return { synopsis: raw };
}
