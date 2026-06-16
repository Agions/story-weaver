/**
 * 角色约束 → KeyframePipeline 输入映射
 * ====================================
 * 两处完全一样的 .map(c => ({ characterId, name, referencePrompt, referenceImageUrls: { front, side, fullBody } }))
 * 抽到独立函数复用。
 *
 * 输入是 StoryboardPipeline 流出的 characterConstraints 数组
 * 输出是 KeyframePipeline.process + visualConsistencyScorer.evaluate 共用的格式
 */
import type { StoryboardGenerationResult } from '../steps/step2-storyboard/StoryboardPipeline';

/**
 * 把 characterConstraints (可能为 undefined) 转成 pipeline 共享的"角色参考"格式。
 * 自动剥离 imageUrls 多余字段。
 */
export function mapCharacterConstraintsToReferences(
  constraints: StoryboardGenerationResult['characterConstraints'] | undefined
): Array<{
  characterId: string;
  name: string;
  referencePrompt: string;
  referenceImageUrls?: {
    front?: string;
    side?: string;
    fullBody?: string;
  };
}> {
  return (constraints ?? []).map((c) => ({
    characterId: c.characterId,
    name: c.name,
    referencePrompt: c.referencePrompt,
    referenceImageUrls: c.referenceImageUrls
      ? {
          front: c.referenceImageUrls.front,
          side: c.referenceImageUrls.side,
          fullBody: c.referenceImageUrls.fullBody,
        }
      : undefined,
  }));
}
