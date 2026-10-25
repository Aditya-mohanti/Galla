import { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatINR } from '@/core/money';
import { stockStatus } from '@/core/stock';
import type { Item } from '@/store/types';
import { colors, Initials, PAD, radius, StockChip, T } from '@/ui';
import { qtyText } from './helpers';

export const ItemRow = memo(function ItemRow({ item, categoryName, onPress, showValue }: {
  item: Item; categoryName?: string; onPress: () => void; showValue: 'cost' | 'price';
}) {
  const { t } = useTranslation();
  const status = stockStatus(item.stockQty, item.lowStockQty);
  const negative = item.stockQty < 0;
  const unitValue = showValue === 'cost' ? item.avgCostPaise : item.sellingPricePaise;
  const sub = [categoryName ?? t('items.noCategory')].join(' · ');
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      accessibilityLabel={`${item.name}, ${qtyText(t, item.stockQty, item.unit)}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.keypad }]}>
      {item.photoUri ? <Image source={{ uri: item.photoUri }} style={styles.photo} accessibilityIgnoresInvertColors /> : <Initials name={item.name} />}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T numberOfLines={2}>{item.name}</T>
        <T size="small" color={colors.textMuted} numberOfLines={1}>{sub}</T>
        {/* The hint gets its own line so it is never truncated (gap in v1 design). */}
        {negative ? <T size="small" color={colors.loss}>{t('items.negativeHint')}</T> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4, maxWidth: '40%' }}>
        <T weight="bold" num color={negative ? colors.loss : colors.text}>{qtyText(t, item.stockQty, item.unit)}</T>
        {status !== 'in' && !negative ? <StockChip status={status} />
          : unitValue > 0 ? <T size="small" color={colors.textMuted} num>{formatINR(unitValue)}</T>
          : <T size="small" color={colors.warning}>{showValue === 'cost' ? t('items.noCost') : t('items.noPrice')}</T>}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 12, minHeight: 72,
    backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  photo: { width: 44, height: 44, borderRadius: radius.input, backgroundColor: colors.borderSoft },
});
