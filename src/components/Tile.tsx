import { Pressable, StyleSheet, Text } from 'react-native';
import { Cell } from '../models/cell';

interface TileProps {
  cell: Cell;
  size: number;
  onPress?: (cell: Cell) => void;
}

export default function Tile({ cell, size, onPress }: TileProps) {
  return (
    <Pressable
      style={[
        styles.tile,
        {
          width: size,
          height: size,
        },
        cell.isSelected && styles.selectedTile,
      ]}
      onPress={() => onPress?.(cell)}
    >
      <Text style={[styles.letter, { fontSize: Math.max(22, size * 0.38) }]}>
        {cell.letter}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#F5D9A6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C08A38',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  selectedTile: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  letter: {
    fontWeight: '900',
    color: '#1E3A8A',
  },
});