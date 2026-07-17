/**
 * Character Consistency Feature Slice
 *
 * 角色一致性垂直切片：聚合角色管理 + 视觉一致性评分 + 参考图锚点。
 * 横向引擎（AI Provider / Pipeline）仍留在 core/。
 *
 * @module features/character-consistency
 */

// ========== 类型定义 ==========

import type { Character } from '@/shared/types';

/** 角色 DNA 结构化描述 */
export interface CharacterDNA {
  id: string;
  name: string;
  seed: number;
  role: Character['role'];
  visualKeywords: string[];
  referenceImages: string[];
  consistencyLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 角色一致性评分输入 */
export interface ConsistencyCheckInput {
  characterId: string;
  frameImageUrl: string;
  prompt: string;
}

/** 角色一致性评分结果 */
export interface ConsistencyCheckResult {
  characterId: string;
  score: number; // 0-100
  notes: string[];
  passed: boolean;
  threshold: number;
}

/** 角色模板输入 */
export interface CreateCharacterInput {
  name: string;
  role?: Character['role'];
  visualKeywords?: string[];
  seed?: number;
}

/** 角色模板输出 */
export interface CharacterTemplateOutput {
  templateId: string;
  name: string;
  role: Character['role'];
  visualKeywords: string[];
  thumbnailUrl?: string;
}

// ========== 服务胶水 ==========

import { v4 as uuidv4 } from 'uuid';

import type { VisualConsistencyInput, VisualConsistencyResult } from '@/core/services/video/visual-consistency-types';

import { getCharacterService } from '@/core/services/domain/character-service';
import { createCharacter } from '@/core/services/domain/character-factory';
import {
  buildCharacterFromTemplate,
  listTemplates,
  validateCharacter,
} from '@/core/services/domain/character-template';
import { visualConsistencyScorer } from '@/core/services/video/visual-consistency-scorer-service';

// ========== 角色 DNA 管理 ==========

/**
 * 从核心 CharacterService 获取角色并转换为 CharacterDNA
 */
export function getCharacterDNA(characterId: string): CharacterDNA | null {
  const character = getCharacterService().getById(characterId);
  if (!character) return null;

  return {
    id: character.id,
    name: character.name,
    seed: character.consistency?.seed ?? 0,
    role: character.role ?? 'supporting',
    visualKeywords: character.tags ?? [],
    referenceImages: character.consistency?.referenceImages ?? [],
    consistencyLocked: character.consistency !== undefined,
    createdAt: character.createdAt ?? '',
    updatedAt: character.updatedAt ?? '',
  };
}

/**
 * 锁定角色一致性（冻结 seed，防止生成时漂移）
 */
export function lockCharacterConsistency(characterId: string): void {
  getCharacterService().lockConsistency(characterId, true);
}

/**
 * 解锁角色一致性（允许调整 seed）
 */
export function unlockCharacterConsistency(characterId: string): void {
  getCharacterService().lockConsistency(characterId, false);
}

/**
 * 为角色添加参考图锚点（用于 VLM 一致性评分）
 */
export function addReferenceImage(characterId: string, imageUrl: string): void {
  getCharacterService().updateReferenceImage(characterId, imageUrl);
}

/**
 * 创建新角色（使用工厂函数，确保标准化）
 */
export function createNewCharacter(input: CreateCharacterInput): Character {
  return createCharacter({
    id: uuidv4(),
    name: input.name,
    role: input.role ?? 'supporting',
    appearance: { gender: 'unknown', age: 25 },
    consistency: {
      seed: input.seed ?? Math.floor(Math.random() * 10000),
      referenceImages: [],
    },
    tags: input.visualKeywords ?? [],
  });
}

// ========== 视觉一致性评分（门禁） ==========

/**
 * 对单帧进行角色一致性检查
 * 利用 VisualConsistencyScorer 的 VLM 或 heuristic 评分
 */
export async function checkFrameConsistency(
  input: ConsistencyCheckInput
): Promise<ConsistencyCheckResult> {
  const character = getCharacterDNA(input.characterId);
  if (!character) {
    return {
      characterId: input.characterId,
      score: 0,
      notes: ['角色不存在'],
      passed: false,
      threshold: 70,
    };
  }

  const consistencyInput: VisualConsistencyInput = {
    frameUrls: [input.frameImageUrl],
    characterReferences: [],
    characterDescriptions: {
      [character.name]: character.visualKeywords.join(', '),
    },
  };

  const result: VisualConsistencyResult = await visualConsistencyScorer.evaluate(consistencyInput);

  const score = result.overallScore ?? 0;
  const threshold = character.consistencyLocked ? 80 : 70;

  return {
    characterId: input.characterId,
    score,
    notes: [`模型: ${result.model}, 评估帧数: ${result.framesEvaluated}`],
    passed: score >= threshold,
    threshold,
  };
}

/**
 * 批量检查一组帧的角色一致性
 * 返回每个角色的平均评分
 */
export async function checkBatchConsistency(
  checks: ConsistencyCheckInput[]
): Promise<Map<string, ConsistencyCheckResult>> {
  const results = new Map<string, ConsistencyCheckResult>();

  const settled = await Promise.allSettled(
    checks.map((c) => checkFrameConsistency(c))
  );

  for (let i = 0; i < checks.length; i++) {
    const characterId = checks[i].characterId;
    const result = settled[i];
    if (result.status === 'fulfilled') {
      results.set(characterId, result.value);
    } else {
      results.set(characterId, {
        characterId,
        score: 0,
        notes: ['评分失败: ' + ((result as PromiseRejectedResult).reason as Error).message],
        passed: false,
        threshold: 70,
      });
    }
  }

  return results;
}

// ========== 模板管理 ==========

/**
 * 从模板创建角色（用于快速初始化标准角色）
 */
export function createCharacterFromTemplate(
  templateId: string,
  overrides?: Partial<Character>
): Character | null {
  const templateData = buildCharacterFromTemplate(templateId);
  if (!templateData) return null;

  const base: Character = {
    ...templateData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Character;

  if (overrides) {
    return { ...base, ...overrides, id: overrides.id ?? base.id };
  }

  return base;
}

/**
 * 列出可用角色模板
 */
export function getAvailableTemplates(): CharacterTemplateOutput[] {
  return listTemplates().map((t) => ({
    templateId: t.id,
    name: t.name,
    role: t.category as Character['role'],
    visualKeywords: t.appearance ? [t.appearance.hairColor ?? '', t.appearance.eyeColor ?? ''].filter(Boolean) : [],
    thumbnailUrl: (t as unknown as Record<string, unknown>).thumbnail as string | undefined,
  }));
}

/**
 * 验证角色数据完整性
 */
export function validateCharacterData(character: unknown): boolean {
  const errors = validateCharacter(character as Partial<Character>);
  return errors.length === 0;
}

// ========== 导出 ==========

export const characterConsistencyService = {
  getCharacterDNA,
  lockCharacterConsistency,
  unlockCharacterConsistency,
  addReferenceImage,
  createNewCharacter,
  checkFrameConsistency,
  checkBatchConsistency,
  createCharacterFromTemplate,
  getAvailableTemplates,
  validateCharacterData,
};

export default characterConsistencyService;
