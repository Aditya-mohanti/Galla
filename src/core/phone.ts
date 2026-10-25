// ON-2: Indian mobile numbers only — 10 digits starting with 6–9.

export type PhoneError = 'empty' | 'short' | 'long' | 'start';

/** Accepts pasted "+91 98110-45672", "098110 45672" etc. and returns bare digits. */
export function normalizePhone(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}

export function phoneError(digits: string): PhoneError | null {
  if (digits.length === 0) return 'empty';
  if (!/^[6-9]/.test(digits)) return 'start';
  if (digits.length < 10) return 'short';
  if (digits.length > 10) return 'long';
  return null;
}

export function isValidPhone(digits: string): boolean {
  return phoneError(digits) === null;
}

/** "9811045672" → "98110 45672" (also formats partial input as it is typed). */
export function formatPhone(digits: string): string {
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}
