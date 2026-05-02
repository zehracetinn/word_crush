import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../src/theme/colors';

const MOVE_OPTIONS = [
  { difficulty: 'Kolay', moves: 25 },
  { difficulty: 'Orta', moves: 20 },
  { difficulty: 'Zor', moves: 15 },
];

export default function MoveSelectScreen() {
  const { gridSize, moves, difficulty } = useLocalSearchParams<{
    gridSize?: string;
    moves?: string;
    difficulty?: string;
  }>();

  const parsedGridSize = Number(gridSize ?? 8);
  const recommendedMoves = Number(moves ?? 20);
  const selectedDifficulty = difficulty ?? 'Orta';

  const startGame = (selectedMoves: number) => {
    router.push({
      pathname: '/game',
      params: {
        gridSize: String(parsedGridSize),
        moves: String(selectedMoves),
        difficulty: selectedDifficulty,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Hamle Sayısı</Text>
      <Text style={styles.subtitle}>
        Seçtiğin grid: {parsedGridSize}x{parsedGridSize} ({selectedDifficulty}). Aşağıdan
        oynamak istediğin hamle sayısını seç.
      </Text>

      <View style={styles.list}>
        {MOVE_OPTIONS.map((option) => {
          const isRecommended = option.moves === recommendedMoves;

          return (
            <Pressable
              key={option.difficulty}
              style={[styles.card, isRecommended && styles.recommendedCard]}
              onPress={() => startGame(option.moves)}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{option.difficulty} Level</Text>
                {isRecommended && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>ÖNERİLEN</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardMoves}>{option.moves} Hamle</Text>
              <Text style={styles.cardSubtitle}>
                Bu seviyede {option.moves} hamle hakkın olur.
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 8,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.mutedText,
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  recommendedCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#EEF4FF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardMoves: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.mutedText,
    lineHeight: 20,
  },
});
