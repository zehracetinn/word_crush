import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import GameGrid from '../src/components/GameGrid';
import JokerBar from '../src/components/JokerBar';
import { JokerId, JOKER_MAP } from '../src/constants/joker-definitions';
import { calculateWordScore } from '../src/constants/letter-scores';
import { GameResult } from '../src/models/game-result';
import { Cell } from '../src/models/cell';
import { dictionaryService } from '../src/services/dictionary.service';
import { storageService } from '../src/services/storage.service';
import { useAppStore } from '../src/store/app-store';
import { COLORS } from '../src/theme/colors';
import {
  resolveBoardAfterMatch,
  resolveBoardAfterRandomRemoval,
  resolveBoardAfterRowAndColumnRemoval,
  resolveBoardAfterSingleCellRemoval,
  shuffleBoardForJoker,
  swapBoardCells,
} from '../src/utils/board-actions';
import { analyzeBoard } from '../src/utils/board-analyzer';
import {
  getSpecialLabel,
  getSpecialName,
  getSpecialTypeForWordLength,
} from '../src/utils/powerups';
import {
  applyPathSelection,
  areAdjacent,
  buildWordFromPath,
  isCellInPath,
  isSameCell,
} from '../src/utils/selection';
import { generateSmartPlayableBoard } from '../src/utils/smart-board-generator';
import { analyzeComboWords, type ComboAnalysis } from '../src/utils/combo';

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
  const [selectedJokerId, setSelectedJokerId] = useState<JokerId | null>(null);
  const [isApplyingJoker, setIsApplyingJoker] = useState(false);
  const [lastComboAnalysis, setLastComboAnalysis] = useState<ComboAnalysis | null>(null);

  const gameStartedAtRef = useRef<number>(Date.now());
  const selectedPathRef = useRef<Cell[]>([]);
  const dragMovedRef = useRef(false);
  const lastTargetedJokerGestureAtRef = useRef(0);

  const { profile, refreshProfile, consumeJoker } = useAppStore();

  const currentWord = useMemo(() => buildWordFromPath(selectedPath), [selectedPath]);
  const currentWordScore = useMemo(
    () => calculateWordScore(currentWord.toLocaleUpperCase('tr-TR')),
    [currentWord]
  );
  const isInteractionLocked = isBoardPreparing || isFinishingGame || isApplyingJoker;

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

    const {
      board: playableBoard,
      analysis,
      guaranteedWord,
    } = generateSmartPlayableBoard(parsedGridSize);

    dragMovedRef.current = false;
    syncSelection([], playableBoard);
    setPossibleWordCount(analysis.possibleWordCount);
    setIsBoardPreparing(false);

    if (customMessage) {
      setSelectionMessage(customMessage);
      return;
    }

    setSelectionMessage(
      guaranteedWord
        ? `Tahta hazır. Uzun kelime fırsatı yerleştirildi: ${guaranteedWord.length} harf.`
        : analysis.possibleWordCount > 0
          ? `Tahta hazır. Yaklaşık ${analysis.possibleWordCount} oynanabilir kelime var.`
          : 'Tahta üretildi.'
    );
  };

  useEffect(() => {
    if (!dictionaryReady) return;

    gameStartedAtRef.current = Date.now();
    setScore(0);
    setMovesLeft(parsedMoves);
    setFoundWords([]);
    setLastComboAnalysis(null);
    setSelectedJokerId(null);
    prepareFreshBoard('Yeni oyun hazırlandı.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedGridSize, parsedMoves, dictionaryReady]);

  const clearSelection = () => {
    syncSelection([]);
    setSelectionMessage('Seçim temizlendi.');
  };

  const getComboSummaryText = (comboAnalysis: ComboAnalysis): string => {
    if (!comboAnalysis.hasCombo) {
      return ' Combo bulunamadı.';
    }

    return ` Combo: ${comboAnalysis.bonusWords.join(', ')}. Ek +${comboAnalysis.bonusScore} puan.`;
  };

  const getActiveJokerInstruction = (jokerId: JokerId): string => {
    switch (jokerId) {
      case 'fish':
        return 'Gridde birkaç harfi temizlemek için aşağıdaki uygula butonunu kullan.';
      case 'wheel':
        return 'Bir hücreye dokun. O hücrenin satırı ve sütunu temizlenecek.';
      case 'lollipop':
        return 'Bir hücreye dokun. Seçilen tek harf silinip tahta aşağı düşecek.';
      case 'swap':
        return 'Önce bir hücre, sonra ona komşu ikinci hücreyi seç. Seçilen iki hücre yer değiştirecek.';
      case 'shuffle':
        return 'Tahtadaki harfleri karıştırmak için aşağıdaki uygula butonunu kullan.';
      case 'party':
        return 'Tüm gridi sıfırlayıp oynanabilir yeni tahta kurmak için aşağıdaki uygula butonunu kullan.';
      default:
        return 'Etkiyi bir sonraki sprintte bağlayacağız.';
    }
  };

  const handleSelectJoker = (jokerId: JokerId) => {
    const nextJokerId = selectedJokerId === jokerId ? null : jokerId;

    if (
      selectedJokerId === 'swap' ||
      nextJokerId === 'fish' ||
      nextJokerId === 'wheel' ||
      nextJokerId === 'lollipop' ||
      nextJokerId === 'swap' ||
      nextJokerId === 'shuffle' ||
      nextJokerId === 'party'
    ) {
      dragMovedRef.current = false;
      syncSelection([]);
    }

    setSelectedJokerId(nextJokerId);
    setSelectionMessage(
      nextJokerId
        ? `Seçilen joker: ${JOKER_MAP[nextJokerId].name}. ${getActiveJokerInstruction(nextJokerId)}`
        : 'Joker seçimi kaldırıldı.'
    );
  };

  const regenerateBoard = () => {
    if (!dictionaryReady) {
      setSelectionMessage('Sözlük henüz hazır değil.');
      return;
    }

    setLastComboAnalysis(null);
    prepareFreshBoard('Tahta yeniden üretildi.');
  };

  const buildGameResult = (finalScore: number, finalWords: string[]): GameResult => {
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

  const finishGame = async (finalScore: number, finalWords: string[]) => {
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
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExitGame();
      return true;
    });

    return () => subscription.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, foundWords, isFinishingGame]);

  const ensureJokerReady = (jokerId: JokerId): boolean => {
    if (isInteractionLocked) {
      setSelectionMessage('Joker uygulanıyor veya tahta hazırlanıyor, biraz bekle.');
      return false;
    }

    if (!dictionaryReady) {
      setSelectionMessage('Sözlük henüz hazır değil.');
      return false;
    }

    if (movesLeft <= 0) {
      setSelectionMessage('Hamle kalmadı. Joker artık kullanılamaz.');
      return false;
    }

    if (board.length === 0) {
      setSelectionMessage('Tahta henüz hazır değil.');
      return false;
    }

    if (!profile) {
      setSelectionMessage('Profil yüklenemedi.');
      return false;
    }

    const ownedCount = profile.ownedJokers?.[jokerId] ?? 0;

    if (ownedCount <= 0) {
      setSelectedJokerId(null);
      setSelectionMessage(`${JOKER_MAP[jokerId].name} envanterinde kalmadı.`);
      return false;
    }

    return true;
  };

  const processCellSelection = (cell: Cell, mode: 'tap' | 'drag'): boolean => {
    if (isInteractionLocked) {
      setSelectionMessage('Tahta hazırlanıyor veya joker uygulanıyor, biraz bekle.');
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

    if (isSameCell(cell, lastCell) || isCellInPath(cell, selectedPathRef.current)) {
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

  const getFishRemovalCount = (size: number): number => {
    return Math.min(5, Math.max(3, Math.floor((size * size) / 16)));
  };

  const applyFishJoker = async () => {
    if (!ensureJokerReady('fish')) {
      return;
    }

    try {
      setIsApplyingJoker(true);

      const removalCount = getFishRemovalCount(board.length);
      const { board: nextBoard, removedCells } = resolveBoardAfterRandomRemoval(
        board,
        removalCount
      );
      const analysis = analyzeBoard(nextBoard);

      await consumeJoker('fish');

      setSelectedJokerId(null);

      if (analysis.possibleWordCount === 0) {
        const fallback = generateSmartPlayableBoard(board.length);
        setPossibleWordCount(fallback.analysis.possibleWordCount);
        syncSelection([], fallback.board);
        setSelectionMessage(
          `Balık kullanıldı. ${removedCells.length} rastgele harf silindi ve tahta oynanabilir kalsın diye yeniden kuruldu.`
        );
        return;
      }

      setPossibleWordCount(analysis.possibleWordCount);
      syncSelection([], nextBoard);
      setSelectionMessage(
        `Balık kullanıldı. ${removedCells.length} rastgele harf silindi, gravity ve refill uygulandı.`
      );
    } catch (error) {
      console.error('Balık kullanılamadı:', error);
      setSelectionMessage('Balık uygulanamadı.');
    } finally {
      setIsApplyingJoker(false);
    }
  };

  const applyLollipopJoker = async (cell: Cell) => {
    if (!ensureJokerReady('lollipop')) {
      return;
    }

    try {
      setIsApplyingJoker(true);

      const nextBoard = resolveBoardAfterSingleCellRemoval(board, cell);
      const analysis = analyzeBoard(nextBoard);

      await consumeJoker('lollipop');

      setSelectedJokerId(null);

      if (analysis.possibleWordCount === 0) {
        const fallback = generateSmartPlayableBoard(board.length);
        setPossibleWordCount(fallback.analysis.possibleWordCount);
        syncSelection([], fallback.board);
        setSelectionMessage(
          `Lolipop Kırıcı kullanıldı. ${cell.letter} harfi silindi ve tahta oynanabilir kalsın diye yeniden kuruldu.`
        );
        return;
      }

      setPossibleWordCount(analysis.possibleWordCount);
      syncSelection([], nextBoard);
      setSelectionMessage(
        `Lolipop Kırıcı kullanıldı. ${cell.letter} harfi silindi, gravity ve refill uygulandı.`
      );
    } catch (error) {
      console.error('Lolipop Kırıcı kullanılamadı:', error);
      setSelectionMessage('Lolipop Kırıcı uygulanamadı.');
    } finally {
      setIsApplyingJoker(false);
    }
  };

  const applyWheelJoker = async (cell: Cell) => {
    if (!ensureJokerReady('wheel')) {
      return;
    }

    try {
      setIsApplyingJoker(true);

      const nextBoard = resolveBoardAfterRowAndColumnRemoval(board, cell);
      const analysis = analyzeBoard(nextBoard);

      await consumeJoker('wheel');

      setSelectedJokerId(null);

      if (analysis.possibleWordCount === 0) {
        const fallback = generateSmartPlayableBoard(board.length);
        setPossibleWordCount(fallback.analysis.possibleWordCount);
        syncSelection([], fallback.board);
        setSelectionMessage(
          `Tekerlek kullanıldı. ${cell.letter} harfinin satır ve sütunu temizlendi; tahta oynanabilir kalsın diye yeniden kuruldu.`
        );
        return;
      }

      setPossibleWordCount(analysis.possibleWordCount);
      syncSelection([], nextBoard);
      setSelectionMessage(
        `Tekerlek kullanıldı. ${cell.letter} harfinin satır ve sütunu temizlendi, gravity ve refill uygulandı.`
      );
    } catch (error) {
      console.error('Tekerlek kullanılamadı:', error);
      setSelectionMessage('Tekerlek uygulanamadı.');
    } finally {
      setIsApplyingJoker(false);
    }
  };

  const applySwapJoker = async (firstCell: Cell, secondCell: Cell) => {
    if (!ensureJokerReady('swap')) {
      return;
    }

    try {
      setIsApplyingJoker(true);

      const nextBoard = swapBoardCells(board, firstCell, secondCell);
      const analysis = analyzeBoard(nextBoard);

      await consumeJoker('swap');

      setSelectedJokerId(null);

      if (analysis.possibleWordCount === 0) {
        const fallback = generateSmartPlayableBoard(board.length);
        setPossibleWordCount(fallback.analysis.possibleWordCount);
        syncSelection([], fallback.board);
        setSelectionMessage(
          'Serbest Değiştirme kullanıldı. Komşu iki hücre yer değiştirdi; tahta oynanabilir kalsın diye yeni tahta kuruldu.'
        );
        return;
      }

      setPossibleWordCount(analysis.possibleWordCount);
      syncSelection([], nextBoard);
      setSelectionMessage(
        'Serbest Değiştirme kullanıldı. Seçilen komşu iki hücre yer değiştirdi.'
      );
    } catch (error) {
      console.error('Serbest Değiştirme kullanılamadı:', error);
      setSelectionMessage('Serbest Değiştirme uygulanamadı.');
    } finally {
      setIsApplyingJoker(false);
    }
  };

  const handleSwapCellSelection = async (cell: Cell) => {
    if (!ensureJokerReady('swap')) {
      return;
    }

    const firstCell = selectedPathRef.current[0];

    if (!firstCell) {
      syncSelection([cell]);
      setSelectionMessage(
        `Serbest Değiştirme: ilk hücre seçildi (${cell.letter}). Şimdi komşu ikinci hücreyi seç.`
      );
      return;
    }

    if (isSameCell(cell, firstCell)) {
      syncSelection([]);
      setSelectionMessage('Serbest Değiştirme için ilk seçim kaldırıldı.');
      return;
    }

    if (!areAdjacent(firstCell, cell)) {
      setSelectionMessage('Serbest Değiştirme için ikinci hücre ilk seçime komşu olmalı.');
      return;
    }

    await applySwapJoker(firstCell, cell);
  };

  const applyShuffleJoker = async () => {
    if (!ensureJokerReady('shuffle')) {
      return;
    }

    try {
      setIsApplyingJoker(true);

      const { board: shuffledBoard, analysis, usedFallback } = shuffleBoardForJoker(board);

      await consumeJoker('shuffle');

      setSelectedJokerId(null);
      setPossibleWordCount(analysis.possibleWordCount);
      syncSelection([], shuffledBoard);
      setSelectionMessage(
        usedFallback
          ? 'Harf Karıştırma kullanıldı. Oynanabilir düzen bulunamadığı için yeni oynanabilir tahta kuruldu.'
          : 'Harf Karıştırma kullanıldı. Tahtadaki harfler karıştırıldı.'
      );
    } catch (error) {
      console.error('Harf Karıştırma kullanılamadı:', error);
      setSelectionMessage('Harf Karıştırma uygulanamadı.');
    } finally {
      setIsApplyingJoker(false);
    }
  };

  const applyPartyJoker = async () => {
    if (!ensureJokerReady('party')) {
      return;
    }

    try {
      setIsApplyingJoker(true);

      const {
        board: playableBoard,
        analysis,
        guaranteedWord,
      } = generateSmartPlayableBoard(board.length);

      await consumeJoker('party');

      setSelectedJokerId(null);
      setPossibleWordCount(analysis.possibleWordCount);
      syncSelection([], playableBoard);
      setSelectionMessage(
        guaranteedWord
          ? `Parti Güçlendiricisi kullanıldı. Tüm grid yenilendi ve ${guaranteedWord.length} harflik oynanabilir fırsat yerleştirildi.`
          : 'Parti Güçlendiricisi kullanıldı. Tüm grid temizlenip oynanabilir yeni tahta kuruldu.'
      );
    } catch (error) {
      console.error('Parti Güçlendiricisi kullanılamadı:', error);
      setSelectionMessage('Parti Güçlendiricisi uygulanamadı.');
    } finally {
      setIsApplyingJoker(false);
    }
  };

  const shouldIgnoreRecentTargetedJokerTap = (): boolean => {
    if (Date.now() - lastTargetedJokerGestureAtRef.current >= 300) {
      return false;
    }

    lastTargetedJokerGestureAtRef.current = 0;
    return true;
  };

  const handleApplySelectedJoker = () => {
    if (selectedJokerId === 'fish') {
      void applyFishJoker();
      return;
    }

    if (selectedJokerId === 'shuffle') {
      void applyShuffleJoker();
      return;
    }

    if (selectedJokerId === 'party') {
      void applyPartyJoker();
    }
  };

  const handleTilePress = (cell: Cell) => {
    if (shouldIgnoreRecentTargetedJokerTap()) {
      return;
    }

    if (selectedJokerId === 'lollipop') {
      void applyLollipopJoker(cell);
      return;
    }

    if (selectedJokerId === 'wheel') {
      void applyWheelJoker(cell);
      return;
    }

    if (selectedJokerId === 'swap') {
      void handleSwapCellSelection(cell);
      return;
    }

    if (
      selectedJokerId === 'fish' ||
      selectedJokerId === 'shuffle' ||
      selectedJokerId === 'party'
    ) {
      setSelectionMessage(
        `Seçilen joker: ${JOKER_MAP[selectedJokerId].name}. ${getActiveJokerInstruction(selectedJokerId)}`
      );
      return;
    }

    processCellSelection(cell, 'tap');
  };

  const handleDragStart = (cell: Cell) => {
    dragMovedRef.current = false;

    if (
      selectedJokerId === 'lollipop' ||
      selectedJokerId === 'wheel' ||
      selectedJokerId === 'swap'
    ) {
      lastTargetedJokerGestureAtRef.current = Date.now();

      if (selectedJokerId === 'lollipop') {
        void applyLollipopJoker(cell);
      } else if (selectedJokerId === 'wheel') {
        void applyWheelJoker(cell);
      } else {
        void handleSwapCellSelection(cell);
      }
      return;
    }

    if (
      selectedJokerId === 'fish' ||
      selectedJokerId === 'shuffle' ||
      selectedJokerId === 'party'
    ) {
      setSelectionMessage(
        `Seçilen joker: ${JOKER_MAP[selectedJokerId].name}. ${getActiveJokerInstruction(selectedJokerId)}`
      );
      return;
    }

    processCellSelection(cell, 'drag');
  };

  const handleDragMove = (cell: Cell) => {
    if (
      selectedJokerId === 'fish' ||
      selectedJokerId === 'lollipop' ||
      selectedJokerId === 'wheel' ||
      selectedJokerId === 'swap' ||
      selectedJokerId === 'shuffle' ||
      selectedJokerId === 'party'
    ) {
      return;
    }

    const changed = processCellSelection(cell, 'drag');
    if (changed) {
      dragMovedRef.current = true;
    }
  };

  const handleDragEnd = () => {
    if (
      selectedJokerId === 'fish' ||
      selectedJokerId === 'lollipop' ||
      selectedJokerId === 'wheel' ||
      selectedJokerId === 'swap' ||
      selectedJokerId === 'shuffle' ||
      selectedJokerId === 'party'
    ) {
      return;
    }

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

    if (isInteractionLocked) {
      setSelectionMessage('Tahta hazırlanıyor veya joker uygulanıyor, biraz bekle.');
      return;
    }

    if (selectedJokerId === 'swap') {
      setSelectionMessage(
        'Serbest Değiştirme aktif. İkinci komşu hücreyi seç ya da joker seçimini kaldır.'
      );
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

    if (!dictionaryService.isValidWord(normalizedWord)) {
      syncSelection([]);
      setSelectionMessage(
        `Kelime sözlükte bulunamadı: ${normalizedWord}. 1 hamle harcandı.`
      );

      if (nextMovesLeft === 0) {
        await finishGame(score, foundWords);
      }
      return;
    }

    const comboAnalysis = analyzeComboWords(normalizedWord);
    const baseScore = calculateWordScore(normalizedWord);
    const gainedScore = comboAnalysis.totalScore;
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
    setLastComboAnalysis(comboAnalysis);

    if (nextMovesLeft === 0) {
      await finishGame(nextScore, nextFoundWords);
      return;
    }

    const comboSummaryText = getComboSummaryText(comboAnalysis);
    const createdSpecialText = createdSpecialType
      ? ` Yeni özel taş: ${getSpecialName(createdSpecialType)} ${getSpecialLabel(createdSpecialType)}.`
      : '';
    const activatedSpecialText =
      activatedSpecialCells.length > 0
        ? ` ${activatedSpecialCells.length} özel güç tetiklendi.`
        : '';

    if (analysis.possibleWordCount === 0) {
      const fallback = generateSmartPlayableBoard(parsedGridSize);
      setPossibleWordCount(fallback.analysis.possibleWordCount);
      syncSelection([], fallback.board);
      setSelectionMessage(
        `Geçerli kelime: ${normalizedWord}. Ana puan +${baseScore}.${comboSummaryText} Toplam +${gainedScore} puan kazandın.${createdSpecialText}${activatedSpecialText} Tahtada kelime kalmadığı için yeni tahta üretildi.`
      );
      return;
    }

    setPossibleWordCount(analysis.possibleWordCount);
    syncSelection([], matchedBoard);
    setSelectionMessage(
      `Geçerli kelime: ${normalizedWord}. Ana puan +${baseScore}.${comboSummaryText} Toplam +${gainedScore} puan kazandın.${createdSpecialText}${activatedSpecialText}`
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

      {lastComboAnalysis && (
        <View style={styles.comboCard}>
          <Text style={styles.comboTitle}>Son Combo</Text>
          <Text style={styles.comboStatus}>
            {lastComboAnalysis.hasCombo ? 'Combo bulundu' : 'Ek combo bulunamadı'}
          </Text>
          <Text style={styles.comboWords}>
            Kelimeler: {lastComboAnalysis.comboWords.join(', ')}
          </Text>
          <Text style={styles.comboScore}>Ek Combo Puanı: +{lastComboAnalysis.bonusScore}</Text>
        </View>
      )}

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

      {selectedJokerId && (
        <View style={styles.activeJokerCard}>
          <Text style={styles.activeJokerTitle}>Seçili Joker</Text>
          <Text style={styles.activeJokerText}>
            {JOKER_MAP[selectedJokerId].name}: {getActiveJokerInstruction(selectedJokerId)}
          </Text>

          {(selectedJokerId === 'fish' ||
            selectedJokerId === 'shuffle' ||
            selectedJokerId === 'party') && (
            <Pressable
              style={[styles.jokerActionButton, isInteractionLocked && styles.disabledButton]}
              onPress={handleApplySelectedJoker}
              disabled={isInteractionLocked}
            >
              <Text style={styles.jokerActionButtonText}>Seçili Jokeri Uygula</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.secondaryButton, isApplyingJoker && styles.disabledButton]}
          onPress={clearSelection}
          disabled={isApplyingJoker}
        >
          <Text style={styles.secondaryButtonText}>Seçimi Temizle</Text>
        </Pressable>

        <Pressable
          style={[
            styles.primaryButton,
            (!dictionaryReady || isInteractionLocked) && styles.disabledButton,
          ]}
          onPress={() => void handlePreviewSubmit()}
          disabled={!dictionaryReady || isInteractionLocked}
        >
          <Text style={styles.primaryButtonText}>Kelimeyi Gönder</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.regenerateButton, isInteractionLocked && styles.disabledButton]}
        onPress={regenerateBoard}
        disabled={isInteractionLocked}
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
  comboCard: {
    marginTop: 14,
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    gap: 8,
  },
  comboTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  comboStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  comboWords: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  comboScore: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success,
  },
  boardSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  activeJokerCard: {
    marginTop: 14,
    backgroundColor: '#FFF7ED',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
    gap: 10,
  },
  activeJokerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  activeJokerText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  jokerActionButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jokerActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
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
