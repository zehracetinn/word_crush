import { Cell } from '../models/cell';

export function cellKey(cell: Pick<Cell, 'row' | 'col'>): string {
  return `${cell.row}-${cell.col}`;
}

export function isSameCell(
  a: Pick<Cell, 'row' | 'col'>,
  b: Pick<Cell, 'row' | 'col'>
): boolean {
  return a.row === b.row && a.col === b.col;
}

export function areAdjacent(
  a: Pick<Cell, 'row' | 'col'>,
  b: Pick<Cell, 'row' | 'col'>
): boolean {
  const rowDiff = Math.abs(a.row - b.row);
  const colDiff = Math.abs(a.col - b.col);

  return !(rowDiff === 0 && colDiff === 0) && rowDiff <= 1 && colDiff <= 1;
}

export function isCellInPath(
  cell: Pick<Cell, 'row' | 'col'>,
  path: Array<Pick<Cell, 'row' | 'col'>>
): boolean {
  return path.some((item) => isSameCell(cell, item));
}

export function buildWordFromPath(path: Cell[]): string {
  return path.map((cell) => cell.letter).join('');
}

export function applyPathSelection(board: Cell[][], path: Cell[]): Cell[][] {
  const selectedKeys = new Set(path.map((cell) => cellKey(cell)));

  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      isSelected: selectedKeys.has(cellKey(cell)),
    }))
  );
}