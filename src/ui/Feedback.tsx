import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { formatINR } from '@/core/money';
import type { StockStatus } from '@/core/stock';
import { useToast } from '@/store/toast';
import { Icon, type IconName } from './Icon';
import { T, type TProps } from './Text';
import { colors, PAD, radius } from './theme';

type Tone = 'warning' | 'loss' | 'info' | 'profit';
const TONE: Record<Tone, { bg: string; border: string; fg: string; icon: IconName }> = {
  warning: { bg: colors.warningTint, border: '#EAD9BC', fg: colors.warning, icon: 'alertTriangle' },
  loss: { bg: colors.lossTint, border: '#EBC9C6', fg: colors.loss, icon: 'alertTriangle' },
  info: { bg: colors.inkTint, border: '#CDD3E6', fg: colors.ink, icon: 'info' },
  profit: { bg: colors.profitTint, border: '#C6DECD', fg: colors.profit, icon: 'checkCircle' },
};

/** WarningBanner — semantic colour always comes with an icon and a word. */
export function Banner({ tone, title, body, icon, action, onAction, style }: {
  tone: Tone; title: string; body?: string; icon?: IconName; action?: string; onAction?: () => void; style?: object;
}) {
  const c = TONE[tone];
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      <Icon name={icon ?? c.icon} size={22} color={c.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <T weight="bold" color={c.fg}>{title}</T>
        {body ? <T size="small" color={colors.text}>{body}</T> : null}
        {action ? (
          <Pressable accessibilityRole="link" onPress={onAction} hitSlop={8} style={{ marginTop: 4, alignSelf: 'flex-start' }}>
            <T weight="bold" color={colors.ink} style={{ textDecorationLine: 'underline' }}>{action}</T>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function EmptyState({ icon, title, body, children }: { icon: IconName; title: string; body?: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={40} color={colors.textMuted} />
      <T size="title" weight="bold" center>{title}</T>
      {body ? <T color={colors.textMuted} center>{body}</T> : null}
      {children ? <View style={{ gap: 12, marginTop: 12, alignSelf: 'stretch', alignItems: 'center' }}>{children}</View> : null}
    </View>
  );
}

/** Status label: short word + coloured tint, never colour alone. */
export function StockChip({ status, negative }: { status: StockStatus; negative?: boolean }) {
  const { t } = useTranslation();
  if (status === 'in') return null;
  const low = status === 'low';
  return (
    <View style={[styles.chip, { backgroundColor: low ? colors.warningTint : colors.lossTint }]}>
      <View style={[styles.dot, { backgroundColor: low ? colors.warning : colors.loss }]} />
      <T size="small" weight="medium" color={low ? colors.warning : colors.loss}>
        {negative ? t('stock.negative') : low ? t('stock.low') : t('stock.out')}
      </T>
    </View>
  );
}

export function Tag({ label, tone = 'muted' }: { label: string; tone?: Tone | 'muted' }) {
  const bg = tone === 'muted' ? colors.borderSoft : TONE[tone].bg;
  const fg = tone === 'muted' ? colors.textMuted : TONE[tone].fg;
  return <View style={[styles.chip, { backgroundColor: bg }]}><T size="small" weight="medium" color={fg}>{label}</T></View>;
}

export function AmountText({ paise, ...p }: Omit<TProps, 'children'> & { paise: number }) {
  return <T num {...p}>{formatINR(paise)}</T>;
}

/** ▲ green for profit, ▼ red for loss. */
export function ProfitText({ paise, ...p }: Omit<TProps, 'children' | 'color'> & { paise: number }) {
  const up = paise >= 0;
  return (
    <T num weight="bold" color={up ? colors.profit : colors.loss} {...p}>
      {up ? '▲' : '▼'} {formatINR(Math.abs(paise))}
    </T>
  );
}

export function ProgressBar({ value, color = colors.ink, label }: { value: number; color?: string; label?: string }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }} style={styles.track}>
      <View style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

export function Initials({ name, size = 44 }: { name: string; size?: number }) {
  const parts = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/);
  const ini = [...(parts[0] ?? '')][0] ?? '';
  const ini2 = parts[1] ? [...parts[1]][0] : [...(parts[0] ?? '')][1] ?? '';
  return (
    <View style={[styles.initials, { width: size, height: size }]} accessibilityElementsHidden importantForAccessibility="no">
      <T size="small" weight="bold" color={colors.textMuted}>{(ini + ini2).toUpperCase()}</T>
    </View>
  );
}

/** One global toast, used for low-stock alerts and "saved" confirmations. */
export function ToastHost() {
  const { toast, hide } = useToast();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!toast) return;
    const h = setTimeout(hide, 4500);
    return () => clearTimeout(h);
  }, [toast, hide]);
  if (!toast) return null;
  const tone = toast.kind === 'warning' ? TONE.warning : toast.kind === 'success' ? TONE.profit : TONE.info;
  return (
    <View pointerEvents="box-none" style={[styles.toastWrap, { bottom: insets.bottom + 84 }]}>
      <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.toast}>
        <Icon name={toast.kind === 'warning' ? 'bell' : 'checkCircle'} size={20} color={tone.border} />
        <T color="#fff" style={{ flex: 1 }}>{toast.message}</T>
        {toast.actionLabel ? (
          <Pressable accessibilityRole="button" onPress={() => { toast.onAction?.(); hide(); }} hitSlop={8}>
            <T weight="bold" color="#C9D3F5">{toast.actionLabel}</T>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.input, borderWidth: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  initials: { borderRadius: radius.input, backgroundColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
  toastWrap: { position: 'absolute', left: PAD, right: PAD },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.text, padding: 14, borderRadius: radius.input },
});
