export interface GameResult {
  id: string;
  playedAt: string;
  gridSize: number;
  difficulty: string;
  score: number;
  wordCount: number;
  longestWord: string;
  durationSeconds: number;
}