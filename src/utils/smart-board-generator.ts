import { Cell } from '../models/cell';
import { dictionaryService } from '../services/dictionary.service';
import { BoardAnalysis, analyzeBoard } from './board-analyzer';
import { createCellWithLetter, createRandomCell, generateBoard } from './grid';

interface Coord {
  row: number;
  col: number;
}

export interface SmartBoardResult {
  board: Cell[][];
  analysis: BoardAnalysis;
  guaranteedWord: string | null;
}

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

function coordKey(coord: Coord): string {
  return `${coord.row}-${coord.col}`;
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function randomChance(probability: number): boolean {
  return Math.random() < probability;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function getTargetLength(size: number): number {
  if (size <= 6) return 4;
  if (size <= 8) return 5;
  return 6;
}

function getLongWordEmbedChance(size: number): number {
  if (size <= 6) return 0.35; // %35
  if (size <= 8) return 0.45; // %45
  return 0.50; // %50
}

function isInBounds(size: number, row: number, col: number): boolean {
  return row >= 0 && col >= 0 && row < size && col < size;
}

function getAvailableNeighbors(
  size: number,
  coord: Coord,
  used: Set<string>
): Coord[] {
  const neighbors: Coord[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    const nextRow = coord.row + dr;
    const nextCol = coord.col + dc;

    if (!isInBounds(size, nextRow, nextCol)) continue;

    const next = { row: nextRow, col: nextCol };
    if (used.has(coordKey(next))) continue;

    neighbors.push(next);
  }

  return shuffle(neighbors);
}

function buildRandomPath(size: number, length: number): Coord[] | null {
  function dfs(path: Coord[], used: Set<string>): Coord[] | null {
    if (path.length === length) return [...path];

    const last = path[path.length - 1];
    const neighbors = getAvailableNeighbors(size, last, used);

    for (const next of neighbors) {
      path.push(next);
      used.add(coordKey(next));

      const result = dfs(path, used);
      if (result) return result;

      path.pop();
      used.delete(coordKey(next));
    }

    return null;
  }

  for (let attempt = 0; attempt < 200; attempt++) {
    const start = { row: randomInt(size), col: randomInt(size) };
    const used = new Set<string>([coordKey(start)]);
    const result = dfs([start], used);

    if (result) return result;
  }

  return null;
}

function embedWordIntoBoard(size: number, word: string): Cell[][] | null {
  const path = buildRandomPath(size, word.length);
  if (!path) return null;

  const board = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => createRandomCell(row, col))
  );

  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];
    board[row][col] = createCellWithLetter(row, col, word[i]);
  }

  return board;
}

function generateNormalPlayableBoard(size: number): SmartBoardResult {
  for (let attempt = 0; attempt < 40; attempt++) {
    const board = generateBoard(size);
    const analysis = analyzeBoard(board);

    if (analysis.possibleWordCount > 0) {
      return {
        board,
        analysis,
        guaranteedWord: null,
      };
    }
  }

  const board = generateBoard(size);
  const analysis = analyzeBoard(board);

  return {
    board,
    analysis,
    guaranteedWord: null,
  };
}

function generateLongWordSupportedBoard(
  size: number,
  maxAttempts: number
): SmartBoardResult | null {
  const targetLength = getTargetLength(size);

  const minLength = size <= 8 ? targetLength - 1 : targetLength - 1;
  const maxLength = targetLength;

  const candidateWords = shuffle(
    dictionaryService
      .getWordsByLength(Math.max(4, minLength), maxLength)
      .filter((word) => word.length <= 8)
  );

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pickedWord =
      candidateWords[attempt % Math.max(candidateWords.length, 1)] ?? null;

    if (!pickedWord) break;

    const board = embedWordIntoBoard(size, pickedWord);
    if (!board) continue;

    const analysis = analyzeBoard(board);

    const hasDecentWord = analysis.foundPaths.some(
      (item) => item.word.length >= Math.max(4, minLength)
    );

    if (analysis.possibleWordCount > 0 && hasDecentWord) {
      return {
        board,
        analysis,
        guaranteedWord: pickedWord,
      };
    }
  }

  return null;
}

export function generateSmartPlayableBoard(
  size: number,
  maxAttempts: number = 60
): SmartBoardResult {
  const shouldEmbedLongWord = randomChance(getLongWordEmbedChance(size));

  if (shouldEmbedLongWord) {
    const supportedBoard = generateLongWordSupportedBoard(size, maxAttempts);
    if (supportedBoard) {
      return supportedBoard;
    }
  }

  return generateNormalPlayableBoard(size);
}