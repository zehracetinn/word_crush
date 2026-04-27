import { calculateWordScore } from '../constants/letter-scores';
import { Cell } from '../models/cell';
import { dictionaryService } from '../services/dictionary.service';
import { generateBoard } from './grid';
import { cellKey } from './selection';

const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

const MAX_SEARCH_DEPTH = 8;
const MAX_FOUND_PATHS = 250;

export interface FoundWordPath {
  word: string;
  path: Cell[];
  score: number;
}

export interface BoardAnalysis {
  foundPaths: FoundWordPath[];
  possibleWordCount: number;
  greedyWords: FoundWordPath[];
}

function isInBounds(board: Cell[][], row: number, col: number): boolean {
  return row >= 0 && col >= 0 && row < board.length && col < board.length;
}

function pathSignature(path: Cell[]): string {
  return path.map((cell) => cellKey(cell)).join('|');
}

export function findWordPaths(
  board: Cell[][],
  maxFoundPaths: number = MAX_FOUND_PATHS,
  maxDepth: number = MAX_SEARCH_DEPTH
): FoundWordPath[] {
  const found: FoundWordPath[] = [];
  const seenPathSignatures = new Set<string>();

  function dfs(
    row: number,
    col: number,
    currentWord: string,
    currentPath: Cell[],
    visited: Set<string>
  ) {
    if (found.length >= maxFoundPaths) return;

    const cell = board[row][col];
    const nextWord = currentWord + cell.letter;

    if (!dictionaryService.hasPrefix(nextWord)) {
      return;
    }

    const nextPath = [...currentPath, cell];
    const currentKey = cellKey(cell);
    const nextVisited = new Set(visited);
    nextVisited.add(currentKey);

    if (nextWord.length >= 3 && dictionaryService.isValidWord(nextWord)) {
      const signature = pathSignature(nextPath);

      if (!seenPathSignatures.has(signature)) {
        seenPathSignatures.add(signature);
        found.push({
          word: nextWord,
          path: nextPath,
          score: calculateWordScore(nextWord),
        });
      }
    }

    if (nextPath.length >= maxDepth) return;

    for (const [dr, dc] of DIRECTIONS) {
      const nextRow = row + dr;
      const nextCol = col + dc;

      if (!isInBounds(board, nextRow, nextCol)) continue;

      const nextCell = board[nextRow][nextCol];
      const nextKey = cellKey(nextCell);

      if (nextVisited.has(nextKey)) continue;

      dfs(nextRow, nextCol, nextWord, nextPath, nextVisited);
    }
  }

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board.length; col++) {
      dfs(row, col, '', [], new Set<string>());
      if (found.length >= maxFoundPaths) break;
    }
    if (found.length >= maxFoundPaths) break;
  }

  return found;
}

export function getGreedyNonOverlappingWords(paths: FoundWordPath[]): FoundWordPath[] {
  const sorted = [...paths].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.path.length !== a.path.length) return b.path.length - a.path.length;
    return a.word.localeCompare(b.word, 'tr');
  });

  const occupied = new Set<string>();
  const picked: FoundWordPath[] = [];

  for (const candidate of sorted) {
    const overlaps = candidate.path.some((cell) => occupied.has(cellKey(cell)));
    if (overlaps) continue;

    picked.push(candidate);
    candidate.path.forEach((cell) => occupied.add(cellKey(cell)));
  }

  return picked;
}

export function analyzeBoard(board: Cell[][]): BoardAnalysis {
  const foundPaths = findWordPaths(board);
  const greedyWords = getGreedyNonOverlappingWords(foundPaths);

  return {
    foundPaths,
    possibleWordCount: greedyWords.length,
    greedyWords,
  };
}

export function generatePlayableBoard(
  size: number,
  maxAttempts: number = 40
): { board: Cell[][]; analysis: BoardAnalysis; attempts: number } {
  let attempts = 0;
  let board = generateBoard(size);
  let analysis = analyzeBoard(board);

  while (analysis.possibleWordCount === 0 && attempts < maxAttempts) {
    board = generateBoard(size);
    analysis = analyzeBoard(board);
    attempts++;
  }

  return { board, analysis, attempts };
}