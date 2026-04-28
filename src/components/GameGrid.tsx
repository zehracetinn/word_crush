import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { Cell } from '../models/cell';
import {
  buildDragSelectionChain,
  isSameCell,
} from '../utils/selection';
import Tile from './Tile';

interface GameGridProps {
  board: Cell[][];
  onTilePress?: (cell: Cell) => void;
  onDragStart?: (cell: Cell) => void;
  onDragMove?: (cell: Cell) => void;
  onDragEnd?: () => void;
}

const DRAG_ACTIVATION_DISTANCE = 6;

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
    gridSize > 0
      ? Math.floor((boardPixelSize - padding * 2 - gap * (gridSize - 1)) / gridSize)
      : 0;
  const contentSize =
    gridSize > 0 ? tileSize * gridSize + gap * Math.max(gridSize - 1, 0) : 0;

  const boardRef = useRef(board);
  const onTilePressRef = useRef(onTilePress);
  const onDragStartRef = useRef(onDragStart);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);
  const gestureStartCellRef = useRef<Cell | null>(null);
  const lastDragCellRef = useRef<Cell | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    onTilePressRef.current = onTilePress;
  }, [onTilePress]);

  useEffect(() => {
    onDragStartRef.current = onDragStart;
  }, [onDragStart]);

  useEffect(() => {
    onDragMoveRef.current = onDragMove;
  }, [onDragMove]);

  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

  const resetGestureState = useCallback(() => {
    gestureStartCellRef.current = null;
    lastDragCellRef.current = null;
    isDraggingRef.current = false;
  }, []);

  const getCellFromTouch = useCallback(
    (event: GestureResponderEvent): Cell | null => {
      if (gridSize === 0 || tileSize <= 0 || contentSize <= 0) {
        return null;
      }

      const { locationX, locationY } = event.nativeEvent;
      const innerX = locationX - padding;
      const innerY = locationY - padding;

      if (innerX < 0 || innerY < 0 || innerX > contentSize || innerY > contentSize) {
        return null;
      }

      const step = tileSize + gap;
      const col = Math.max(
        0,
        Math.min(gridSize - 1, Math.round((innerX - tileSize / 2) / step))
      );
      const row = Math.max(
        0,
        Math.min(gridSize - 1, Math.round((innerY - tileSize / 2) / step))
      );

      return boardRef.current[row]?.[col] ?? null;
    },
    [contentSize, gap, gridSize, padding, tileSize]
  );

  const continueDragSelection = useCallback((nextCell: Cell) => {
    const lastCell = lastDragCellRef.current;

    if (!lastCell) {
      lastDragCellRef.current = nextCell;
      return;
    }

    if (isSameCell(lastCell, nextCell)) {
      return;
    }

    const traversedCells = buildDragSelectionChain(boardRef.current, lastCell, nextCell);

    traversedCells.forEach((cell) => {
      onDragMoveRef.current?.(cell);
    });

    if (traversedCells.length > 0) {
      lastDragCellRef.current = traversedCells[traversedCells.length - 1];
      return;
    }

    lastDragCellRef.current = nextCell;
  }, []);

  const startDragSelection = useCallback((startCell: Cell) => {
    if (isDraggingRef.current) {
      return;
    }

    isDraggingRef.current = true;
    lastDragCellRef.current = startCell;
    onDragStartRef.current?.(startCell);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,

        onPanResponderGrant: (event) => {
          const cell = getCellFromTouch(event);
          gestureStartCellRef.current = cell;
          lastDragCellRef.current = cell;
          isDraggingRef.current = false;
        },

        onPanResponderMove: (event, gestureState) => {
          const startCell = gestureStartCellRef.current;
          const currentCell = getCellFromTouch(event);

          if (!startCell || !currentCell) {
            return;
          }

          const movedEnough =
            Math.max(Math.abs(gestureState.dx), Math.abs(gestureState.dy)) >=
            DRAG_ACTIVATION_DISTANCE;

          if (!isDraggingRef.current) {
            if (!movedEnough && isSameCell(startCell, currentCell)) {
              return;
            }

            startDragSelection(startCell);
          }

          continueDragSelection(currentCell);
        },

        onPanResponderRelease: () => {
          const startCell = gestureStartCellRef.current;
          const wasDragging = isDraggingRef.current;

          resetGestureState();

          if (wasDragging) {
            onDragEndRef.current?.();
            return;
          }

          if (startCell) {
            onTilePressRef.current?.(startCell);
          }
        },

        onPanResponderTerminate: () => {
          const wasDragging = isDraggingRef.current;

          resetGestureState();

          if (wasDragging) {
            onDragEndRef.current?.();
          }
        },
      }),
    [continueDragSelection, getCellFromTouch, resetGestureState, startDragSelection]
  );

  return (
    <View
      style={[styles.wrapper, { width: boardPixelSize, height: boardPixelSize, padding }]}
      {...panResponder.panHandlers}
    >
      {board.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap }]}> 
          {row.map((cell) => (
            <Tile key={cell.id} cell={cell} size={tileSize} />
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
