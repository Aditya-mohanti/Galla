import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, PAD, ROW_MIN_H } from './theme';

/** Full-width row with a hairline divider — the app's basic building block. */
export function ListRow({ title, subtitle, left, right, onPress, chevron, titleColor, label, accessibilityHint, numberOfLines = 2, italic }: {
  title: string; subtitle?: ReactNode; left?: ReactNode; right?: ReactNode; onPress?: () => void; chevron?: boolean;
  titleColor?: string; label?: string; accessibilityHint?: string; numberOfLines?: number; italic?: boolean;
}) {
  const body = (
    <>
      {left}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {label ? <T size="small" color={colors.textMuted}>{label}</T> : null}
        <T size={label ? 'title' : 'body'} weight={label ? 'regular' : 'medium'} color={titleColor} numberOfLines={numberOfLines}
          style={italic ? { fontStyle: 'italic' } : undefined}>{title}</T>
        {typeof subtitle === 'string' ? <T size="small" color={colors.textMuted} numberOfLines={2}>{subtitle}</T> : subtitle}
      </View>
      {right}
      {chevron ? <Icon name="chevronRight" size={20} color={colors.textDisabled} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityHint={accessibilityHint} onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.keypad }]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: ROW_MIN_H, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
});
