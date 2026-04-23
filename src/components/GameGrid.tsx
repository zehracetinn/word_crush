import { Dimensions, StyleSheet, View } from 'react-native';
import { Cell } from '../models/cell';
import Tile from './Tile';

interface GameGridProps {
  board: Cell[][];
  onTilePress?: (cell: Cell) => void;
}

export default function GameGrid({ board, onTilePress }: GameGridProps) {
  const gridSize = board.length || 0;
  const gap = 6;
  const screenWidth = Dimensions.get('window').width;
  const boardPixelSize = Math.min(screenWidth - 40, 420);
  const tileSize =
    gridSize > 0 ? Math.floor((boardPixelSize - gap * (gridSize - 1)) / gridSize) : 0;

  return (
    <View style={[styles.wrapper, { width: boardPixelSize, height: boardPixelSize }]}>
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
    padding: 10,
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