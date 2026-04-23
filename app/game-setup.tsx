import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../src/theme/colors';

const OPTIONS = [
  {
    label: '10x10 Grid',
    difficulty: 'Kolay',
    gridSize: 10,
    moves: 25,
  },
  {
    label: '8x8 Grid',
    difficulty: 'Orta',
    gridSize: 8,
    moves: 20,
  },
  {
    label: '6x6 Grid',
    difficulty: 'Zor',
    gridSize: 6,
    moves: 15,
  },
];

export default function GameSetupScreen() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Yeni Oyun</Text>
      <Text style={styles.subtitle}>
        Grid boyutunu seç. Hamle sayısı seviyeye göre otomatik atanır.
      </Text>

      <View style={styles.list}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/game',
                params: {
                  gridSize: String(option.gridSize),
                  moves: String(option.moves),
                  difficulty: option.difficulty,
                },
              })
            }
          >
            <Text style={styles.cardTitle}>{option.label}</Text>
            <Text style={styles.cardSubtitle}>{option.difficulty} Seviye</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Hamle: {option.moves}</Text>
              <Text style={styles.metaText}>Boyut: {option.gridSize}x{option.gridSize}</Text>
            </View>
          </Pressable>
        ))}
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
  cardTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.mutedText,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
});