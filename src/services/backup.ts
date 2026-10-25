import * as Network from 'expo-network';
import { buildDemoData } from './demoData';
import { NoInternetError } from './auth';
import type { BusinessType } from '@/store/app';

// Backup lookup + restore (module 10 owns the real Supabase Storage implementation).
// Stub: the demo number 98110 45672 has a backup; every other number starts fresh.

export const DEMO_PHONE = '9811045672';

export type BackupSummary = {
  businessName: string;
  businessType: BusinessType;
  itemCount: number;
  lastSaleDate: string;
  backedUpAt: string;
  sizeKb: number;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function findBackup(phone: string): Promise<BackupSummary | null> {
  await wait(400);
  if (phone !== DEMO_PHONE) return null;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(21, 42, 0, 0);
  const data = buildDemoData();
  return {
    businessName: 'Sharma Kirana Store',
    businessType: 'retail',
    itemCount: Object.keys(data.items).length,
    lastSaleDate: d.toISOString().slice(0, 10),
    backedUpAt: d.toISOString(),
    sizeKb: 840,
  };
}

/**
 * Downloads in chunks so a dropped connection resumes from `fromChunk` instead of restarting.
 * Calls onProgress(0..1). Throws NoInternetError with the chunk reached.
 */
export const RESTORE_CHUNKS = 10;
export class RestoreInterrupted extends NoInternetError {
  constructor(public chunk: number) { super(); }
}

export async function restoreBackup(fromChunk: number, onProgress: (p: number, chunk: number) => void) {
  for (let c = fromChunk; c < RESTORE_CHUNKS; c++) {
    const s = await Network.getNetworkStateAsync();
    if (!s.isConnected || s.isInternetReachable === false) throw new RestoreInterrupted(c);
    await wait(260);
    onProgress((c + 1) / RESTORE_CHUNKS, c + 1);
  }
  return buildDemoData();
}
