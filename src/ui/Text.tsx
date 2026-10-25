import { Text, type TextProps, type TextStyle } from 'react-native';
import { useApp } from '@/store/app';
import { colors, fontFamily, size as sizes, type TextSize, type Weight } from './theme';

export type TProps = TextProps & {
  size?: TextSize;
  weight?: Weight;
  color?: string;
  /** Tabular figures for every amount and quantity. */
  num?: boolean;
  center?: boolean;
  upper?: boolean;
};

/** The only text component. Picks the Devanagari face when the UI is Hindi or the text contains Devanagari. */
export function T({ size = 'body', weight = 'regular', color = colors.text, num, center, upper, style, children, ...rest }: TProps) {
  const lang = useApp((s) => s.language);
  const deva = lang === 'hi' || (typeof children === 'string' && /[ऀ-ॿ]/.test(children));
  const fs = sizes[size];
  const s: TextStyle = {
    fontFamily: fontFamily(weight, deva ? 'deva' : 'latin'),
    fontSize: fs,
    lineHeight: Math.round(fs * (deva ? 1.5 : 1.38)),
    color,
    textAlign: center ? 'center' : undefined,
    fontVariant: num ? ['tabular-nums'] : undefined,
    textTransform: upper ? 'uppercase' : undefined,
    letterSpacing: upper ? 0.5 : undefined,
  };
  return (
    <Text maxFontSizeMultiplier={1.3} style={[s, style]} {...rest}>
      {children}
    </Text>
  );
}
