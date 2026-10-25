import Storage from 'expo-sqlite/kv-store';
import { createJSONStorage } from 'zustand/middleware';

// Everything lives in on-device SQLite, so the app works fully offline (ON-4).
export const sqliteStorage = createJSONStorage(() => ({
  getItem: (k: string) => Storage.getItem(k),
  setItem: (k: string, v: string) => Storage.setItem(k, v),
  removeItem: (k: string) => Storage.removeItem(k),
}));
