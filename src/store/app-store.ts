import { create } from 'zustand';
import { UserProfile } from '../models/user-profile';
import { storageService } from '../services/storage.service';

interface AppStore {
  profile: UserProfile | null;
  isReady: boolean;
  init: () => Promise<void>;
  setUsername: (username: string) => Promise<void>;
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

  setUsername: async (username: string) => {
    const profile = await storageService.upsertUsername(username);
    set({ profile });
  },

  clearProfile: async () => {
    await storageService.clearUserProfile();
    set({ profile: null });
  },
}));