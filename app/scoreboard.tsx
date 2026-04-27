import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { GameResult } from '../src/models/game-result';
import { storageService } from '../src/services/storage.service';
import { COLORS } from '../src/theme/colors';
import {
  buildScoreSummary,
  formatDuration,
  formatPlayedAt,
} from '../src/utils/result-stats';

export default function ScoreboardScreen() {
  const [results, setResults] = useState<GameResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setIsLoading(true);
    const data = await storageService.getGameResults();
    setResults(data);
    setIsLoading(false);
  };

  const summary = buildScoreSummary(results);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Skor Tablosu</Text>
      <Text style={styles.subtitle}>
        Burada oynanan oyunların geçmişi ve genel performans özeti gösterilir.
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Genel Özet</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Toplam Oyun</Text>
          <Text style={styles.summaryValue}>{summary.totalGames}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>En Yüksek Puan</Text>
          <Text style={styles.summaryValue}>{summary.highestScore}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ortalama Puan</Text>
          <Text style={styles.summaryValue}>{summary.averageScore}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Toplam Kelime</Text>
          <Text style={styles.summaryValue}>{summary.totalWords}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>En Uzun Kelime</Text>
          <Text style={styles.summaryValue}>{summary.longestWord}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Toplam Süre</Text>
          <Text style={styles.summaryValue}>
            {formatDuration(summary.totalDurationSeconds)}
          </Text>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Oyun Geçmişi</Text>

        {isLoading ? (
          <Text style={styles.emptyText}>Yükleniyor...</Text>
        ) : results.length === 0 ? (
          <Text style={styles.emptyText}>Henüz kayıtlı bir oyun sonucu yok.</Text>
        ) : (
          results.map((item, index) => (
            <View key={item.id} style={styles.resultCard}>
              <Text style={styles.resultTitle}>Oyun {results.length - index}</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Tarih</Text>
                <Text style={styles.resultValue}>{formatPlayedAt(item.playedAt)}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Grid</Text>
                <Text style={styles.resultValue}>
                  {item.gridSize}x{item.gridSize}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Seviye</Text>
                <Text style={styles.resultValue}>{item.difficulty}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Puan</Text>
                <Text style={styles.resultValue}>{item.score}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Kelime Sayısı</Text>
                <Text style={styles.resultValue}>{item.wordCount}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>En Uzun Kelime</Text>
                <Text style={styles.resultValue}>{item.longestWord}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Süre</Text>
                <Text style={styles.resultValue}>
                  {formatDuration(item.durationSeconds)}
                </Text>
              </View>
            </View>
          ))
        )}
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
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '800',
  },
  historySection: {
    marginTop: 18,
    gap: 12,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mutedText,
  },
});