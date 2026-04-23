export type SpecialType = 'row' | 'area' | 'column' | 'mega';

export interface Cell {
  id: string;
  row: number;
  col: number;
  letter: string;
  isSelected: boolean;
  isEmpty?: boolean;
  specialType?: SpecialType | null;
}