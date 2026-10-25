// Money is always integer paise. Conversion to ₹ strings happens only at the UI edge.

const MINUS = '−';

/** Half-up rounding that is symmetric for negatives (−2.5 → −3). */
export function roundHalfUp(x: number): number {
  return Math.sign(x) * Math.round(Math.abs(x));
}

/** 1234567 → "12,34,567" (Indian grouping). */
export function groupIndian(whole: number): string {
  const s = String(Math.abs(Math.trunc(whole)));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

type FormatOpts = {
  /** 'auto' hides ".00"; 'always' shows two decimals; 'never' rounds to whole rupees. */
  decimals?: 'auto' | 'always' | 'never';
  /** Prefix + for positive numbers (used for deltas). */
  signed?: boolean;
};

/** 4375 → "₹43.75", 1843200000 → "₹1,84,32,000", −220 → "−₹2.20". */
export function formatINR(paise: number, opts: FormatOpts = {}): string {
  const { decimals = 'auto', signed = false } = opts;
  const neg = paise < 0;
  let abs = Math.abs(Math.round(paise));
  if (decimals === 'never') abs = Math.round(abs / 100) * 100;
  const rupees = Math.floor(abs / 100);
  const p = abs % 100;
  const showDec = decimals === 'always' || (decimals === 'auto' && p !== 0);
  const body = `₹${groupIndian(rupees)}${showDec ? '.' + String(p).padStart(2, '0') : ''}`;
  if (neg) return `${MINUS}${body}`;
  if (signed && paise > 0) return `+${body}`;
  return body;
}

/**
 * Parses what a person types ("128.5", "1,049", "₹ 44") into paise.
 * Returns null for empty or invalid input, or more than 2 decimals.
 */
export function parseRupees(input: string): number | null {
  const s = input.replace(/[₹,\s]/g, '');
  if (s === '') return null;
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [w, d = ''] = s.split('.');
  return Number(w) * 100 + Number(d.padEnd(2, '0'));
}

/** Paise → editable string without ₹ or grouping (12850 → "128.50", 4400 → "44"). */
export function paiseToInput(paise: number | null | undefined): string {
  if (paise == null) return '';
  const r = Math.floor(paise / 100);
  const p = paise % 100;
  return p === 0 ? String(r) : `${r}.${String(p).padStart(2, '0')}`;
}

/** Percent from basis points: 2000 → "20%", 2850 → "28.5%". */
export function formatBp(bp: number): string {
  const v = bp / 100;
  return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
}
