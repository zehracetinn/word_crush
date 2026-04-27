import { GameResult } from '../models/game-result';

export interface ScoreSummary {
  totalGames: number;
  highestScore: number;
  averageScore: number;
  totalWords: number;
  longestWord: string;
  totalDurationSeconds: number;
}

export function buildScoreSummary(results: GameResult[]): ScoreSummary {
  if (results.length === 0) {
    return {
      totalGames: 0,
      highestScore: 0,
      averageScore: 0,
      totalWords: 0,
      longestWord: '-',
      totalDurationSeconds: 0,
    };
  }

  const totalGames = results.length;
  const highestScore = Math.max(...results.map((x) => x.score));
  const totalScore = results.reduce((sum, x) => sum + x.score, 0);
  const totalWords = results.reduce((sum, x) => sum + x.wordCount, 0);
  const totalDurationSeconds = results.reduce((sum, x) => sum + x.durationSeconds, 0);

  const longestWordResult = results.reduce((best, current) => {
    if ((current.longestWord?.length ?? 0) > (best.longestWord?.length ?? 0)) {
      return current;
    }
    return best;
  }, results[0]);

  return {
    totalGames,
    highestScore,
    averageScore: Math.round(totalScore / totalGames),
    totalWords,
    longestWord: longestWordResult.longestWord || '-',
    totalDurationSeconds,
  };
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 dk';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours} sa ${minutes} dk`;
  }

  if (minutes > 0) {
    return `${minutes} dk ${remainingSeconds} sn`;
  }

  return `${remainingSeconds} sn`;
}

export function formatPlayedAt(iso: string): string {
  const date = new Date(iso);

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}