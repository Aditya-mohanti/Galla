import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatBp, formatINR } from '@/core/money';
import { suggestPrice } from '@/core/pricing';
import { profitPerUnit, stockStatus } from '@/core/stock';
import { formatQtyNumber } from '@/core/units';
import { formatDay } from '@/lib/date';
import { AdjustSheet } from '@/features/items/AdjustSheet';
import { qtyText, unitLabel } from '@/features/items/helpers';
import { useApp } from '@/store/app';
import { useData } from '@/store/data';
import {
  AppHeader, Banner, BottomSheet, Button, colors, ConfirmSheet, EmptyState, Icon, IconButton, ListRow, PAD, ProfitText,
  radius, Screen, SectionLabel, StockChip, T, type IconName,
} from '@/ui';

type Activity = { id: string; date: string; createdAt: string; kind: 'buy' | 'sell' | 'adjust'; title: string; sub: string; qty: number; right: string; rightTone?: 'loss'; adjustmentId?: string };

export default function ItemDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lang = useApp((s) => s.language) ?? 'en';
  const business = useApp((s) => s.business);
  const d = useData();
  const item = d.items[id];
  const [sheet, setSheet] = useState<null | 'adjust' | 'menu' | 'archive' | 'how' | 'deleteAdj'>(null);
  const [adjToDelete, setAdjToDelete] = useState<string | null>(null);

  const activity = useMemo<Activity[]>(() => {
    if (!item) return [];
    const a: Activity[] = [];
    for (const p of Object.values(d.purchaseLines)) if (p.itemId === id && !p.deletedAt)
      a.push({ id: p.id, date: p.date, createdAt: p.createdAt, kind: 'buy', title: t('activity.buy'), sub: p.partyName ?? '', qty: p.qty, right: t('activity.cost', { amt: formatINR(p.landedUnitCostPaise) }) });
    for (const s of Object.values(d.saleLines)) if (s.itemId === id && !s.deletedAt)
      a.push({ id: s.id, date: s.date, createdAt: s.createdAt, kind: 'sell', title: t('activity.sell'), sub: [s.partyName, t(`channel.${s.channel}`)].filter(Boolean).join(' · '), qty: -s.qty,
        right: `@ ${formatINR(s.pricePaise)}${s.unitCostPaise > s.pricePaise ? ' ▼' : ''}`, rightTone: s.unitCostPaise > s.pricePaise ? 'loss' : undefined });
    for (const x of Object.values(d.adjustments)) if (x.itemId === id && !x.deletedAt)
      a.push({ id: x.id, date: x.date, createdAt: x.createdAt, kind: 'adjust', title: t('activity.adjusted'), sub: [t(`adjust.reason.${x.reason}`), x.note].filter(Boolean).join(' · '), qty: x.qtyChange, right: '', adjustmentId: x.id });
    return a.sort((p, q) => (q.date + q.createdAt).localeCompare(p.date + p.createdAt)).slice(0, 10);
  }, [d.purchaseLines, d.saleLines, d.adjustments, id, item, t]);

  if (!item || item.deletedAt) {
    return (
      <Screen>
        <AppHeader />
        <EmptyState icon="searchMinus" title={t('detail.notFound')}>
          <Button label={t('detail.backToItems')} variant="secondary" compact onPress={() => router.replace('/items')} />
        </EmptyState>
      </Screen>
    );
  }

  const status = stockStatus(item.stockQty, item.lowStockQty);
  const negative = item.stockQty < 0;
  const uOne = unitLabel(t, item.unit, 1);
  const profit = profitPerUnit(item.sellingPricePaise, item.avgCostPaise);
  const loss = profit != null && profit < 0 && item.sellingPricePaise > 0;

  // Module 08 owns the full suggestion; this uses the same core formula (cost basis = higher of avg / last purchase).
  const costBasis = Math.max(item.avgCostPaise, item.lastPurchaseCostPaise ?? 0);
  const marginBp = item.targetMarginBp ?? business?.defaultMarginBp ?? 2000;
  const sug = suggestPrice({ costPaise: costBasis, marginBp, mode: business?.marginMode ?? 'markup', rounding: business?.roundingMode ?? 'nice' });
  const priceState: { word: string; tone: string } | null = !sug.ok || item.sellingPricePaise <= 0 ? null
    : item.sellingPricePaise < sug.breakEvenPaise ? { word: t('detail.state.loss'), tone: colors.loss }
    : item.sellingPricePaise < sug.suggestedPaise ? { word: t('detail.state.low'), tone: colors.warning }
    : { word: t('detail.state.good'), tone: colors.profit };

  const archiveNow = () => {
    if (item.stockQty !== 0) {
      d.addAdjustment({ itemId: item.id, date: new Date().toISOString().slice(0, 10), qtyChange: -item.stockQty, reason: 'other', note: t('detail.archiveNote') });
    }
    d.archiveItem(item.id);
    setSheet(null);
    router.back();
  };

  const actions: { icon: IconName; label: string; color: string; onPress: () => void }[] = [
    { icon: 'buy', label: t('detail.buyMore'), color: colors.ink, onPress: () => router.push('/buy') },
    { icon: 'sell', label: t('detail.sell'), color: colors.profit, onPress: () => router.push('/sell') },
    { icon: 'sliders', label: t('detail.adjust'), color: colors.text, onPress: () => setSheet('adjust') },
    { icon: 'pencil', label: t('detail.edit'), color: colors.text, onPress: () => router.push(`/items/${item.id}/edit`) },
  ];

  return (
    <Screen>
      <AppHeader title={item.name} right={<IconButton name="more" label={t('detail.menu')} onPress={() => setSheet('menu')} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {item.archived ? (
          <Banner tone="info" icon="archive" title={t('detail.archived')} body={t('detail.archivedBody')} action={t('detail.restore')}
            onAction={() => d.restoreItem(item.id)} style={styles.banner} />
        ) : null}
        {loss ? (
          <Banner tone="loss" title={t('detail.lossTitle')}
            body={t('detail.lossBody', { price: formatINR(item.sellingPricePaise), cost: formatINR(item.avgCostPaise), amt: formatINR(-profit!), unit: uOne })}
            action={sug.ok ? t('detail.seeSuggested', { amt: formatINR(sug.suggestedPaise) }) : undefined}
            onAction={() => setSheet('how')} style={styles.banner} />
        ) : null}
        {negative ? (
          <Banner tone="warning" title={t('detail.negTitle', { qty: qtyText(t, item.stockQty, item.unit) })} body={t('detail.negBody')}
            action={t('detail.negAction')} onAction={() => router.push('/buy')} style={styles.banner} />
        ) : null}

        <View style={styles.top}>
          <T size="small" color={colors.textMuted}>
            {(item.categoryId ? d.categories[item.categoryId]?.name : t('items.noCategory'))} · {t(`stock.word.${negative ? 'negative' : status}`)}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <T size="h1" weight="bold" num color={negative ? colors.loss : colors.text}>{formatQtyNumber(item.stockQty)}</T>
            <T size="title" style={{ flex: 1 }}>{unitLabel(t, item.unit, item.stockQty)}</T>
            {item.lowStockQty != null
              ? <T size="small" color={colors.textMuted} num>{t('detail.alertBelow', { qty: formatQtyNumber(item.lowStockQty) })}</T>
              : <Pressable accessibilityRole="link" onPress={() => router.push(`/items/${item.id}/edit`)} hitSlop={8}>
                  <T size="small" color={colors.ink} weight="medium">{t('detail.setAlert')}</T>
                </Pressable>}
          </View>
          {status !== 'in' && !negative ? <StockChip status={status} /> : null}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <T size="small" color={colors.textMuted}>{t('detail.avgCost')}</T>
              {item.avgCostPaise > 0 ? <T size="title" weight="bold" num>{formatINR(item.avgCostPaise)}</T>
                : <T weight="bold" color={colors.warning}>{t('items.noCost')}</T>}
            </View>
            <View style={[styles.stat, styles.statMid]}>
              <T size="small" color={colors.textMuted}>{t('detail.price')}</T>
              {item.sellingPricePaise > 0 ? <T size="title" weight="bold" num>{formatINR(item.sellingPricePaise)}</T>
                : <T weight="bold" color={colors.warning}>{t('items.noPrice')}</T>}
            </View>
            <View style={styles.stat}>
              <T size="small" color={colors.textMuted}>{t('detail.profitPer', { unit: uOne })}</T>
              {profit == null || item.sellingPricePaise <= 0 ? (
                // Edge case: no cost yet → ask for it instead of showing a fake 100% margin.
                <Pressable accessibilityRole="link" onPress={() => router.push(`/items/${item.id}/edit`)} hitSlop={8}>
                  <T weight="bold" color={colors.ink} style={{ textDecorationLine: 'underline' }}>{profit == null ? t('detail.addCost') : t('detail.addPrice')}</T>
                </Pressable>
              ) : <ProfitText size="title" paise={profit} />}
            </View>
          </View>
        </View>

        <SectionLabel>{t('detail.suggested')}</SectionLabel>
        <View style={styles.card}>
          {sug.ok ? (
            <>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[[t('detail.sugg'), sug.suggestedPaise], [t('detail.now'), item.sellingPricePaise], [t('detail.breakEven'), sug.breakEvenPaise]].map(([k, v]) => (
                  <View key={k as string} style={{ flex: 1 }}>
                    <T size="small" color={colors.textMuted}>{k as string}</T>
                    <T size="title" weight="bold" num>{(v as number) > 0 ? formatINR(v as number) : '—'}</T>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                {priceState ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.dot, { backgroundColor: priceState.tone }]} />
                    <T weight="bold" color={priceState.tone}>{priceState.word}</T>
                  </View>
                ) : <View />}
                <Pressable accessibilityRole="link" onPress={() => setSheet('how')} hitSlop={8}>
                  <T color={colors.ink} style={{ textDecorationLine: 'underline' }}>{t('detail.how')}</T>
                </Pressable>
              </View>
              {sug.suggestedPaise !== item.sellingPricePaise ? (
                <Button label={t('detail.setPrice', { amt: formatINR(sug.suggestedPaise) })} variant={loss ? 'primary' : 'outline'}
                  onPress={() => d.setSellingPrice(item.id, sug.suggestedPaise)} />
              ) : null}
            </>
          ) : <T color={colors.textMuted}>{t('detail.noSuggestion')}</T>}
        </View>

        <SectionLabel>{t('detail.history')}</SectionLabel>
        <View style={styles.card}><T size="small" color={colors.textMuted}>{t('detail.historyStub')}</T></View>

        <SectionLabel>{t('detail.activity')}</SectionLabel>
        {activity.length === 0 ? (
          <View style={styles.card}><T color={colors.textMuted}>{t('detail.noActivity')}</T></View>
        ) : activity.map((a) => (
          <ListRow key={a.id}
            left={<T size="small" color={colors.textMuted} style={{ width: 52 }} num>{formatDay(a.date, lang)}</T>}
            title={a.title} subtitle={a.sub || undefined}
            accessibilityHint={a.adjustmentId ? t('activity.deleteHint') : undefined}
            onPress={a.adjustmentId ? () => { setAdjToDelete(a.adjustmentId!); setSheet('deleteAdj'); } : undefined}
            right={
              <View style={{ alignItems: 'flex-end' }}>
                <T weight="bold" num>{a.qty > 0 ? '+' : ''}{formatQtyNumber(a.qty)}</T>
                {a.right ? <T size="small" num color={a.rightTone === 'loss' ? colors.loss : colors.textMuted}>{a.right}</T> : null}
              </View>
            } />
        ))}
      </ScrollView>

      {!item.archived ? (
        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable key={a.label} accessibilityRole="button" onPress={a.onPress} style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.keypad }]}>
              <Icon name={a.icon} color={a.color} />
              <T size="small" weight="medium" color={a.color} numberOfLines={1}>{a.label}</T>
            </Pressable>
          ))}
        </View>
      ) : null}

      <AdjustSheet item={item} visible={sheet === 'adjust'} onClose={() => setSheet(null)} />

      <BottomSheet visible={sheet === 'menu'} onClose={() => setSheet(null)} title={item.name}>
        <View style={{ marginHorizontal: -PAD }}>
          <ListRow title={t('detail.edit')} left={<Icon name="pencil" />} onPress={() => { setSheet(null); router.push(`/items/${item.id}/edit`); }} />
          <ListRow title={t('detail.adjust')} left={<Icon name="sliders" />} onPress={() => setSheet('adjust')} />
          {item.archived
            ? <ListRow title={t('detail.restore')} left={<Icon name="restore" />} onPress={() => { d.restoreItem(item.id); setSheet(null); }} />
            : <ListRow title={t('detail.archive')} titleColor={colors.loss} left={<Icon name="archive" color={colors.loss} />} onPress={() => setSheet('archive')} />}
        </View>
      </BottomSheet>

      {/* IT-10: only zero-stock items can be archived — offer the one-tap fix instead of a dead end. */}
      <ConfirmSheet visible={sheet === 'archive'} onClose={() => setSheet(null)} danger
        title={t('detail.archiveTitle')}
        body={item.stockQty === 0 ? t('detail.archiveBody') : t('detail.archiveBlocked', { qty: qtyText(t, item.stockQty, item.unit) })}
        confirmLabel={item.stockQty === 0 ? t('detail.archive') : t('detail.zeroAndArchive')}
        onConfirm={archiveNow} />

      <ConfirmSheet visible={sheet === 'deleteAdj'} onClose={() => setSheet(null)} danger
        title={t('activity.deleteTitle')} body={t('activity.deleteBody')} confirmLabel={t('activity.delete')}
        onConfirm={() => { if (adjToDelete) d.deleteAdjustment(adjToDelete); setSheet(null); }} />

      <BottomSheet visible={sheet === 'how'} onClose={() => setSheet(null)} title={t('detail.how')}>
        {sug.ok ? (
          <View style={{ gap: 8 }}>
            {[
              [t('how.cost'), formatINR(costBasis)],
              [t('how.target'), `${formatBp(marginBp)} ${t(business?.marginMode === 'on_price' ? 'how.onPrice' : 'how.onCost')}`],
              [t('how.raw'), formatINR(sug.rawPaise)],
              [t('how.rounded'), formatINR(sug.suggestedPaise)],
              [t('how.breakEven'), formatINR(sug.breakEvenPaise)],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T color={colors.textMuted}>{k}</T><T weight="bold" num>{v}</T>
              </View>
            ))}
            <T size="small" color={colors.textMuted}>{t('how.note')}</T>
            {sug.suggestedPaise !== item.sellingPricePaise ? (
              <Button label={t('detail.setPrice', { amt: formatINR(sug.suggestedPaise) })} onPress={() => { d.setSellingPrice(item.id, sug.suggestedPaise); setSheet(null); }} />
            ) : null}
          </View>
        ) : <T color={colors.textMuted}>{t('detail.noSuggestion')}</T>}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { marginHorizontal: PAD, marginTop: 12 },
  top: { backgroundColor: colors.surface, padding: PAD, gap: 6, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  stats: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  stat: { flex: 1, gap: 2 },
  statMid: { borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingHorizontal: 10, marginHorizontal: 10 },
  card: { backgroundColor: colors.surface, padding: PAD, gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  action: { flex: 1, minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
