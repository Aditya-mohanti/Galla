import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, type KeyboardTypeOptions, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/store/app';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, fontFamily, radius, size } from './theme';

export function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return <T size="small" color={colors.textMuted} style={{ marginBottom: 6 }}>{children}{required ? ' *' : ''}</T>;
}

export function FieldMessage({ error, hint, tone }: { error?: string | null; hint?: string | null; tone?: 'warning' | 'profit' }) {
  if (error) {
    return (
      <View style={styles.msg} accessibilityLiveRegion="polite">
        <Icon name="alertCircle" size={16} color={colors.loss} />
        <T size="small" color={colors.loss} style={{ flex: 1 }}>{error}</T>
      </View>
    );
  }
  if (hint) {
    const c = tone === 'warning' ? colors.warning : tone === 'profit' ? colors.profit : colors.textMuted;
    return <T size="small" color={c} style={{ marginTop: 6 }}>{hint}</T>;
  }
  return null;
}

type FieldProps = {
  label?: string; required?: boolean; value: string; onChangeText: (s: string) => void;
  placeholder?: string; error?: string | null; hint?: string | null; hintTone?: 'warning' | 'profit';
  prefix?: string; suffix?: string; keyboardType?: KeyboardTypeOptions; autoFocus?: boolean;
  maxLength?: number; editable?: boolean; big?: boolean; style?: ViewStyle; right?: ReactNode;
  onSubmitEditing?: () => void; showSoftInputOnFocus?: boolean; onBlur?: () => void;
  accessibilityLabel?: string; clearable?: boolean; leftIcon?: 'search';
};

export function TextField(p: FieldProps) {
  const [focus, setFocus] = useState(false);
  const { t } = useTranslation();
  const lang = useApp((s) => s.language);
  const deva = lang === 'hi' || /[ऀ-ॿ]/.test(p.value);
  const border = p.error ? styles.err : focus ? styles.focus : null;
  return (
    <View style={p.style}>
      {p.label ? <FieldLabel required={p.required}>{p.label}</FieldLabel> : null}
      <View style={[styles.box, p.big && styles.big, border, p.editable === false && styles.readOnly]}>
        {p.leftIcon ? <View style={{ paddingLeft: 12 }}><Icon name={p.leftIcon} size={22} color={colors.textMuted} /></View> : null}
        {p.prefix ? (
          <View style={styles.prefix}><T size={p.big ? 'title' : 'body'} weight="bold" num>{p.prefix}</T></View>
        ) : null}
        <TextInput
          value={p.value}
          onChangeText={p.onChangeText}
          placeholder={p.placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType={p.keyboardType}
          autoFocus={p.autoFocus}
          maxLength={p.maxLength}
          editable={p.editable}
          onFocus={() => setFocus(true)}
          onBlur={() => { setFocus(false); p.onBlur?.(); }}
          onSubmitEditing={p.onSubmitEditing}
          showSoftInputOnFocus={p.showSoftInputOnFocus}
          accessibilityLabel={p.accessibilityLabel ?? p.label}
          maxFontSizeMultiplier={1.3}
          style={[styles.input, {
            fontFamily: fontFamily(p.big ? 'bold' : 'regular', deva ? 'deva' : 'latin'),
            fontSize: p.big ? size.h2 : size.title,
            fontVariant: ['tabular-nums'],
          }]}
        />
        {p.clearable && p.value ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.clear')} onPress={() => p.onChangeText('')} style={styles.suffixBtn}>
            <Icon name="close" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
        {p.suffix ? <T color={colors.textMuted} style={{ paddingRight: 14 }}>{p.suffix}</T> : null}
        {p.right}
      </View>
      <FieldMessage error={p.error} hint={p.hint} tone={p.hintTone} />
    </View>
  );
}

/** Rupee input: digits and up to two decimals only. */
export function MoneyInput(p: Omit<FieldProps, 'prefix' | 'keyboardType'>) {
  return (
    <TextField
      {...p}
      prefix="₹"
      keyboardType="decimal-pad"
      onChangeText={(s) => {
        const c = s.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
        const [w, d] = c.split('.');
        p.onChangeText(d !== undefined ? `${w.slice(0, 8)}.${d.slice(0, 2)}` : w.slice(0, 8));
      }}
    />
  );
}

/** Quantity input that only accepts decimals when the unit allows them (IT-3). */
export function QtyInput(p: Omit<FieldProps, 'keyboardType'> & { allowDecimal: boolean; onDecimalBlocked?: () => void }) {
  return (
    <TextField
      {...p}
      keyboardType={p.allowDecimal ? 'decimal-pad' : 'number-pad'}
      onChangeText={(s) => {
        let c = s.replace(/[^\d.]/g, '');
        if (!p.allowDecimal && c.includes('.')) { p.onDecimalBlocked?.(); c = c.replace(/\..*/, ''); }
        c = c.replace(/(\..*)\./g, '$1');
        const [w, d] = c.split('.');
        p.onChangeText(d !== undefined ? `${w.slice(0, 7)}.${d.slice(0, 3)}` : w.slice(0, 7));
      }}
    />
  );
}

export function QuantityStepper({ value, onChange, step = 1, min = 0, unitLabel, allowDecimal, label }: {
  value: string; onChange: (s: string) => void; step?: number; min?: number; unitLabel: string; allowDecimal: boolean; label: string;
}) {
  const { t } = useTranslation();
  const n = Number(value) || 0;
  const set = (x: number) => onChange(String(Math.max(min, Math.round(x * 1000) / 1000)));
  return (
    <View style={[styles.box, styles.stepper, styles.focus]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.decrease')} onPress={() => set(n - step)} style={styles.stepBtn} disabled={n - step < min}>
        <Icon name="minus" color={n - step < min ? colors.textDisabled : colors.text} />
      </Pressable>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
        <TextInput
          value={value}
          accessibilityLabel={label}
          keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
          onChangeText={(s) => onChange(allowDecimal ? s.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') : s.replace(/\D/g, ''))}
          style={{ fontFamily: fontFamily('bold', 'latin'), fontSize: size.h2, color: colors.text, minWidth: 40, textAlign: 'center', padding: 0, fontVariant: ['tabular-nums'] }}
          maxFontSizeMultiplier={1.3}
        />
        <T color={colors.textMuted}>{unitLabel}</T>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.increase')} onPress={() => set(n + step)} style={styles.stepBtn}>
        <Icon name="plus" />
      </Pressable>
    </View>
  );
}

export type ChipOption<V extends string> = { value: V; label: string; count?: number; countColor?: string };

export function ChipGroup<V extends string>({ options, value, onChange, scroll, accessibilityLabel }: {
  options: ChipOption<V>[]; value: V | null; onChange: (v: V) => void; scroll?: boolean; accessibilityLabel?: string;
}) {
  const chips = options.map((o) => {
    const on = o.value === value;
    return (
      <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
        style={[styles.chip, on && styles.chipOn]}>
        <T weight={on ? 'bold' : 'regular'} color={on ? '#fff' : colors.text}>{o.label}</T>
        {o.count != null ? <T weight="bold" num color={on ? '#fff' : o.countColor ?? colors.text}>{o.count}</T> : null}
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>{chips}</ScrollView>
    );
  }
  return <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{chips}</View>;
}

export function SegmentedControl<V extends string>({ options, value, onChange, label }: {
  options: { value: V; label: string }[]; value: V; onChange: (v: V) => void; label: string;
}) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={[styles.segItem, on && { backgroundColor: colors.text }]}>
            <T color={on ? '#fff' : colors.text} weight={on ? 'medium' : 'regular'}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function NumericKeypad({ onKey, onBackspace, disabled }: { onKey: (d: string) => void; onBackspace: () => void; disabled?: boolean }) {
  const { t } = useTranslation();
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return (
    <View style={styles.kp}>
      {keys.map((k, i) => (
        <Pressable key={i} disabled={disabled || k === ''}
          accessibilityRole={k ? 'button' : undefined}
          accessibilityLabel={k === 'del' ? t('common.backspace') : k || undefined}
          onPress={() => (k === 'del' ? onBackspace() : onKey(k))}
          style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.borderSoft }]}>
          {k === 'del' ? <Icon name="backspace" color={disabled ? colors.textDisabled : colors.text} />
            : <T size="h2" color={disabled ? colors.textDisabled : colors.text} weight="regular">{k}</T>}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input,
    backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
  },
  big: { minHeight: 64 },
  focus: { borderWidth: 2, borderColor: colors.ink },
  err: { borderWidth: 2, borderColor: colors.loss },
  readOnly: { backgroundColor: colors.borderSoft },
  prefix: { alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#EFECE6', borderRightWidth: 1, borderRightColor: colors.border },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, color: colors.text },
  suffixBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  msg: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 6 },
  stepper: { minHeight: 64 },
  stepBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  chip: {
    minHeight: 44, paddingHorizontal: 14, borderRadius: radius.input, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, overflow: 'hidden', backgroundColor: colors.surface },
  segItem: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center' },
  kp: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.border, gap: 1 },
  key: { width: '33.1%', height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keypad, flexGrow: 1 },
});
