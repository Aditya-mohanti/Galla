import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatINR, roundHalfUp } from '@/core/money';
import { countDelta } from '@/core/stock';
import { allowsDecimal, formatQtyNumber } from '@/core/units';
import { addDays, formatDay, todayISO } from '@/lib/date';
import { useApp } from '@/store/app';
import { useData } from '@/store/data';
import type { AdjustReason, Item } from '@/store/types';
import { toast } from '@/store/toast';
import { Banner, BottomSheet, Button, ChipGroup, colors, FieldLabel, QuantityStepper, radius, T, TextField } from '@/ui';
import { qtyText, unitLabel } from './helpers';

const REASONS: AdjustReason[] = ['damage', 'loss', 'count', 'return', 'other'];
// Returns from customers add stock; damage and loss remove it. Count decides by itself.
const DEFAULT_DIR: Record<AdjustReason, 'add' | 'remove'> = { damage: 'remove', loss: 'remove', count: 'remove', return: 'add', other: 'remove' };

export function AdjustSheet({ item, visible, onClose }: { item: Item; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const lang = useApp((s) => s.language) ?? 'en';
  const addAdjustment = useData((s) => s.addAdjustment);
  const [reason, setReason] = useState<AdjustReason>('count');
  const [dir, setDir] = useState<'add' | 'remove'>('remove');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());

  // Reset the form each time the sheet opens (or the stock changes while open).
  const openKey = visible ? item.stockQty : null;
  const [prevOpenKey, setPrevOpenKey] = useState<number | null>(null);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey !== null) {
      setReason('count'); setDir('remove'); setNote(''); setDate(todayISO());
      setQty(String(Math.max(item.stockQty, 0)));
    }
  }

  const dec = allowsDecimal(item.unit);
  const n = Number(qty);
  const valid = qty !== '' && Number.isFinite(n) && n >= 0 && (dec || Number.isInteger(n));
  const isCount = reason === 'count';
  const change = !valid ? 0 : isCount ? countDelta(n, item.stockQty) : dir === 'add' ? n : -n;
  const after = item.stockQty + change;
  const removesMore = !isCount && dir === 'remove' && valid && n > Math.max(item.stockQty, 0);
  const moneyImpact = item.avgCostPaise > 0 ? roundHalfUp(Math.abs(change) * item.avgCostPaise) : 0;
  const u2 = unitLabel(t, item.unit, 2);

  const pickReason = (r: AdjustReason) => {
    setReason(r);
    if (r === 'count') setQty(String(Math.max(item.stockQty, 0)));
    else { setDir(DEFAULT_DIR[r]); setQty(''); }
  };

  const save = () => {
    if (!valid || change === 0) return;
    addAdjustment({ itemId: item.id, date, qtyChange: change, reason, note: note.trim() || null });
    toast({ kind: 'success', message: t('adjust.saved', { from: formatQtyNumber(item.stockQty), to: qtyText(t, after, item.unit) }) });
    onClose();
  };

  const dates = [todayISO(), addDays(todayISO(), -1)];

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('adjust.title')}
      subtitle={<T size="small" color={colors.textMuted} num>{item.name} · {t('adjust.inApp')} <T size="small" weight="bold" num>{qtyText(t, item.stockQty, item.unit)}</T></T>}
      footer={<Button label={change === 0 && valid ? t('adjust.noChange') : t('common.save')} disabled={!valid || change === 0} onPress={save} />}>
      <View>
        <FieldLabel>{t('adjust.why')}</FieldLabel>
        <ChipGroup accessibilityLabel={t('adjust.why')} value={reason} onChange={pickReason}
          options={REASONS.map((r) => ({ value: r, label: t(`adjust.reason.${r}`) }))} />
      </View>

      {/* For a physical count the direction comes from the count, so the toggle is hidden rather than shown disabled (v1 gap). */}
      {!isCount ? (
        <View style={styles.toggle} accessibilityRole="radiogroup">
          {(['add', 'remove'] as const).map((d) => (
            <Pressable key={d} accessibilityRole="radio" accessibilityState={{ selected: dir === d }} onPress={() => setDir(d)}
              style={[styles.toggleItem, dir === d && (d === 'add' ? styles.addOn : styles.removeOn)]}>
              <T weight="bold" color={dir === d ? (d === 'add' ? colors.profit : colors.loss) : colors.textMuted}>
                {d === 'add' ? `+ ${t('adjust.add')}` : `− ${t('adjust.remove')}`}
              </T>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View>
        <FieldLabel>{isCount ? t('adjust.howMany') : t('adjust.qty')}</FieldLabel>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
          <View style={{ flex: 1.4 }}>
            <QuantityStepper value={qty} onChange={setQty} unitLabel={u2} allowDecimal={dec} label={t('adjust.qty')} step={1} />
          </View>
          <View style={[styles.diff, { backgroundColor: change < 0 ? colors.lossTint : change > 0 ? colors.profitTint : colors.borderSoft }]}>
            <T size="small" color={colors.text}>{t('adjust.difference')}</T>
            <T size="title" weight="bold" num color={change < 0 ? colors.loss : change > 0 ? colors.profit : colors.textMuted}>
              {change > 0 ? '+' : ''}{qtyText(t, change, item.unit)}
            </T>
          </View>
        </View>
        {!dec && qty.includes('.') ? <T size="small" color={colors.loss} style={{ marginTop: 6 }}>{t('item.errWhole', { unit: unitLabel(t, item.unit, 1) })}</T> : null}
      </View>

      {removesMore ? <Banner tone="warning" title={t('adjust.moreThanStock')} body={t('adjust.moreThanStockBody', { qty: qtyText(t, item.stockQty, item.unit) })} /> : null}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TextField style={{ flex: 1.4 }} label={t('adjust.note')} value={note} onChangeText={(s) => setNote(s.slice(0, 120))} placeholder={t(`adjust.notePh.${reason}`)} />
        <View style={{ flex: 1 }}>
          <FieldLabel>{t('adjust.date')}</FieldLabel>
          <ChipGroup accessibilityLabel={t('adjust.date')} value={date} onChange={setDate}
            options={dates.map((d, i) => ({ value: d, label: i === 0 ? t('adjust.today') : t('adjust.yesterday') }))} />
        </View>
      </View>

      {valid && change !== 0 ? (
        <T size="small" color={colors.textMuted} num>
          {t('adjust.summary', { from: formatQtyNumber(item.stockQty), to: qtyText(t, after, item.unit), cost: formatINR(item.avgCostPaise), date: formatDay(date, lang) })}
          {moneyImpact > 0 ? ` ${t(change < 0 ? 'adjust.impactLoss' : 'adjust.impactGain', { amt: formatINR(moneyImpact) })}` : ''}
        </T>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, overflow: 'hidden' },
  toggleItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.keypad },
  addOn: { backgroundColor: colors.profitTint },
  removeOn: { backgroundColor: colors.lossTint },
  diff: { flex: 1, borderRadius: radius.input, padding: 10, justifyContent: 'center', gap: 2 },
});
