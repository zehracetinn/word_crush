import { LETTER_WEIGHTS } from '../constants/letter-frequencies';
import { Cell } from '../models/cell';

function getRandomWeightedLetter(): string {
  const totalWeight = LETTER_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of LETTER_WEIGHTS) {
    random -= item.weight;
    if (random <= 0) {
      return item.letter;
    }
  }

  return 'A';
}

export function createRandomCell(row: number, col: number): Cell {
  return {
    id: `${row}-${col}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    row,
    col,
    letter: getRandomWeightedLetter(),
    isSelected: false,
    isEmpty: false,
    specialType: null,
  };
}

export function generateBoard(size: number): Cell[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => createRandomCell(row, col))
  );
}

export function flattenBoard(board: Cell[][]): Cell[] {
  return board.flat();
}