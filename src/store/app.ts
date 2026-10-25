import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoundingMode } from '@/core/roundNice';
import type { MarginMode } from '@/core/pricing';
import { nowIso } from '@/lib/date';
import { uuid } from '@/lib/id';
import { sqliteStorage } from './storage';

export type Lang = 'hi' | 'en';
export type BusinessType = 'retail' | 'wholesale' | 'online' | 'home';

export type Business = {
  id: string;
  name: string;
  type: BusinessType;
  ownerPhone: string;
  language: Lang;
  defaultMarginBp: number;
  marginMode: MarginMode;
  roundingMode: RoundingMode;
  slowMovingDays: number;
  createdAt: string;
  updatedAt: string;
};

export type QuickStart = { item: boolean; purchase: boolean; target: boolean; dismissed: boolean };

type AppState = {
  hydrated: boolean;
  language: Lang | null;
  session: { phone: string; loggedInAt: string } | null;
  business: Business | null;
  quickstart: QuickStart;
  /** Draft kept while the user is mid-setup, so killing the app resumes where they were. */
  setupDraft: { name: string; type: BusinessType | null };
  /** Local, unbacked change counter (module 10 fills this in properly). */
  unbackedChanges: number;
  lastBackupAt: string | null;

  setLanguage: (l: Lang) => void;
  login: (phone: string) => void;
  logout: () => void;
  setSetupDraft: (d: Partial<AppState['setupDraft']>) => void;
  createBusiness: (name: string, type: BusinessType) => void;
  updateBusiness: (patch: Partial<Omit<Business, 'id' | 'createdAt'>>) => void;
  restoreBusiness: (b: Omit<Business, 'ownerPhone' | 'language'>, backedUpAt: string) => void;
  setQuickstart: (patch: Partial<QuickStart>) => void;
  bumpChanges: () => void;
};

const defaultQuickstart: QuickStart = { item: false, purchase: false, target: false, dismissed: false };

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      language: null,
      session: null,
      business: null,
      quickstart: defaultQuickstart,
      setupDraft: { name: '', type: null },
      unbackedChanges: 0,
      lastBackupAt: null,

      setLanguage: (language) => {
        const b = get().business;
        set({ language, business: b ? { ...b, language, updatedAt: nowIso() } : b });
      },
      login: (phone) => set({ session: { phone, loggedInAt: nowIso() } }),
      // ON-9: log out clears the session only; data stays on the phone.
      logout: () => set({ session: null }),
      setSetupDraft: (d) => set({ setupDraft: { ...get().setupDraft, ...d } }),
      createBusiness: (name, type) => {
        const t = nowIso();
        set({
          business: {
            id: uuid(), name: name.trim(), type, ownerPhone: get().session?.phone ?? '',
            language: get().language ?? 'en', defaultMarginBp: 2000, marginMode: 'markup',
            roundingMode: 'nice', slowMovingDays: 30, createdAt: t, updatedAt: t,
          },
          setupDraft: { name: '', type: null },
          quickstart: defaultQuickstart,
        });
      },
      updateBusiness: (patch) => {
        const b = get().business;
        if (b) set({ business: { ...b, ...patch, updatedAt: nowIso() }, unbackedChanges: get().unbackedChanges + 1 });
      },
      restoreBusiness: (b, backedUpAt) =>
        set({
          business: { ...b, ownerPhone: get().session?.phone ?? '', language: get().language ?? 'en' },
          quickstart: { ...defaultQuickstart, dismissed: true },
          lastBackupAt: backedUpAt,
          unbackedChanges: 0,
        }),
      setQuickstart: (patch) => set({ quickstart: { ...get().quickstart, ...patch } }),
      bumpChanges: () => set({ unbackedChanges: get().unbackedChanges + 1 }),
    }),
    {
      name: 'galla-app',
      storage: sqliteStorage,
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => useApp.setState({ hydrated: true }),
    },
  ),
);

/** ON-7: type-based defaults that other modules read. */
export function businessDefaults(type: BusinessType | undefined) {
  return {
    sellFeesExpanded: type === 'online',
    defaultChannel: type === 'online' ? 'online' : type === 'wholesale' ? 'wholesale' : 'shop',
    partyFieldVisible: type === 'wholesale',
    partyBehindButton: type === 'retail',
    extraCostLabelKey: type === 'home' ? 'buy.extraCostHome' : 'buy.extraCost',
  } as const;
}

export function useBusinessDefaults() {
  return businessDefaults(useApp((s) => s.business?.type));
}
