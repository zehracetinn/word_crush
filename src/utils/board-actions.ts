import { Cell, SpecialType } from '../models/cell';
import { createRandomCell } from './grid';
import { cellKey } from './selection';
import { getAffectedCellsBySpecial } from './powerups';

interface ResolveBoardOptions {
  createdSpecialType?: SpecialType | null;
  activatedSpecialCells?: Cell[];
}

function createCellId(row: number, col: number): string {
  return `${row}-${col}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneFallingCell(cell: Cell, row: number, col: number): Cell {
  return {
    ...cell,
    id: createCellId(row, col),
    row,
    col,
    isSelected: false,
    isEmpty: false,
  };
}

export function resolveBoardAfterMatch(
  board: Cell[][],
  matchedPath: Cell[],
  options: ResolveBoardOptions = {}
): Cell[][] {
  const size = board.length;
  const removedKeys = new Set<string>(matchedPath.map((cell) => cellKey(cell)));

  for (const specialCell of options.activatedSpecialCells ?? []) {
    const affectedCells = getAffectedCellsBySpecial(board, specialCell);
    for (const affected of affectedCells) {
      removedKeys.add(cellKey(affected));
    }
  }

  let fixedSpecialCell: Cell | null = null;

  if (options.createdSpecialType && matchedPath.length > 0) {
    const lastCell = matchedPath[matchedPath.length - 1];

    removedKeys.delete(cellKey(lastCell));

    fixedSpecialCell = {
      ...lastCell,
      id: createCellId(lastCell.row, lastCell.col),
      isSelected: false,
      isEmpty: false,
      specialType: options.createdSpecialType,
    };
  }

  const nextBoard: Cell[][] = Array.from({ length: size }, () => Array<Cell>(size));

  for (let col = 0; col < size; col++) {
    const fixedInThisColumn =
      fixedSpecialCell && fixedSpecialCell.col === col ? fixedSpecialCell : null;

    if (!fixedInThisColumn) {
      const survivors: Cell[] = [];

      for (let row = size - 1; row >= 0; row--) {
        const currentCell = board[row][col];
        if (!removedKeys.has(cellKey(currentCell))) {
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

      continue;
    }

    const fixedRow = fixedInThisColumn.row;

    const survivorsBelow: Cell[] = [];
    for (let row = size - 1; row > fixedRow; row--) {
      const currentCell = board[row][col];
      if (!removedKeys.has(cellKey(currentCell))) {
        survivorsBelow.push(currentCell);
      }
    }

    let targetBelow = size - 1;
    for (const survivor of survivorsBelow) {
      nextBoard[targetBelow][col] = cloneFallingCell(survivor, targetBelow, col);
      targetBelow--;
    }

    while (targetBelow > fixedRow) {
      nextBoard[targetBelow][col] = createRandomCell(targetBelow, col);
      targetBelow--;
    }

    nextBoard[fixedRow][col] = fixedInThisColumn;

    const survivorsAbove: Cell[] = [];
    for (let row = fixedRow - 1; row >= 0; row--) {
      const currentCell = board[row][col];
      if (!removedKeys.has(cellKey(currentCell))) {
        survivorsAbove.push(currentCell);
      }
    }

    let targetAbove = fixedRow - 1;
    for (const survivor of survivorsAbove) {
      nextBoard[targetAbove][col] = cloneFallingCell(survivor, targetAbove, col);
      targetAbove--;
    }

    while (targetAbove >= 0) {
      nextBoard[targetAbove][col] = createRandomCell(targetAbove, col);
      targetAbove--;
    }
  }

  return nextBoard;
}