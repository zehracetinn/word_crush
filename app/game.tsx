import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import GameGrid from '../src/components/GameGrid';
import { calculateWordScore } from '../src/constants/letter-scores';
import { Cell } from '../src/models/cell';
import { dictionaryService } from '../src/services/dictionary.service';
import { COLORS } from '../src/theme/colors';
import { resolveBoardAfterMatch } from '../src/utils/board-actions';
import { generateBoard } from '../src/utils/grid';
import {
  applyPathSelection,
  areAdjacent,
  buildWordFromPath,
  isCellInPath,
  isSameCell,
} from '../src/utils/selection';

export default function GameScreen() {
  const { gridSize, moves, difficulty } = useLocalSearchParams<{
    gridSize?: string;
    moves?: string;
    difficulty?: string;
  }>();

  const parsedGridSize = useMemo(() => Number(gridSize ?? 8), [gridSize]);
  const parsedMoves = useMemo(() => Number(moves ?? 20), [moves]);

  const [board, setBoard] = useState<Cell[][]>([]);
  const [selectedPath, setSelectedPath] = useState<Cell[]>([]);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(parsedMoves);
  const [selectionMessage, setSelectionMessage] = useState(
    'Bir harfe dokunarak seçim başlat.'
  );
  const [foundWords, setFoundWords] = useState<string[]>([]);

  const currentWord = useMemo(() => buildWordFromPath(selectedPath), [selectedPath]);
  const currentWordScore = useMemo(
    () => calculateWordScore(currentWord.toLocaleUpperCase('tr-TR')),
    [currentWord]
  );

  useEffect(() => {
    const newBoard = generateBoard(parsedGridSize);
    setBoard(newBoard);
    setSelectedPath([]);
    setScore(0);
    setMovesLeft(parsedMoves);
    setFoundWords([]);
    setSelectionMessage('Bir harfe dokunarak seçim başlat.');
  }, [parsedGridSize, parsedMoves]);

  const syncSelection = (nextPath: Cell[], baseBoard?: Cell[][]) => {
    const boardToUse = baseBoard ?? board;
    setSelectedPath(nextPath);
    setBoard(applyPathSelection(boardToUse, nextPath));
  };

  const clearSelection = () => {
    syncSelection([]);
    setSelectionMessage('Seçim temizlendi.');
  };

  const regenerateBoard = () => {
    const newBoard = generateBoard(parsedGridSize);
    setBoard(newBoard);
    setSelectedPath([]);
    setSelectionMessage('Tahta yeniden üretildi.');
  };

  const consumeMove = () => {
    setMovesLeft((prev) => Math.max(prev - 1, 0));
  };

  const handleTilePress = (cell: Cell) => {
    if (movesLeft <= 0) {
      setSelectionMessage('Hamle kalmadı. Yeni oyun başlatmalısın.');
      return;
    }

    if (selectedPath.length === 0) {
      syncSelection([cell]);
      setSelectionMessage('Seçim başladı.');
      return;
    }

    const lastCell = selectedPath[selectedPath.length - 1];

    if (isSameCell(cell, lastCell)) {
      const shortenedPath = selectedPath.slice(0, -1);
      syncSelection(shortenedPath);

      if (shortenedPath.length === 0) {
        setSelectionMessage('Seçim geri alındı.');
      } else {
        setSelectionMessage('Son seçim geri alındı.');
      }
      return;
    }

    if (isCellInPath(cell, selectedPath)) {
      setSelectionMessage('Aynı hücre aynı kelimede tekrar kullanılamaz.');
      return;
    }

    if (!areAdjacent(lastCell, cell)) {
      setSelectionMessage('Sadece komşu hücreler seçilebilir.');
      return;
    }

    const nextPath = [...selectedPath, cell];
    syncSelection(nextPath);
    setSelectionMessage('Komşu harf seçildi.');
  };

  const handlePreviewSubmit = () => {
    if (movesLeft <= 0) {
      setSelectionMessage('Hamle kalmadı. Yeni oyun başlatmalısın.');
      return;
    }

    if (selectedPath.length === 0) {
      setSelectionMessage('Önce bir kelime yolu seçmelisin.');
      return;
    }

    const normalizedWord = dictionaryService.normalizeWord(currentWord);

    consumeMove();

    if (normalizedWord.length < 3) {
      syncSelection([]);
      setSelectionMessage('Geçersiz seçim: en az 3 harf seçmelisin. 1 hamle harcandı.');
      return;
    }

    if (foundWords.includes(normalizedWord)) {
      syncSelection([]);
      setSelectionMessage(
        `Bu sprintte aynı kelimeye tekrar puan verilmiyor: ${normalizedWord}. 1 hamle harcandı.`
      );
      return;
    }

    const isValid = dictionaryService.isValidWord(normalizedWord);

    if (!isValid) {
      syncSelection([]);
      setSelectionMessage(
        `Kelime sözlükte bulunamadı: ${normalizedWord}. 1 hamle harcandı.`
      );
      return;
    }

    const gainedScore = calculateWordScore(normalizedWord);
    const nextBoard = resolveBoardAfterMatch(board, selectedPath);

    setScore((prev) => prev + gainedScore);
    setFoundWords((prev) => [normalizedWord, ...prev]);
    syncSelection([], nextBoard);

    setSelectionMessage(
      `Geçerli kelime: ${normalizedWord}. +${gainedScore} puan kazandın ve harfler patlatıldı.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Oyun Ekranı</Text>
      <Text style={styles.subtitle}>
        Bu sprintte geçerli kelimede patlatma, düşme ve yeni harf doldurma aktif.
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
          <Text style={styles.infoLabel}>Kalan Hamle</Text>
          <Text style={styles.infoValue}>{movesLeft}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Skor</Text>
          <Text style={styles.infoValue}>{score}</Text>
        </View>
      </View>

      <View style={styles.wordCard}>
        <Text style={styles.wordLabel}>Seçilen Kelime</Text>
        <Text style={styles.wordValue}>{currentWord || '-'}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Harf Sayısı: {selectedPath.length}</Text>
          <Text style={styles.metaText}>Önizleme Puanı: {currentWordScore}</Text>
        </View>

        <Text style={styles.messageText}>{selectionMessage}</Text>
      </View>

      <View style={styles.boardSection}>
        {board.length > 0 && <GameGrid board={board} onTilePress={handleTilePress} />}
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={clearSelection}>
          <Text style={styles.secondaryButtonText}>Seçimi Temizle</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={handlePreviewSubmit}>
          <Text style={styles.primaryButtonText}>Kelimeyi Gönder</Text>
        </Pressable>
      </View>

      <Pressable style={styles.regenerateButton} onPress={regenerateBoard}>
        <Text style={styles.regenerateButtonText}>Tahtayı Yeniden Üret</Text>
      </Pressable>

      <View style={styles.foundWordsCard}>
        <Text style={styles.noteTitle}>Bulunan Kelimeler</Text>
        {foundWords.length === 0 ? (
          <Text style={styles.emptyText}>Henüz geçerli bir kelime bulunmadı.</Text>
        ) : (
          foundWords.map((word, index) => (
            <View key={`${word}-${index}`} style={styles.wordRow}>
              <Text style={styles.wordRowText}>{word}</Text>
              <Text style={styles.wordRowScore}>+{calculateWordScore(word)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Bu sprintte aktif olanlar</Text>
        <Text style={styles.noteText}>• Geçerli kelimede harfler siliniyor</Text>
        <Text style={styles.noteText}>• Üstteki harfler aşağı düşüyor</Text>
        <Text style={styles.noteText}>• Boş kalan yerlere yeni harf geliyor</Text>
        <Text style={styles.noteText}>• Oyun artık gerçek akışa yaklaştı</Text>
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
  wordCard: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  wordLabel: {
    fontSize: 13,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  wordValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primaryDark,
    minHeight: 36,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  messageText: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.mutedText,
    lineHeight: 20,
  },
  boardSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  regenerateButton: {
    marginTop: 12,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  foundWordsCard: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  wordRowText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  wordRowScore: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mutedText,
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