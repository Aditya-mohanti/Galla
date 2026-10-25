import * as Network from 'expo-network';

// Phone OTP auth. v1 targets Supabase `signInWithOtp({ phone })` + `verifyOtp`; until the
// Supabase project and SMS provider are configured this runs as a local stub.
// DEV: the code is always 123456.

export const DEV_OTP = '123456';
export const OTP_LENGTH = 6;
export const RESEND_AFTER_S = 30;
export const MAX_ATTEMPTS = 3;
export const LOCK_S = 60;

export class NoInternetError extends Error {
  constructor() { super('no_internet'); }
}

async function requireInternet() {
  const s = await Network.getNetworkStateAsync();
  if (!s.isConnected || s.isInternetReachable === false) throw new NoInternetError();
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function sendOtp(phone: string): Promise<void> {
  await requireInternet();
  await wait(700);
  void phone;
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  await requireInternet();
  await wait(500);
  void phone;
  return code === DEV_OTP;
}
