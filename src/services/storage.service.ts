import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../models/user-profile';

const STORAGE_KEYS = {
  USER_PROFILE: '@word_crush/user_profile',
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

export const storageService = {
  getUserProfile,
  saveUserProfile,
  upsertUsername,
  clearUserProfile,
};