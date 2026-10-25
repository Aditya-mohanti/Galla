import { roundNice, type RoundingMode } from './roundNice';

export type MarginMode = 'markup' | 'on_price';

export type PriceInput = {
  costPaise: number;
  feePctBp?: number;
  feeFixedPaise?: number;
  marginBp: number;
  mode: MarginMode;
  rounding: RoundingMode;
};

export type PriceSuggestion =
  | { ok: true; breakEvenPaise: number; rawPaise: number; suggestedPaise: number }
  | { ok: false; reason: 'no_cost' | 'margin_too_high' };

/** 00 §6.4 */
export function suggestPrice(input: PriceInput): PriceSuggestion {
  const { costPaise: c, feePctBp = 0, feeFixedPaise: F = 0, marginBp, mode, rounding } = input;
  if (c <= 0) return { ok: false, reason: 'no_cost' };
  const f = feePctBp / 10000;
  const m = marginBp / 10000;
  if (f >= 1 || (mode === 'on_price' && f + m >= 1)) return { ok: false, reason: 'margin_too_high' };

  const breakEven = Math.ceil((c + F) / (1 - f));
  const raw = mode === 'markup' ? (c * (1 + m) + F) / (1 - f) : (c + F) / (1 - f - m);
  const suggested = Math.max(roundNice(raw, rounding), roundNice(breakEven, 'none'));
  return { ok: true, breakEvenPaise: breakEven, rawPaise: Math.ceil(raw), suggestedPaise: suggested };
}
