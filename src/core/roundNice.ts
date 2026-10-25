export type RoundingMode = 'nice' | '1' | '5' | '10' | 'none';

function ceilTo(paise: number, step: number): number {
  return Math.ceil(paise / step) * step;
}

/** 00 §6.5 — always rounds UP. */
export function roundNice(paise: number, mode: RoundingMode = 'nice'): number {
  if (paise <= 0) return 0;
  if (mode === 'none') return Math.ceil(paise);
  if (mode !== 'nice') return ceilTo(paise, Number(mode) * 100);

  if (paise < 1_000) return ceilTo(paise, 50);
  if (paise < 10_000) return ceilTo(paise, 100);

  const rupees = Math.ceil(paise / 100);
  if (paise < 100_000) {
    return (rupees + ((9 - (rupees % 10)) + 10) % 10) * 100;
  }
  let r = rupees;
  while (r % 100 !== 49 && r % 100 !== 99) r++;
  return r * 100;
}
