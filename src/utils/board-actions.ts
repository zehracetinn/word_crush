import { Cell } from '../models/cell';
import { cellKey } from './selection';
import { createRandomCell } from './grid';

function cloneFallingCell(cell: Cell, row: number, col: number): Cell {
  return {
    ...cell,
    id: `${row}-${col}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    row,
    col,
    isSelected: false,
    isEmpty: false,
  };
}

export function resolveBoardAfterMatch(board: Cell[][], matchedPath: Cell[]): Cell[][] {
  const size = board.length;
  const removedKeys = new Set(matchedPath.map((cell) => cellKey(cell)));

  const nextBoard: Cell[][] = Array.from({ length: size }, () => Array<Cell>(size));

  for (let col = 0; col < size; col++) {
    const survivors: Cell[] = [];

    for (let row = size - 1; row >= 0; row--) {
      const currentCell = board[row][col];
      const shouldRemove = removedKeys.has(cellKey(currentCell));

      if (!shouldRemove) {
        survivors.push(currentCell);
      }
    }

    let targetRow = size - 1;

    for (const survivor of survivors) {
      nextBoard[targetRow][col] = cloneFallingCell(survivor, targetRow, col);
      targetRow--;
    }

    while (targetRow >= 0) {
      nextBoard[targetRow][col] = createRandomCell(targetRow, col);
      targetRow--;
    }
  }

  return nextBoard;
}