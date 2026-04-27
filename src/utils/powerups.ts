import { Cell, SpecialType } from '../models/cell';

export function getSpecialTypeForWordLength(length: number): SpecialType | null {
  if (length === 4) return 'row';
  if (length === 5) return 'area';
  if (length === 6) return 'column';
  if (length >= 7) return 'mega';
  return null;
}

export function getSpecialLabel(type: SpecialType | null | undefined): string {
  switch (type) {
    case 'row':
      return '⇆';
    case 'area':
      return '✹';
    case 'column':
      return '⇅';
    case 'mega':
      return '✪';
    default:
      return '';
  }
}

export function getSpecialName(type: SpecialType | null | undefined): string {
  switch (type) {
    case 'row':
      return 'Satır Temizleme';
    case 'area':
      return 'Alan Patlatma';
    case 'column':
      return 'Sütun Temizleme';
    case 'mega':
      return 'Mega Patlatma';
    default:
      return '';
  }
}

export function getAffectedCellsBySpecial(board: Cell[][], anchor: Cell): Cell[] {
  const size = board.length;

  if (anchor.specialType === 'row') {
    return board[anchor.row];
  }

  if (anchor.specialType === 'column') {
    return board.map((row) => row[anchor.col]);
  }

  if (anchor.specialType === 'area') {
    const affected: Cell[] = [];

    for (let r = anchor.row - 1; r <= anchor.row + 1; r++) {
      for (let c = anchor.col - 1; c <= anchor.col + 1; c++) {
        if (r >= 0 && c >= 0 && r < size && c < size) {
          affected.push(board[r][c]);
        }
      }
    }

    return affected;
  }

  if (anchor.specialType === 'mega') {
    const affected: Cell[] = [];

    for (let r = anchor.row - 2; r <= anchor.row + 2; r++) {
      for (let c = anchor.col - 2; c <= anchor.col + 2; c++) {
        if (r >= 0 && c >= 0 && r < size && c < size) {
          affected.push(board[r][c]);
        }
      }
    }

    return affected;
  }

  return [];
}