import { SEED_DICTIONARY } from '../data/seed-dictionary';

function normalizeWord(word: string): string {
  return word.trim().toLocaleUpperCase('tr-TR');
}

const dictionarySet = new Set(SEED_DICTIONARY.map(normalizeWord));

function isValidWord(word: string): boolean {
  const normalized = normalizeWord(word);

  if (normalized.length < 3) {
    return false;
  }

  return dictionarySet.has(normalized);
}

function getAllWords(): string[] {
  return Array.from(dictionarySet);
}

export const dictionaryService = {
  isValidWord,
  getAllWords,
  normalizeWord,
};