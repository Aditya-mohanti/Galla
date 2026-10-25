import { create } from 'zustand';

export type Toast = { id: number; message: string; kind: 'info' | 'warning' | 'success'; actionLabel?: string; onAction?: () => void };

type ToastState = { toast: Toast | null; show: (t: Omit<Toast, 'id'>) => void; hide: () => void };

let seq = 0;
export const useToast = create<ToastState>()((set) => ({
  toast: null,
  show: (t) => set({ toast: { ...t, id: ++seq } }),
  hide: () => set({ toast: null }),
}));

export const toast = (t: Omit<Toast, 'id'>) => useToast.getState().show(t);
