// Tokens from docs/DESIGN.md — "a well-kept bahi-khata, made digital".

export const colors = {
  paper: '#F6F4EF',
  surface: '#FFFFFF',
  border: '#E4E0D8',
  borderSoft: '#EEEAE2',
  text: '#1C1B19',
  textMuted: '#6E6A63',
  textDisabled: '#A8A39A',
  ink: '#24356B',
  inkTint: '#E6E9F2',
  profit: '#1E7A3E',
  profitTint: '#E9F2EC',
  loss: '#B3261E',
  lossTint: '#F7E9E8',
  warning: '#9A5B00',
  warningTint: '#F5EFE5',
  keypad: '#FAF9F6',
  scrim: 'rgba(28,27,25,0.5)',
} as const;

export const size = { small: 13, body: 15, title: 17, h2: 22, h1: 28 } as const;
export type TextSize = keyof typeof size;
export type Weight = 'regular' | 'medium' | 'bold';

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const radius = { input: 8, sheet: 12 } as const;
export const PAD = 16;
export const BUTTON_H = 52;
export const ROW_MIN_H = 56;

const LATIN = { regular: 'NotoSans_400Regular', medium: 'NotoSans_500Medium', bold: 'NotoSans_700Bold' } as const;
const DEVA = {
  regular: 'NotoSansDevanagari_400Regular',
  medium: 'NotoSansDevanagari_500Medium',
  bold: 'NotoSansDevanagari_700Bold',
} as const;

/** Noto Sans Devanagari also carries Latin glyphs, so Hindi UI uses it for everything. */
export function fontFamily(weight: Weight, script: 'latin' | 'deva'): string {
  return (script === 'deva' ? DEVA : LATIN)[weight];
}

export const sheetShadow = {
  shadowColor: '#1C1B19',
  shadowOffset: { width: 0, height: -8 },
  shadowOpacity: 0.18,
  shadowRadius: 24,
  elevation: 16,
} as const;
