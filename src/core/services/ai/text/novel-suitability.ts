/**
 * 小说改编适合度打分
 *
 * 从 novel-service.ts 提取的纯函数：无副作用、无外部依赖。
 * 规则：
 *   - 字数 < 5000 减 20，> 100000 减 10
 *   - 角色数 < 2 减 30，> 20 减 15
 *   - 章节数 < 3 减 20
 *   - 没有主角（importance==='main'）减 25
 * 最低 0 分起步。
 *
 * 单一职责：基于规则的客观打分。reasons 记录扣分理由，suggestions
 * 给出改进建议——两条数组按扣分规则严格对应。
 */

import type { NovelParseResult } from './novel-types';

export interface NovelSuitabilityReport {
  score: number;
  reasons: string[];
  suggestions: string[];
}

/**
 * 评估小说适合改编为剧本的程度（0-100 分）
 */
export function analyzeNovelSuitability(novelResult: NovelParseResult): NovelSuitabilityReport {
  const reasons: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // 字数检查
  if (novelResult.totalWords < 5000) {
    score -= 20;
    reasons.push('字数较少，内容可能不够丰富');
    suggestions.push('建议选择 1 万字以上的小说');
  } else if (novelResult.totalWords > 100000) {
    score -= 10;
    reasons.push('字数过多，需要精简处理');
    suggestions.push('建议提取核心章节进行改编');
  }

  // 角色数量检查
  if (novelResult.characters.length < 2) {
    score -= 30;
    reasons.push('角色太少，缺乏互动');
    suggestions.push('建议选择有多角色互动的小说');
  } else if (novelResult.characters.length > 20) {
    score -= 15;
    reasons.push('角色太多，观众难以记忆');
    suggestions.push('建议聚焦主要角色，简化配角');
  }

  // 章节数量检查
  if (novelResult.chapters.length < 3) {
    score -= 20;
    reasons.push('章节太少，故事可能不完整');
  }

  // 主角检查
  const hasMainCharacter = novelResult.characters.some((c) => c.importance === 'main');
  if (!hasMainCharacter) {
    score -= 25;
    reasons.push('缺少明确的主角');
    suggestions.push('建议选择有清晰主角的小说');
  }

  return {
    score: Math.max(0, score),
    reasons,
    suggestions,
  };
}
