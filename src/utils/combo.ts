import { calculateWordScore } from '../constants/letter-scores';
import { dictionaryService } from '../services/dictionary.service';

export interface ComboAnalysis {
  mainWord: string;
  comboWords: string[];
  bonusWords: string[];
  bonusScore: number;
  totalScore: number;
  hasCombo: boolean;
}

export function analyzeComboWords(word: string): ComboAnalysis {
  const normalizedWord = dictionaryService.normalizeWord(word);
  const uniqueWords = new Set<string>();

  for (let length = normalizedWord.length; length >= 3; length--) {
    for (let start = 0; start <= normalizedWord.length - length; start++) {
      const candidate = normalizedWord.slice(start, start + length);

      if (!dictionaryService.isValidWord(candidate)) {
        continue;
      }

      uniqueWords.add(candidate);
    }
  }

  const comboWords = Array.from(uniqueWords);
  const bonusWords = comboWords.filter((candidate) => candidate !== normalizedWord);
  const bonusScore = bonusWords.reduce(
    (total, candidate) => total + calculateWordScore(candidate),
    0
  );
  const totalScore = calculateWordScore(normalizedWord) + bonusScore;

  return {
    mainWord: normalizedWord,
    comboWords,
    bonusWords,
    bonusScore,
    totalScore,
    hasCombo: bonusWords.length > 0,
  };
}
