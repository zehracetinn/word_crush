import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameResult } from '../models/game-result';
import { UserProfile } from '../models/user-profile';
import { JokerId, JOKER_MAP } from '../constants/joker-definitions';

const STORAGE_KEYS = {
  USER_PROFILE: '@word_crush/user_profile',
  GAME_RESULTS: '@word_crush/game_results',
};

const DEFAULT_GOLD = 9999;

async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (error) {
    console.error('Profil okunamadı:', error);
    return null;
  }
}
async function buyJoker(jokerId: JokerId): Promise<UserProfile> {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error('Önce kullanıcı profili oluşturulmalı.');
  }

  const joker = JOKER_MAP[jokerId];

  if (!joker) {
    throw new Error('Geçersiz joker.');
  }

  if (profile.gold < joker.cost) {
    throw new Error('Yetersiz altın.');
  }

  const nextProfile: UserProfile = {
    ...profile,
    gold: profile.gold - joker.cost,
    ownedJokers: {
      ...profile.ownedJokers,
      [jokerId]: (profile.ownedJokers?.[jokerId] ?? 0) + 1,
    },
    updatedAt: new Date().toISOString(),
  };

  await saveUserProfile(nextProfile);
  return nextProfile;
}

async function consumeJoker(jokerId: JokerId): Promise<UserProfile> {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error('Profil bulunamadı.');
  }

  const currentCount = profile.ownedJokers?.[jokerId] ?? 0;

  if (currentCount <= 0) {
    throw new Error('Bu jokerden envanterde yok.');
  }

  const nextProfile: UserProfile = {
    ...profile,
    ownedJokers: {
      ...profile.ownedJokers,
      [jokerId]: currentCount - 1,
    },
    updatedAt: new Date().toISOString(),
  };

  await saveUserProfile(nextProfile);
  return nextProfile;
}
async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Profil kaydedilemedi:', error);
    throw error;
  }
}

async function upsertUsername(username: string): Promise<UserProfile> {
  const trimmed = username.trim();
  const now = new Date().toISOString();
  const existing = await getUserProfile();

  const profile: UserProfile = existing
    ? {
        ...existing,
        username: trimmed,
        updatedAt: now,
      }
    : {
        username: trimmed,
        gold: DEFAULT_GOLD,
        ownedJokers: {},
        createdAt: now,
        updatedAt: now,
      };

  await saveUserProfile(profile);
  return profile;
}

async function clearUserProfile(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
}

async function getGameResults(): Promise<GameResult[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.GAME_RESULTS);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as GameResult[];
    return parsed.sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
  } catch (error) {
    console.error('Oyun sonuçları okunamadı:', error);
    return [];
  }
}

async function saveGameResult(result: GameResult): Promise<void> {
  try {
    const results = await getGameResults();
    const nextResults = [result, ...results].sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );

    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_RESULTS,
      JSON.stringify(nextResults)
    );
  } catch (error) {
    console.error('Oyun sonucu kaydedilemedi:', error);
    throw error;
  }
}

async function clearGameResults(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.GAME_RESULTS);
}

export const storageService = {
  getUserProfile,
  saveUserProfile,
  upsertUsername,
  clearUserProfile,
  getGameResults,
  saveGameResult,
  clearGameResults,
  buyJoker,
  consumeJoker,
};