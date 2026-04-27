import { useMemo } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { Cell } from '../models/cell';
import Tile from './Tile';

interface GameGridProps {
  board: Cell[][];
  onTilePress?: (cell: Cell) => void;
  onDragStart?: (cell: Cell) => void;
  onDragMove?: (cell: Cell) => void;
  onDragEnd?: () => void;
}

export default function GameGrid({
  board,
  onTilePress,
  onDragStart,
  onDragMove,
  onDragEnd,
}: GameGridProps) {
  const gridSize = board.length || 0;
  const gap = 6;
  const padding = 10;
  const screenWidth = Dimensions.get('window').width;
  const boardPixelSize = Math.min(screenWidth - 40, 420);
  const tileSize =
    gridSize > 0 ? Math.floor((boardPixelSize - padding * 2 - gap * (gridSize - 1)) / gridSize) : 0;

  const getCellFromTouch = (event: GestureResponderEvent): Cell | null => {
    const { locationX, locationY } = event.nativeEvent;

    const innerX = locationX - padding;
    const innerY = locationY - padding;

    if (innerX < 0 || innerY < 0) return null;

    const step = tileSize + gap;
    const col = Math.floor(innerX / step);
    const row = Math.floor(innerY / step);

    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) return null;

    const offsetX = innerX % step;
    const offsetY = innerY % step;

    if (offsetX > tileSize || offsetY > tileSize) return null;

    return board[row]?.[col] ?? null;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (event) => {
          const cell = getCellFromTouch(event);
          if (!cell) return;
          onDragStart?.(cell);
        },

        onPanResponderMove: (event) => {
          const cell = getCellFromTouch(event);
          if (!cell) return;
          onDragMove?.(cell);
        },

        onPanResponderRelease: () => {
          onDragEnd?.();
        },

        onPanResponderTerminate: () => {
          onDragEnd?.();
        },
      }),
    [board, gridSize, tileSize, onDragStart, onDragMove, onDragEnd]
  );

  return (
    <View
      style={[styles.wrapper, { width: boardPixelSize, height: boardPixelSize, padding }]}
      {...panResponder.panHandlers}
    >
      {board.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap }]}>
          {row.map((cell) => (
            <Tile key={cell.id} cell={cell} size={tileSize} onPress={onTilePress} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    backgroundColor: '#D18B47',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#A16207',
    justifyContent: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});