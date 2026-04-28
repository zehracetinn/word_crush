import { StyleSheet, Text, View } from 'react-native';
import { Cell } from '../models/cell';
import { getSpecialLabel } from '../utils/powerups';

interface TileProps {
  cell: Cell;
  size: number;
}

export default function Tile({ cell, size }: TileProps) {
  const specialLabel = getSpecialLabel(cell.specialType);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.tile,
        {
          width: size,
          height: size,
        },
        cell.isSelected && styles.selectedTile,
        cell.specialType && styles.specialTile,
      ]}
    >
      <Text style={[styles.letter, { fontSize: Math.max(22, size * 0.38) }]}>
        {cell.letter}
      </Text>

      {!!specialLabel && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{specialLabel}</Text>
        </View>
      )}
    </View>
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
    position: 'relative',
  },
  selectedTile: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  specialTile: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
    borderWidth: 2,
  },
  letter: {
    fontWeight: '900',
    color: '#1E3A8A',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
});
