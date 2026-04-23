import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import GameGrid from '../src/components/GameGrid';
import { Cell } from '../src/models/cell';
import { COLORS } from '../src/theme/colors';
import { generateBoard } from '../src/utils/grid';

export default function GameScreen() {
  const { gridSize, moves, difficulty } = useLocalSearchParams<{
    gridSize?: string;
    moves?: string;
    difficulty?: string;
  }>();

  const parsedGridSize = useMemo(() => Number(gridSize ?? 8), [gridSize]);
  const parsedMoves = useMemo(() => Number(moves ?? 20), [moves]);

  const [board, setBoard] = useState<Cell[][]>([]);
  const [score] = useState(0);

  useEffect(() => {
    setBoard(generateBoard(parsedGridSize));
  }, [parsedGridSize]);

  const regenerateBoard = () => {
    setBoard(generateBoard(parsedGridSize));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Oyun Ekranı</Text>
      <Text style={styles.subtitle}>
        Bu sprintte gerçek grid ve ağırlıklı harf üretimi aktif.
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Seviye</Text>
          <Text style={styles.infoValue}>{difficulty ?? '-'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Grid</Text>
          <Text style={styles.infoValue}>
            {parsedGridSize}x{parsedGridSize}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hamle</Text>
          <Text style={styles.infoValue}>{parsedMoves}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Skor</Text>
          <Text style={styles.infoValue}>{score}</Text>
        </View>
      </View>

      <View style={styles.boardSection}>
        {board.length > 0 && <GameGrid board={board} />}
      </View>

      <Pressable style={styles.regenerateButton} onPress={regenerateBoard}>
        <Text style={styles.regenerateButtonText}>Tahtayı Yeniden Üret</Text>
      </Pressable>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Şu an aktif olanlar</Text>
        <Text style={styles.noteText}>• Grid boyutu seçime göre geliyor</Text>
        <Text style={styles.noteText}>• Harfler ağırlıklı dağıtılıyor</Text>
        <Text style={styles.noteText}>• Oyun tahtası gerçek render ediliyor</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
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
    marginBottom: 20,
    fontSize: 15,
    color: COLORS.mutedText,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 15,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '800',
  },
  boardSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  regenerateButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  noteCard: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.text,
  },
});