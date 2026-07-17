import { getCharacterService } from '@/core/services/domain/character-service';
import { logger } from '@/core/utils/logger';

import { BasePipelineStep } from './base-pipeline-step';
import { PipelineStepId, PipelineStep, StepInput } from './pipeline-types';
import { getContext } from './step-helpers';

export interface CharacterOutput {
  characters: Array<{
    id: string;
    name: string;
    appearance: {
      gender?: string;
      age?: string;
      hairStyle?: string;
      hairColor?: string;
      clothing?: string;
    };
    consistency: {
      seed?: number;
      referenceImages?: string[];
    };
  }>;
  totalCount: number;
}

export class CharacterStep extends BasePipelineStep {
  constructor(config?: Partial<PipelineStep>) {
    super({
      ...config,
      id: config?.id ?? 'step-character',
      name: config?.name ?? '角色设计',
      stepId: config?.stepId ?? PipelineStepId.CHARACTER,
      dependencies: config?.dependencies ?? [PipelineStepId.SCRIPT, PipelineStepId.ANALYSIS],
    });
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = getContext(input)!;
    logger.info(`[CharacterStep] Creating characters for workflow ${input.workflowId}`);

    const estimatedCharacters = context.getVariable<number>('estimatedCharacters') ?? 3;
    const scenes = context.getVariable('scenes') as Array<{ description: string }>;

    this.reportProgress(10, '正在分析角色需求...');

    const characterNames = this.extractCharacterNames(scenes);

    this.reportProgress(30, '正在生成角色...');

    const characters: CharacterOutput['characters'] = [];

    for (let i = 0; i < Math.min(characterNames.length, estimatedCharacters); i++) {
      const name = characterNames[i];

      this.reportProgress(30 + (i * 40) / characterNames.length, `正在生成角色: ${name}`);

      try {
        const character = await getCharacterService().create({
          name,
          description: `角色${i + 1}`,
          appearance: {},
          role: i === 0 ? 'protagonist' : 'supporting',
        });

        const seed = Math.floor(Math.random() * 10000);
        characters.push({
          id: character.id,
          name: character.name,
          appearance: {
            gender: '未知',
            age: '未知',
            hairStyle: '未知',
            hairColor: '未知',
            clothing: '未知',
          },
          consistency: {
            seed,
            referenceImages: [],
          },
        });
      } catch (error) {
        logger.warn(`[CharacterStep] Failed to create character ${name}: ${error}`);
      }
    }

    this.reportProgress(90, '角色生成完成');

    context.setVariable('characters', characters);
    context.setVariable('characterCount', characters.length);

    logger.success(`[CharacterStep] Created ${characters.length} characters`);

    return { characters, totalCount: characters.length };
  }

  protected computeMetrics(result: unknown): Record<string, unknown> {
    return this.computeCountMetric(result, 'characters');
  }

  private extractCharacterNames(scenes: Array<{ description: string }>): string[] {
    const names = new Set<string>();

    for (const scene of scenes ?? []) {
      const matches = scene.description?.match(/[A-Z][a-z]{2,20}/g);
      matches?.forEach((n) => names.add(n));
    }

    if (names.size === 0) {
      names.add('主角');
      names.add('配角');
    }

    return Array.from(names).slice(0, 10);
  }
}

// ========== 工厂函数 ==========

export function createCharacterStep(config?: Partial<PipelineStep>): CharacterStep {
  return new CharacterStep(config);
}

export default CharacterStep;
