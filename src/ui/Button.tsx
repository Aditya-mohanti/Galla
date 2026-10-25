import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { T } from './Text';
import { BUTTON_H, colors, radius } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

export function Button({
  label, onPress, variant = 'primary', disabled, loading, icon, compact, style, accessibilityHint,
}: {
  label: string; onPress?: () => void; variant?: Variant; disabled?: boolean; loading?: boolean;
  icon?: IconName; compact?: boolean; style?: ViewStyle; accessibilityHint?: string;
}) {
  const off = disabled || loading;
  const v = off && variant !== 'ghost' ? styles.disabled : styles[variant];
  const fg = off
    ? colors.textDisabled
    : variant === 'primary' || variant === 'danger' ? '#fff'
    : variant === 'secondary' ? colors.text : variant === 'outline' ? colors.ink : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [styles.base, compact && styles.compact, v, pressed && !off && styles.pressed, style]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.ink} /> : (
        <View style={styles.row}>
          {icon && <Icon name={icon} size={20} color={fg} />}
          <T size={compact ? 'body' : 'title'} weight={variant === 'secondary' ? 'medium' : 'bold'} color={fg} center>{label}</T>
        </View>
      )}
    </Pressable>
  );
}

/** Square icon-only button with a required label for screen readers. */
export function IconButton({ name, label, onPress, color = colors.text, size = 24 }: {
  name: IconName; label: string; onPress?: () => void; color?: string; size?: number;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4}
      style={({ pressed }) => [styles.icon, pressed && { backgroundColor: colors.borderSoft }]}>
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: BUTTON_H, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  compact: { minHeight: 44, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primary: { backgroundColor: colors.ink },
  danger: { backgroundColor: colors.loss },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  outline: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.ink },
  ghost: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: colors.border },
  pressed: { opacity: 0.85 },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.input },
});
