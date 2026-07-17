/**
 * Novel Service 类型定义
 *
 * 从 novel-service.ts 提取的 5 个 interface：
 *   - NovelChapter    小说章节
 *   - ScriptScene     剧本场景
 *   - NovelScript     完整剧本
 *   - NovelParseResult 小说解析结果
 *   - Storyboard      分镜
 */

export interface NovelChapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  order: number;
}

export interface ScriptScene {
  id: string;
  chapterId: string;
  sceneNumber: number;
  location: string;
  time: string;
  characters: string[];
  action: string;
  dialogue: Array<{
    character: string;
    text: string;
    emotion?: string;
  }>;
  description: string;
  duration: number; // 预估秒数
}

export interface NovelScript {
  id: string;
  title: string;
  source: 'novel' | 'original';
  novelId?: string;
  totalScenes: number;
  totalDuration: number;
  characters: string[];
  scenes: ScriptScene[];
  createdAt: string;
}

export interface NovelParseResult {
  title: string;
  author?: string;
  summary: string;
  characters: Array<{
    name: string;
    description: string;
    importance: 'main' | 'supporting' | 'minor';
  }>;
  chapters: NovelChapter[];
  totalWords: number;
}

export interface Storyboard {
  id: string;
  sceneId: string;
  panelNumber: number;
  shotType: 'wide' | 'medium' | 'close' | 'extreme_close' | 'over_shoulder';
  angle: 'eye_level' | 'high' | 'low' | 'dutch';
  movement: 'static' | 'pan' | 'tilt' | 'zoom' | 'track';
  description: string;
  characters: string[];
  background: string;
  lighting: string;
  mood: string;
  duration: number;
  prompt: string; // AI 生成提示词
}
