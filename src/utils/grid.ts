import { LETTER_WEIGHTS } from '../constants/letter-frequencies';
import { Cell } from '../models/cell';

function createCellId(row: number, col: number): string {
  return `${row}-${col}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

export function createCellWithLetter(row: number, col: number, letter: string): Cell {
  return {
    id: createCellId(row, col),
    row,
    col,
    letter: letter.toLocaleUpperCase('tr-TR'),
    isSelected: false,
    isEmpty: false,
    specialType: null,
  };
}

export function createRandomCell(row: number, col: number): Cell {
  return createCellWithLetter(row, col, getRandomWeightedLetter());
}

export function generateBoard(size: number): Cell[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => createRandomCell(row, col))
  );
}

export function flattenBoard(board: Cell[][]): Cell[] {
  return board.flat();
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [
      nextItems[randomIndex],
      nextItems[index],
    ];
  }

  return nextItems;
}

export function shuffleBoardContents(board: Cell[][]): Cell[][] {
  const size = board.length;
  const shuffledContents = shuffleArray(
    flattenBoard(board).map((cell) => ({
      letter: cell.letter,
      specialType: cell.specialType ?? null,
    }))
  );

  let contentIndex = 0;

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const content = shuffledContents[contentIndex++];
      const nextCell = createCellWithLetter(row, col, content.letter);

      return {
        ...nextCell,
        specialType: content.specialType,
      };
    })
  );
}
