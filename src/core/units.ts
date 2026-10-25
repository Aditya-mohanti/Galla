export const UNITS = [
  'piece', 'kg', 'g', 'litre', 'ml', 'box', 'packet', 'bag', 'dozen', 'metre', 'set', 'pair',
] as const;
export type Unit = (typeof UNITS)[number];

const DECIMAL_UNITS: ReadonlySet<Unit> = new Set(['kg', 'g', 'litre', 'ml', 'metre']);

export function allowsDecimal(unit: Unit): boolean {
  return DECIMAL_UNITS.has(unit);
}

/** Quantities are REAL rounded to 3 decimals (00 §4). */
export function roundQty(q: number): number {
  return Math.round(q * 1000) / 1000;
}

/** True when the value is acceptable for the unit (no decimals for whole-number units). */
export function isValidQtyForUnit(q: number, unit: Unit): boolean {
  if (!Number.isFinite(q)) return false;
  return allowsDecimal(unit) || Number.isInteger(q);
}

/** Parses typed quantity text. Returns null when empty, malformed or decimals are not allowed. */
export function parseQty(input: string, unit: Unit): number | null {
  const s = input.trim();
  if (s === '' || !/^-?\d*(\.\d{0,3})?$/.test(s) || s === '.' || s === '-') return null;
  const q = Number(s);
  return isValidQtyForUnit(q, unit) ? roundQty(q) : null;
}

/** "7 bags"-style display. 1.5 → "1.5", 2 → "2", −3 → "−3". */
export function formatQtyNumber(q: number): string {
  const r = roundQty(q);
  const s = Number.isInteger(r) ? String(Math.abs(r)) : String(Math.abs(r)).replace(/0+$/, '');
  return r < 0 ? `−${s}` : s;
}
