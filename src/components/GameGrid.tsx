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
const TOUCH_SAMPLE_DIVISOR = 3;

interface TouchPoint {
  x: number;
  y: number;
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
    gridSize > 0
      ? Math.floor((boardPixelSize - padding * 2 - gap * (gridSize - 1)) / gridSize)
      : 0;
  const contentSize =
    gridSize > 0 ? tileSize * gridSize + gap * Math.max(gridSize - 1, 0) : 0;
  const contentOffset = (boardPixelSize - contentSize) / 2;
  const touchTolerance = Math.max(14, gap + tileSize * 0.35);

  const boardRef = useRef(board);
  const onTilePressRef = useRef(onTilePress);
  const onDragStartRef = useRef(onDragStart);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);
  const gestureStartCellRef = useRef<Cell | null>(null);
  const lastDragCellRef = useRef<Cell | null>(null);
  const lastTouchPointRef = useRef<TouchPoint | null>(null);
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
    lastTouchPointRef.current = null;
    isDraggingRef.current = false;
  }, []);

  const getTouchPoint = useCallback((event: GestureResponderEvent): TouchPoint => {
    const { locationX, locationY } = event.nativeEvent;

    return { x: locationX, y: locationY };
  }, []);

  const getCellFromPoint = useCallback(
    (point: TouchPoint): Cell | null => {
      if (gridSize === 0 || tileSize <= 0 || contentSize <= 0) {
        return null;
      }

      const innerX = point.x - contentOffset;
      const innerY = point.y - contentOffset;

      if (
        innerX < -touchTolerance ||
        innerY < -touchTolerance ||
        innerX > contentSize + touchTolerance ||
        innerY > contentSize + touchTolerance
      ) {
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
    [contentOffset, contentSize, gap, gridSize, tileSize, touchTolerance]
  );

  const getCellsBetweenTouchPoints = useCallback(
    (startPoint: TouchPoint, endPoint: TouchPoint): Cell[] => {
      const distanceX = endPoint.x - startPoint.x;
      const distanceY = endPoint.y - startPoint.y;
      const distance = Math.hypot(distanceX, distanceY);
      const sampleDistance = Math.max(4, tileSize / TOUCH_SAMPLE_DIVISOR);
      const sampleCount = Math.max(1, Math.ceil(distance / sampleDistance));
      const cells: Cell[] = [];
      const visitedKeys = new Set<string>();

      for (let index = 1; index <= sampleCount; index += 1) {
        const point = {
          x: startPoint.x + (distanceX * index) / sampleCount,
          y: startPoint.y + (distanceY * index) / sampleCount,
        };
        const cell = getCellFromPoint(point);

        if (!cell) {
          continue;
        }

        const key = `${cell.row}-${cell.col}`;

        if (visitedKeys.has(key)) {
          continue;
        }

        visitedKeys.add(key);
        cells.push(cell);
      }

      return cells;
    },
    [getCellFromPoint, tileSize]
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
          const touchPoint = getTouchPoint(event);
          const cell = getCellFromPoint(touchPoint);

          gestureStartCellRef.current = cell;
          lastDragCellRef.current = cell;
          lastTouchPointRef.current = touchPoint;
          isDraggingRef.current = false;
        },

        onPanResponderMove: (event, gestureState) => {
          const startCell = gestureStartCellRef.current;
          const previousTouchPoint = lastTouchPointRef.current;
          const currentTouchPoint = getTouchPoint(event);
          const currentCell = getCellFromPoint(currentTouchPoint);

          if (!startCell) {
            lastTouchPointRef.current = currentTouchPoint;
            return;
          }

          const movedEnough =
            Math.max(Math.abs(gestureState.dx), Math.abs(gestureState.dy)) >=
            DRAG_ACTIVATION_DISTANCE;

          if (!isDraggingRef.current) {
            if (!movedEnough) {
              return;
            }

            startDragSelection(startCell);
          }

          if (previousTouchPoint) {
            getCellsBetweenTouchPoints(previousTouchPoint, currentTouchPoint).forEach(
              (cell) => {
                continueDragSelection(cell);
              }
            );
          } else if (currentCell) {
            continueDragSelection(currentCell);
          }

          lastTouchPointRef.current = currentTouchPoint;
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
    [
      continueDragSelection,
      getCellFromPoint,
      getCellsBetweenTouchPoints,
      getTouchPoint,
      resetGestureState,
      startDragSelection,
    ]
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
