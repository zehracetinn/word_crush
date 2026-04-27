import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import GameGrid from '../src/components/GameGrid';
import { calculateWordScore } from '../src/constants/letter-scores';
import { GameResult } from '../src/models/game-result';
import { Cell } from '../src/models/cell';
import { dictionaryService } from '../src/services/dictionary.service';
import { storageService } from '../src/services/storage.service';
import { COLORS } from '../src/theme/colors';

import { resolveBoardAfterMatch } from '../src/utils/board-actions';
import { getSpecialLabel, getSpecialName, getSpecialTypeForWordLength } from '../src/utils/powerups';
import { analyzeBoard } from '../src/utils/board-analyzer';
import { generateSmartPlayableBoard } from '../src/utils/smart-board-generator';
import JokerBar from '../src/components/JokerBar';
import { JokerId, JOKER_MAP } from '../src/constants/joker-definitions';
import { useAppStore } from '../src/store/app-store';


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
  const [dictionaryReady, setDictionaryReady] = useState(false);
  const [possibleWordCount, setPossibleWordCount] = useState(0);
  const [isBoardPreparing, setIsBoardPreparing] = useState(true);
  const [isFinishingGame, setIsFinishingGame] = useState(false);

  const gameStartedAtRef = useRef<number>(Date.now());
  const selectedPathRef = useRef<Cell[]>([]);
const dragMovedRef = useRef(false);
const [selectedJokerId, setSelectedJokerId] = useState<JokerId | null>(null);
const { profile, refreshProfile } = useAppStore();

  const currentWord = useMemo(() => buildWordFromPath(selectedPath), [selectedPath]);
  const currentWordScore = useMemo(
    () => calculateWordScore(currentWord.toLocaleUpperCase('tr-TR')),
    [currentWord]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await dictionaryService.init();
        if (mounted) {
          setDictionaryReady(true);
          console.log('Sözlük hazır. Kelime sayısı:', dictionaryService.getWordCount());
        }
      } catch (error) {
        console.error('Sözlük yüklenemedi:', error);
        if (mounted) {
          setDictionaryReady(false);
          setSelectionMessage('Sözlük yüklenemedi.');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
  void refreshProfile();
}, [refreshProfile]);

  const syncSelection = (nextPath: Cell[], baseBoard?: Cell[][]) => {
  const boardToUse = baseBoard ?? board;
  selectedPathRef.current = nextPath;
  setSelectedPath(nextPath);
  setBoard(applyPathSelection(boardToUse, nextPath));
};

  const prepareFreshBoard = (customMessage?: string) => {
    if (!dictionaryReady) return;

    setIsBoardPreparing(true);

    const { board: playableBoard, analysis, guaranteedWord } = generateSmartPlayableBoard(parsedGridSize);

    selectedPathRef.current = [];
    setBoard(applyPathSelection(playableBoard, []));
    setSelectedPath([]);
    setPossibleWordCount(analysis.possibleWordCount);
    setIsBoardPreparing(false);

    if (customMessage) {
  setSelectionMessage(customMessage);
} else {
  setSelectionMessage(
    guaranteedWord
      ? `Tahta hazır. Uzun kelime fırsatı yerleştirildi: ${guaranteedWord.length} harf.`
      : analysis.possibleWordCount > 0
      ? `Tahta hazır. Yaklaşık ${analysis.possibleWordCount} oynanabilir kelime var.`
      : 'Tahta üretildi.'
  );
}
  };

  useEffect(() => {
    if (!dictionaryReady) return;

    gameStartedAtRef.current = Date.now();
    setScore(0);
    setMovesLeft(parsedMoves);
    setFoundWords([]);
    prepareFreshBoard('Yeni oyun hazırlandı.');
  }, [parsedGridSize, parsedMoves, dictionaryReady]);

  const clearSelection = () => {
    syncSelection([]);
    setSelectionMessage('Seçim temizlendi.');
  };
  const handleSelectJoker = (jokerId: JokerId) => {
  setSelectedJokerId((prev) => {
    const next = prev === jokerId ? null : jokerId;

    if (next) {
      setSelectionMessage(`Seçilen joker: ${JOKER_MAP[next].name}. Etkiyi bir sonraki sprintte bağlayacağız.`);
    } else {
      setSelectionMessage('Joker seçimi kaldırıldı.');
    }

    return next;
  });
};

  const regenerateBoard = () => {
    if (!dictionaryReady) {
      setSelectionMessage('Sözlük henüz hazır değil.');
      return;
    }

    prepareFreshBoard('Tahta yeniden üretildi.');
  };

  const buildGameResult = (
    finalScore: number,
    finalWords: string[]
  ): GameResult => {
    const durationSeconds = Math.max(
      1,
      Math.floor((Date.now() - gameStartedAtRef.current) / 1000)
    );

    const longestWord =
      finalWords.reduce((best, current) => {
        return current.length > best.length ? current : best;
      }, '') || '-';

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playedAt: new Date().toISOString(),
      gridSize: parsedGridSize,
      difficulty: String(difficulty ?? '-'),
      score: finalScore,
      wordCount: finalWords.length,
      longestWord,
      durationSeconds,
    };
  };

  const finishGame = async (
    finalScore: number,
    finalWords: string[]
  ) => {
    if (isFinishingGame) return;

    try {
      setIsFinishingGame(true);

      const result = buildGameResult(finalScore, finalWords);
      await storageService.saveGameResult(result);

      router.replace('/home');
    } catch (error) {
      console.error('Oyun sonucu kaydedilemedi:', error);
      setSelectionMessage('Oyun sonucu kaydedilemedi.');
    } finally {
      setIsFinishingGame(false);
    }
  };
    const confirmExitGame = () => {
    if (isFinishingGame) return;

    Alert.alert(
      'Oyundan çık',
      'Çıkmak istediğine emin misin? Mevcut sonuç kaydedilecek.',
      [
        {
          text: 'Hayır',
          style: 'cancel',
        },
        {
          text: 'Evet',
          style: 'destructive',
          onPress: () => {
            void finishGame(score, foundWords);
          },
        },
      ]
    );
  };
    useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        confirmExitGame();
        return true;
      }
    );

    return () => subscription.remove();
  }, [score, foundWords, isFinishingGame]);

    const processCellSelection = (cell: Cell, mode: 'tap' | 'drag'): boolean => {
  if (isBoardPreparing || isFinishingGame) {
    setSelectionMessage('Tahta hazırlanıyor, biraz bekle.');
    return false;
  }

  if (movesLeft <= 0) {
    setSelectionMessage('Hamle kalmadı. Yeni oyun başlatmalısın.');
    return false;
  }

  if (!dictionaryReady) {
    setSelectionMessage('Sözlük henüz yükleniyor, biraz bekle.');
    return false;
  }

  if (selectedPathRef.current.length === 0) {
    syncSelection([cell]);
    setSelectionMessage(mode === 'drag' ? 'Sürükleme başladı.' : 'Seçim başladı.');
    return true;
  }

  const lastCell = selectedPathRef.current[selectedPathRef.current.length - 1];

  if (isSameCell(cell, lastCell)) {
    return false;
  }

  if (isCellInPath(cell, selectedPathRef.current)) {
    return false;
  }

  if (!areAdjacent(lastCell, cell)) {
    if (mode === 'tap') {
      setSelectionMessage('Sadece komşu hücreler seçilebilir.');
    }
    return false;
  }

  const nextPath = [...selectedPathRef.current, cell];
  syncSelection(nextPath);
  setSelectionMessage(
    mode === 'drag' ? 'Sürükleyerek seçim devam ediyor.' : 'Komşu harf seçildi.'
  );
  return true;
};

  const handleTilePress = (cell: Cell) => {
  processCellSelection(cell, 'tap');
};

const handleDragStart = (cell: Cell) => {
  dragMovedRef.current = false;
  processCellSelection(cell, 'drag');
};

const handleDragMove = (cell: Cell) => {
  const changed = processCellSelection(cell, 'drag');
  if (changed) {
    dragMovedRef.current = true;
  }
};

const handleDragEnd = () => {
  const path = selectedPathRef.current;

  if (path.length === 0) return;

  if (!dragMovedRef.current) {
    setSelectionMessage('Seçim hazır. İstersen kelimeyi gönder.');
    return;
  }

  if (path.length < 3) {
    setSelectionMessage('Sürükleme bitti. Geçerli deneme için en az 3 harf gerekli.');
    return;
  }

  setSelectionMessage('Sürükleme bitti. Kelime otomatik gönderiliyor...');
  void handlePreviewSubmit(path);
};

  const handlePreviewSubmit = async (pathOverride?: Cell[]) => {
    if (!dictionaryReady) {
      setSelectionMessage('Sözlük henüz hazır değil. Lütfen biraz bekle.');
      return;
    }

    if (isBoardPreparing || isFinishingGame) {
      setSelectionMessage('Tahta hazırlanıyor, biraz bekle.');
      return;
    }

    if (movesLeft <= 0) {
      setSelectionMessage('Hamle kalmadı. Yeni oyun başlatmalısın.');
      return;
    }

    const pathToUse = pathOverride ?? selectedPathRef.current;

if (pathToUse.length === 0) {
  setSelectionMessage('Önce bir kelime yolu seçmelisin.');
  return;
}

const normalizedWord = dictionaryService.normalizeWord(buildWordFromPath(pathToUse));
    const nextMovesLeft = Math.max(movesLeft - 1, 0);
    setMovesLeft(nextMovesLeft);

    if (normalizedWord.length < 3) {
      syncSelection([]);
      setSelectionMessage('Geçersiz seçim: en az 3 harf seçmelisin. 1 hamle harcandı.');

      if (nextMovesLeft === 0) {
        await finishGame(score, foundWords);
      }
      return;
    }

    if (foundWords.includes(normalizedWord)) {
      syncSelection([]);
      setSelectionMessage(
        `Bu sprintte aynı kelimeye tekrar puan verilmiyor: ${normalizedWord}. 1 hamle harcandı.`
      );

      if (nextMovesLeft === 0) {
        await finishGame(score, foundWords);
      }
      return;
    }

    const isValid = dictionaryService.isValidWord(normalizedWord);

    if (!isValid) {
      syncSelection([]);
      setSelectionMessage(
        `Kelime sözlükte bulunamadı: ${normalizedWord}. 1 hamle harcandı.`
      );

      if (nextMovesLeft === 0) {
        await finishGame(score, foundWords);
      }
      return;
    }

    const gainedScore = calculateWordScore(normalizedWord);
    const nextScore = score + gainedScore;
    const nextFoundWords = [normalizedWord, ...foundWords];

    const createdSpecialType = getSpecialTypeForWordLength(normalizedWord.length);
    const activatedSpecialCells = pathToUse.filter((item) => !!item.specialType);

    const matchedBoard = resolveBoardAfterMatch(board, pathToUse, {
    createdSpecialType,
    activatedSpecialCells,
    });

const analysis = analyzeBoard(matchedBoard);

    setScore(nextScore);
    setFoundWords(nextFoundWords);

    if (nextMovesLeft === 0) {
      await finishGame(nextScore, nextFoundWords);
      return;
    }

    if (analysis.possibleWordCount === 0) {
      const { board: playableBoard, analysis: newAnalysis } =
  generateSmartPlayableBoard(parsedGridSize);

      setBoard(applyPathSelection(playableBoard, []));
      setSelectedPath([]);
      setPossibleWordCount(newAnalysis.possibleWordCount);

      const createdSpecialText = createdSpecialType
  ? ` Yeni özel taş: ${getSpecialName(createdSpecialType)} ${getSpecialLabel(createdSpecialType)}.`
  : '';

    const activatedSpecialText =
    activatedSpecialCells.length > 0
        ? ` ${activatedSpecialCells.length} özel güç tetiklendi.`
        : '';

    setSelectionMessage(
    `Geçerli kelime: ${normalizedWord}. +${gainedScore} puan kazandın.${createdSpecialText}${activatedSpecialText} Tahtada kelime kalmadığı için yeni tahta üretildi.`
    );
      return;
    }

    setPossibleWordCount(analysis.possibleWordCount);
    syncSelection([], matchedBoard);
    
    const createdSpecialText = createdSpecialType
  ? ` Yeni özel taş: ${getSpecialName(createdSpecialType)} ${getSpecialLabel(createdSpecialType)}.`
  : '';

    const activatedSpecialText =
    activatedSpecialCells.length > 0
        ? ` ${activatedSpecialCells.length} özel güç tetiklendi.`
        : '';

    setSelectionMessage(
    `Geçerli kelime: ${normalizedWord}. +${gainedScore} puan kazandın.${createdSpecialText}${activatedSpecialText}`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={confirmExitGame}>
        <Text style={styles.backButtonText}>← Oyundan Çık</Text>
        </Pressable>

      <Text style={styles.title}>Oyun Ekranı</Text>
      <Text style={styles.subtitle}>
        Bu sprintte tahta analiz motoru, oyun bitişi ve skor kaydı aktif.
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

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sözlük</Text>
          <Text style={styles.infoValue}>{dictionaryReady ? 'Hazır' : 'Yükleniyor'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Olası Kelime</Text>
          <Text style={styles.infoValue}>{possibleWordCount}</Text>
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
        {board.length > 0 && (
  <GameGrid
    board={board}
    onTilePress={handleTilePress}
    onDragStart={handleDragStart}
    onDragMove={handleDragMove}
    onDragEnd={handleDragEnd}
  />
)}
      </View>
      {profile && (
  <JokerBar
    ownedJokers={profile.ownedJokers ?? {}}
    selectedJokerId={selectedJokerId}
    onSelect={handleSelectJoker}
  />
)}

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={clearSelection}>
          <Text style={styles.secondaryButtonText}>Seçimi Temizle</Text>
        </Pressable>

        <Pressable
          style={[
            styles.primaryButton,
            (!dictionaryReady || isBoardPreparing || isFinishingGame) &&
              styles.disabledButton,
          ]}
          onPress={() => void handlePreviewSubmit()} 
          disabled={!dictionaryReady || isBoardPreparing || isFinishingGame}
        >
          <Text style={styles.primaryButtonText}>Kelimeyi Gönder</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.regenerateButton, (isBoardPreparing || isFinishingGame) && styles.disabledButton]}
        onPress={regenerateBoard}
        disabled={isBoardPreparing || isFinishingGame}
      >
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
        <Text style={styles.noteText}>• Hamle bitince oyun sonucu kaydediliyor</Text>
        <Text style={styles.noteText}>• Sonuç ana ekrana dönmeden önce saklanıyor</Text>
        <Text style={styles.noteText}>• Skor tablosu artık gerçek veriden besleniyor</Text>
        <Text style={styles.noteText}>• Oyun geçmişi listeleniyor</Text>
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
  disabledButton: {
    opacity: 0.5,
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
  noteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
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
  noteText: {
    fontSize: 14,
    color: COLORS.text,
  },
});