/**
 * features/character/index.ts
 * Character feature exports - Character design and management
 */

// Component
export { CharacterDesigner } from './components/CharacterDesigner';

// Service
export { getCharacterService, resetCharacterService } from '@/core/services/character.service';
export type { Character } from '@/shared/types';
