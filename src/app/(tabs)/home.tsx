import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Network from 'expo-network';
import { formatINR } from '@/core/money';
import { stockStatus, stockValue } from '@/core/stock';
import { QuickStartList } from '@/features/onboarding/QuickStartList';
import { useApp } from '@/store/app';
import { liveItems, useData } from '@/store/data';
import { colors, Icon, IconButton, ListRow, PAD, Screen, SectionLabel, T } from '@/ui';

/** Home (module 09 builds the full dashboard). Here: quick-start pinned until done (ON-8) and a stock glance. */
export default function HomeScreen() {
  const { t } = useTranslation();
  const business = useApp((s) => s.business);
  const qs = useApp((s) => s.quickstart);
  const setQs = useApp((s) => s.setQuickstart);
  const itemsMap = useData((s) => s.items);
  const net = Network.useNetworkState();
  const items = useMemo(() => liveItems(itemsMap).filter((i) => !i.archived), [itemsMap]);
  const low = items.filter((i) => stockStatus(i.stockQty, i.lowStockQty) === 'low').length;
  const out = items.filter((i) => i.stockQty <= 0).length;
  const showQs = !qs.dismissed && !(qs.item && qs.purchase && qs.target);
  const offline = net.isConnected === false || net.isInternetReachable === false;

  return (
    <Screen edges={['top']}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <T size="small" color={colors.textMuted}>{t('home.hello')}</T>
          <T size="h2" weight="bold" numberOfLines={1}>{business?.name}</T>
        </View>
        {/* Offline is normal: a calm word, never a red error. */}
        <View style={styles.status} accessibilityLabel={offline ? t('home.offline') : t('home.saved')}>
          <Icon name={offline ? 'wifiOff' : 'cloudCheck'} size={16} color={colors.textMuted} />
          <T size="small" color={colors.textMuted}>{offline ? t('home.offline') : t('home.saved')}</T>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {showQs && (
          <>
            <SectionLabel right={<IconButton name="close" label={t('qs.dismiss')} size={20} onPress={() => setQs({ dismissed: true })} />}>
              {t('qs.title')}
            </SectionLabel>
            <QuickStartList compact />
          </>
        )}
        <SectionLabel>{t('home.stock')}</SectionLabel>
        <ListRow title={t('home.stockValue')} right={<T weight="bold" num>{formatINR(stockValue(items, 'cost'), { decimals: 'never' })}</T>}
          subtitle={t('home.itemsCount', { count: items.length })} onPress={() => router.push('/items')} chevron />
        <ListRow title={t('home.lowStock')} right={<T weight="bold" num color={low ? colors.warning : colors.text}>{low}</T>}
          onPress={() => router.push({ pathname: '/items', params: { filter: 'low' } })} chevron />
        <ListRow title={t('home.outStock')} right={<T weight="bold" num color={out ? colors.loss : colors.text}>{out}</T>}
          onPress={() => router.push({ pathname: '/items', params: { filter: 'out' } })} chevron />
        <T size="small" color={colors.textMuted} style={{ padding: PAD }}>{t('home.comingSoon')}</T>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.borderSoft },
});
