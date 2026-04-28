import { Cell, SpecialType } from '../models/cell';
import { BoardAnalysis, analyzeBoard } from './board-analyzer';
import {
  createRandomCell,
  flattenBoard,
  shuffleArray,
  shuffleBoardContents,
} from './grid';
import { generateSmartPlayableBoard } from './smart-board-generator';
import { cellKey } from './selection';
import { getAffectedCellsBySpecial } from './powerups';

interface ResolveBoardOptions {
  createdSpecialType?: SpecialType | null;
  activatedSpecialCells?: Cell[];
}

export interface RandomRemovalResult {
  board: Cell[][];
  removedCells: Cell[];
}

export interface ShuffleBoardResult {
  board: Cell[][];
  analysis: BoardAnalysis;
  usedFallback: boolean;
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

export function resolveBoardAfterSingleCellRemoval(
  board: Cell[][],
  targetCell: Cell
): Cell[][] {
  return resolveBoardAfterMatch(board, [targetCell]);
}

export function resolveBoardAfterRandomRemoval(
  board: Cell[][],
  removalCount: number
): RandomRemovalResult {
  const clampedCount = Math.max(1, Math.min(removalCount, board.length * board.length));
  const removedCells = shuffleArray(flattenBoard(board)).slice(0, clampedCount);

  return {
    board: resolveBoardAfterMatch(board, removedCells),
    removedCells,
  };
}

export function resolveBoardAfterRowAndColumnRemoval(
  board: Cell[][],
  targetCell: Cell
): Cell[][] {
  return resolveBoardAfterMatch(board, [targetCell], {
    activatedSpecialCells: [
      {
        ...targetCell,
        specialType: 'row',
      },
      {
        ...targetCell,
        specialType: 'column',
      },
    ],
  });
}

export function swapBoardCells(
  board: Cell[][],
  firstCell: Cell,
  secondCell: Cell
): Cell[][] {
  return board.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (rowIndex === firstCell.row && colIndex === firstCell.col) {
        return cloneFallingCell(board[secondCell.row][secondCell.col], rowIndex, colIndex);
      }

      if (rowIndex === secondCell.row && colIndex === secondCell.col) {
        return cloneFallingCell(board[firstCell.row][firstCell.col], rowIndex, colIndex);
      }

      return {
        ...cell,
        isSelected: false,
      };
    })
  );
}

export function shuffleBoardForJoker(
  board: Cell[][],
  maxAttempts: number = 30
): ShuffleBoardResult {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffledBoard = shuffleBoardContents(board);
    const analysis = analyzeBoard(shuffledBoard);

    if (analysis.possibleWordCount > 0) {
      return {
        board: shuffledBoard,
        analysis,
        usedFallback: false,
      };
    }
  }

  const fallback = generateSmartPlayableBoard(board.length);

  return {
    board: fallback.board,
    analysis: fallback.analysis,
    usedFallback: true,
  };
}
