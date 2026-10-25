import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatBp } from '@/core/money';
import { useApp } from '@/store/app';
import { BottomSheet, Button, ChipGroup, colors, Icon, PAD, ProgressBar, T } from '@/ui';

const TARGETS = ['1000', '1500', '2000', '2500', '3000'] as const;

/** 1.5 checklist — used on the quick-start screen and pinned on Home until done or dismissed (ON-8). */
export function QuickStartList({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const qs = useApp((s) => s.quickstart);
  const business = useApp((s) => s.business);
  const setQs = useApp((s) => s.setQuickstart);
  const updateBusiness = useApp((s) => s.updateBusiness);
  const [targetOpen, setTargetOpen] = useState(false);
  const [target, setTarget] = useState(String(business?.defaultMarginBp ?? 2000));

  const steps = [
    { key: 'item' as const, title: t('qs.item'), sub: t('qs.itemSub'), go: () => router.push('/items/new') },
    { key: 'purchase' as const, title: t('qs.purchase'), sub: t('qs.purchaseSub'), go: () => router.push('/buy') },
    { key: 'target' as const, title: t('qs.target'), sub: t('qs.targetSub'), go: () => setTargetOpen(true) },
  ];
  const done = steps.filter((s) => qs[s.key]).length;

  return (
    <View>
      <View style={{ paddingHorizontal: PAD, gap: 8, paddingBottom: 12 }}>
        <T size="small" color={colors.textMuted} num>{t('qs.progress', { done, total: 3 })}</T>
        <ProgressBar value={done / 3} color={colors.profit} label={t('qs.progress', { done, total: 3 })} />
      </View>
      {steps.map((s, i) => {
        const ok = qs[s.key];
        return (
          <Pressable key={s.key} accessibilityRole="button" accessibilityState={{ checked: ok }} onPress={s.go}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.keypad }]}>
            <View style={[styles.num, ok && styles.numDone]}>
              {ok ? <Icon name="check" size={18} color="#fff" /> : <T weight="bold" color={colors.ink}>{i + 1}</T>}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T size="title" weight="bold" color={ok ? colors.textMuted : colors.text}
                style={ok ? { textDecorationLine: 'line-through' } : undefined}>{s.title}</T>
              <T size="small" color={colors.textMuted}>{ok ? t('qs.done') : s.sub}</T>
            </View>
            <Icon name="chevronRight" size={20} color={colors.textDisabled} />
          </Pressable>
        );
      })}
      {!compact && (
        <Pressable accessibilityRole="button" onPress={() => router.push('/items/starter')} style={styles.row}>
          <View style={[styles.num, { borderColor: colors.border }]}><Icon name="list" size={18} color={colors.textMuted} /></View>
          <View style={{ flex: 1, gap: 2 }}>
            <T weight="medium">{t('qs.starter')}</T>
            <T size="small" color={colors.textMuted}>{t('qs.starterSub')}</T>
          </View>
          <Icon name="chevronRight" size={20} color={colors.textDisabled} />
        </Pressable>
      )}

      <BottomSheet visible={targetOpen} onClose={() => setTargetOpen(false)} title={t('qs.targetSheet')} subtitle={t('qs.targetHelp')}
        footer={<Button label={t('common.save')} onPress={() => {
          updateBusiness({ defaultMarginBp: Number(target) });
          setQs({ target: true });
          setTargetOpen(false);
        }} />}>
        <ChipGroup
          accessibilityLabel={t('qs.targetSheet')}
          options={TARGETS.map((v) => ({ value: v, label: formatBp(Number(v)) }))}
          value={TARGETS.includes(target as never) ? (target as (typeof TARGETS)[number]) : null}
          onChange={setTarget}
        />
        <T size="small" color={colors.textMuted}>{t('qs.targetExample', { pct: formatBp(Number(target)) })}</T>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 14, minHeight: 72,
    backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  num: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  numDone: { backgroundColor: colors.profit, borderColor: colors.profit },
});
