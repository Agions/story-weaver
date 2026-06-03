import { CharacterCard } from '../types/character';

const STORAGE_KEY = 'frame-fab_character_cards';

export interface CharacterCardStorage {
  save(cards: CharacterCard[]): Promise<void>;
  load(): Promise<CharacterCard[] | null>;
  clear(): Promise<void>;
}

export function createCharacterCardStorage(): CharacterCardStorage {
  return {
    async save(cards: CharacterCard[]): Promise<void> {
      const data = JSON.stringify({
        cards,
        savedAt: Date.now(),
        version: '1.0',
      });
      localStorage.setItem(STORAGE_KEY, data);
    },

    async load(): Promise<CharacterCard[] | null> {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed.cards as CharacterCard[];
      } catch {
        return null;
      }
    },

    async clear(): Promise<void> {
      localStorage.removeItem(STORAGE_KEY);
    },
  };
}
