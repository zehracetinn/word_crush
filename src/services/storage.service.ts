import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameResult } from '../models/game-result';
import { UserProfile } from '../models/user-profile';
import { JokerId, JOKER_MAP } from '../constants/joker-definitions';

const STORAGE_KEYS = {
  LEGACY_USER_PROFILE: '@word_crush/user_profile',
  USER_PROFILES: '@word_crush/user_profiles',
  CURRENT_PROFILE_ID: '@word_crush/current_profile_id',
  GAME_RESULTS: '@word_crush/game_results',
};

const DEFAULT_GOLD = 9999;
let migrationPromise: Promise<void> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sortResults(results: GameResult[]): GameResult[] {
  return [...results].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  );
}

function buildProfileId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildResultId(): string {
  return `result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeUsername(username: string): string {
  return username.trim().toLocaleLowerCase('tr-TR');
}

function normalizeOwnedJokers(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  const ownedJokers: Record<string, number> = {};

  Object.entries(value).forEach(([jokerId, count]) => {
    const parsedCount = toFiniteNumber(count, 0);

    if (parsedCount > 0) {
      ownedJokers[jokerId] = Math.floor(parsedCount);
    }
  });

  return ownedJokers;
}

function createProfile(username: string): UserProfile {
  const now = new Date().toISOString();

  return {
    id: buildProfileId(),
    username: username.trim(),
    gold: DEFAULT_GOLD,
    ownedJokers: {},
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeProfile(value: unknown): UserProfile | null {
  if (!isRecord(value)) {
    return null;
  }

  const username = typeof value.username === 'string' ? value.username.trim() : '';

  if (!username) {
    return null;
  }

  const createdAt =
    typeof value.createdAt === 'string' && value.createdAt.trim().length > 0
      ? value.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof value.updatedAt === 'string' && value.updatedAt.trim().length > 0
      ? value.updatedAt
      : createdAt;

  return {
    id:
      typeof value.id === 'string' && value.id.trim().length > 0
        ? value.id.trim()
        : buildProfileId(),
    username,
    gold: toFiniteNumber(value.gold, DEFAULT_GOLD),
    ownedJokers: normalizeOwnedJokers(value.ownedJokers),
    createdAt,
    updatedAt,
  };
}

function normalizeGameResult(
  value: unknown,
  fallbackProfile?: UserProfile
): GameResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const playerId =
    typeof value.playerId === 'string' && value.playerId.trim().length > 0
      ? value.playerId.trim()
      : fallbackProfile?.id;

  if (!playerId) {
    return null;
  }

  return {
    id:
      typeof value.id === 'string' && value.id.trim().length > 0
        ? value.id.trim()
        : buildResultId(),
    playerId,
    playerName:
      typeof value.playerName === 'string' && value.playerName.trim().length > 0
        ? value.playerName.trim()
        : fallbackProfile?.username ?? '-',
    playedAt:
      typeof value.playedAt === 'string' && value.playedAt.trim().length > 0
        ? value.playedAt
        : new Date().toISOString(),
    gridSize: Math.max(0, Math.floor(toFiniteNumber(value.gridSize, 0))),
    difficulty:
      typeof value.difficulty === 'string' && value.difficulty.trim().length > 0
        ? value.difficulty
        : '-',
    score: Math.max(0, Math.floor(toFiniteNumber(value.score, 0))),
    wordCount: Math.max(0, Math.floor(toFiniteNumber(value.wordCount, 0))),
    longestWord:
      typeof value.longestWord === 'string' && value.longestWord.trim().length > 0
        ? value.longestWord
        : '-',
    durationSeconds: Math.max(0, Math.floor(toFiniteNumber(value.durationSeconds, 0))),
  };
}

async function readProfilesFromStorage(): Promise<UserProfile[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILES);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    const seenIds = new Set<string>();
    const profiles = parsed.reduce<UserProfile[]>((acc, entry) => {
      const normalized = normalizeProfile(entry);

      if (!normalized) {
        return acc;
      }

      let nextId = normalized.id;

      while (seenIds.has(nextId)) {
        nextId = buildProfileId();
      }

      seenIds.add(nextId);
      acc.push(nextId === normalized.id ? normalized : { ...normalized, id: nextId });
      return acc;
    }, []);

    const normalizedRaw = JSON.stringify(profiles);

    if (normalizedRaw !== raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILES, normalizedRaw);
    }

    return profiles;
  } catch (error) {
    console.error('Profil listesi okunamadı:', error);
    return [];
  }
}

async function writeProfilesToStorage(profiles: UserProfile[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));
  await AsyncStorage.removeItem(STORAGE_KEYS.LEGACY_USER_PROFILE);
}

async function readCurrentProfileIdFromStorage(): Promise<string | null> {
  try {
    const currentProfileId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_PROFILE_ID);
    return currentProfileId?.trim() ? currentProfileId : null;
  } catch (error) {
    console.error('Aktif profil okunamadı:', error);
    return null;
  }
}

async function writeCurrentProfileIdToStorage(profileId: string | null): Promise<void> {
  if (profileId) {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_PROFILE_ID, profileId);
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_PROFILE_ID);
}

async function readResultsFromStorage(): Promise<GameResult[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.GAME_RESULTS);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortResults(
      parsed.reduce<GameResult[]>((acc, entry) => {
        const normalized = normalizeGameResult(entry);

        if (normalized) {
          acc.push(normalized);
        }

        return acc;
      }, [])
    );
  } catch (error) {
    console.error('Oyun sonuçları okunamadı:', error);
    return [];
  }
}

async function writeResultsToStorage(results: GameResult[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.GAME_RESULTS, JSON.stringify(sortResults(results)));
}

async function migrateLegacyStorage(): Promise<void> {
  try {
    const profiles = await readProfilesFromStorage();
    const currentProfileId = await readCurrentProfileIdFromStorage();

    if (profiles.length > 0) {
      if (!currentProfileId || !profiles.some((profile) => profile.id === currentProfileId)) {
        await writeCurrentProfileIdToStorage(profiles[0].id);
      }

      return;
    }

    const legacyRaw = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_USER_PROFILE);

    if (!legacyRaw) {
      if (currentProfileId) {
        await writeCurrentProfileIdToStorage(null);
      }

      return;
    }

    const legacyProfile = normalizeProfile(JSON.parse(legacyRaw));

    if (!legacyProfile) {
      return;
    }

    await writeProfilesToStorage([legacyProfile]);
    await writeCurrentProfileIdToStorage(legacyProfile.id);

    const rawResults = await AsyncStorage.getItem(STORAGE_KEYS.GAME_RESULTS);

    if (rawResults) {
      try {
        const parsedResults = JSON.parse(rawResults) as unknown;

        if (Array.isArray(parsedResults)) {
          const migratedResults = sortResults(
            parsedResults.reduce<GameResult[]>((acc, entry) => {
              const normalized = normalizeGameResult(entry, legacyProfile);

              if (normalized) {
                acc.push(normalized);
              }

              return acc;
            }, [])
          );

          await writeResultsToStorage(migratedResults);
        }
      } catch (error) {
        console.error('Eski oyun sonuçları dönüştürülemedi:', error);
      }
    }
  } catch (error) {
    console.error('Yerel profil migrasyonu başarısız:', error);
  }
}

async function ensureStorageReady(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyStorage();
  }

  await migrationPromise;
}

function findProfileByUsername(profiles: UserProfile[], username: string): UserProfile | null {
  const normalizedTarget = normalizeUsername(username);

  return (
    profiles.find(
      (profile) => normalizeUsername(profile.username) === normalizedTarget
    ) ?? null
  );
}

async function getUserProfile(): Promise<UserProfile | null> {
  await ensureStorageReady();

  const profiles = await readProfilesFromStorage();

  if (profiles.length === 0) {
    await writeCurrentProfileIdToStorage(null);
    return null;
  }

  const currentProfileId = await readCurrentProfileIdFromStorage();
  const activeProfile = profiles.find((profile) => profile.id === currentProfileId);

  if (activeProfile) {
    return activeProfile;
  }

  await writeCurrentProfileIdToStorage(profiles[0].id);
  return profiles[0];
}

async function saveUserProfile(profile: UserProfile): Promise<void> {
  await ensureStorageReady();

  const normalized = normalizeProfile(profile);

  if (!normalized) {
    throw new Error('Geçersiz profil.');
  }

  const profiles = await readProfilesFromStorage();
  const profileIndex = profiles.findIndex((item) => item.id === normalized.id);

  if (profileIndex >= 0) {
    profiles[profileIndex] = normalized;
  } else {
    profiles.push(normalized);
  }

  await writeProfilesToStorage(profiles);

  const currentProfileId = await readCurrentProfileIdFromStorage();

  if (!currentProfileId) {
    await writeCurrentProfileIdToStorage(normalized.id);
  }
}

async function upsertUsername(username: string): Promise<UserProfile> {
  await ensureStorageReady();

  const trimmed = username.trim();

  if (trimmed.length < 2) {
    throw new Error('Kullanıcı adı en az 2 karakter olmalı.');
  }

  const profiles = await readProfilesFromStorage();
  const existingProfile = findProfileByUsername(profiles, trimmed);

  if (existingProfile) {
    await writeCurrentProfileIdToStorage(existingProfile.id);
    return existingProfile;
  }

  const newProfile = createProfile(trimmed);
  await writeProfilesToStorage([...profiles, newProfile]);
  await writeCurrentProfileIdToStorage(newProfile.id);
  return newProfile;
}

async function clearUserProfile(): Promise<void> {
  await ensureStorageReady();

  const currentProfileId = await readCurrentProfileIdFromStorage();

  if (!currentProfileId) {
    return;
  }

  const profiles = await readProfilesFromStorage();
  const remainingProfiles = profiles.filter((profile) => profile.id !== currentProfileId);
  await writeProfilesToStorage(remainingProfiles);
  await writeCurrentProfileIdToStorage(remainingProfiles[0]?.id ?? null);

  const results = await readResultsFromStorage();
  const remainingResults = results.filter((result) => result.playerId !== currentProfileId);
  await writeResultsToStorage(remainingResults);
}

async function getGameResults(profileId?: string): Promise<GameResult[]> {
  await ensureStorageReady();

  const targetProfileId = profileId ?? (await readCurrentProfileIdFromStorage());

  if (!targetProfileId) {
    return [];
  }

  const results = await readResultsFromStorage();
  return results.filter((result) => result.playerId === targetProfileId);
}

async function saveGameResult(result: GameResult): Promise<void> {
  await ensureStorageReady();

  const profile = await getUserProfile();

  if (!profile) {
    throw new Error('Önce kullanıcı profili oluşturulmalı.');
  }

  const normalizedResult = normalizeGameResult(
    {
      ...result,
      playerId: result.playerId || profile.id,
      playerName: result.playerName || profile.username,
    },
    profile
  );

  if (!normalizedResult) {
    throw new Error('Geçersiz oyun sonucu.');
  }

  const results = await readResultsFromStorage();
  const nextResults = [normalizedResult, ...results.filter((item) => item.id !== normalizedResult.id)];
  await writeResultsToStorage(nextResults);
}

async function clearGameResults(): Promise<void> {
  await ensureStorageReady();

  const currentProfileId = await readCurrentProfileIdFromStorage();

  if (!currentProfileId) {
    return;
  }

  const results = await readResultsFromStorage();
  const filteredResults = results.filter((result) => result.playerId !== currentProfileId);
  await writeResultsToStorage(filteredResults);
}

async function updateCurrentProfile(
  updater: (profile: UserProfile) => UserProfile
): Promise<UserProfile> {
  await ensureStorageReady();

  const currentProfileId = await readCurrentProfileIdFromStorage();

  if (!currentProfileId) {
    throw new Error('Önce kullanıcı profili oluşturulmalı.');
  }

  const profiles = await readProfilesFromStorage();
  const profileIndex = profiles.findIndex((profile) => profile.id === currentProfileId);

  if (profileIndex < 0) {
    throw new Error('Aktif profil bulunamadı.');
  }

  const currentProfile = profiles[profileIndex];
  const updatedProfile = normalizeProfile({
    ...updater(currentProfile),
    id: currentProfile.id,
    createdAt: currentProfile.createdAt,
    updatedAt: new Date().toISOString(),
  });

  if (!updatedProfile) {
    throw new Error('Profil güncellenemedi.');
  }

  profiles[profileIndex] = updatedProfile;
  await writeProfilesToStorage(profiles);
  return updatedProfile;
}

async function buyJoker(jokerId: JokerId): Promise<UserProfile> {
  const joker = JOKER_MAP[jokerId];

  if (!joker) {
    throw new Error('Geçersiz joker.');
  }

  return updateCurrentProfile((profile) => {
    if (profile.gold < joker.cost) {
      throw new Error('Yetersiz altın.');
    }

    return {
      ...profile,
      gold: profile.gold - joker.cost,
      ownedJokers: {
        ...profile.ownedJokers,
        [jokerId]: (profile.ownedJokers?.[jokerId] ?? 0) + 1,
      },
    };
  });
}

async function consumeJoker(jokerId: JokerId): Promise<UserProfile> {
  return updateCurrentProfile((profile) => {
    const currentCount = profile.ownedJokers?.[jokerId] ?? 0;

    if (currentCount <= 0) {
      throw new Error('Bu jokerden envanterde yok.');
    }

    return {
      ...profile,
      ownedJokers: {
        ...profile.ownedJokers,
        [jokerId]: currentCount - 1,
      },
    };
  });
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
