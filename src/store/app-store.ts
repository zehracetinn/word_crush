import { create } from 'zustand';
import { JokerId } from '../constants/joker-definitions';
import { UserProfile } from '../models/user-profile';
import { storageService } from '../services/storage.service';

interface AppStore {
  profile: UserProfile | null;
  isReady: boolean;
  init: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUsername: (username: string) => Promise<void>;
  buyJoker: (jokerId: JokerId) => Promise<void>;
  consumeJoker: (jokerId: JokerId) => Promise<void>;
  clearProfile: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set) => ({
  profile: null,
  isReady: false,

  init: async () => {
    const profile = await storageService.getUserProfile();
    set({
      profile,
      isReady: true,
    });
  },

  refreshProfile: async () => {
    const profile = await storageService.getUserProfile();
    set({ profile });
  },

  setUsername: async (username: string) => {
    const profile = await storageService.upsertUsername(username);
    set({ profile });
  },

  buyJoker: async (jokerId: JokerId) => {
    const profile = await storageService.buyJoker(jokerId);
    set({ profile });
  },

  consumeJoker: async (jokerId: JokerId) => {
    const profile = await storageService.consumeJoker(jokerId);
    set({ profile });
  },

  clearProfile: async () => {
    await storageService.clearUserProfile();
    set({ profile: null });
  },
}));