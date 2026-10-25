import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Share, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatINR } from '@/core/money';
import { hasDevanagari } from '@/core/search';
import { isSlowMoving, stockStatus, stockValue } from '@/core/stock';
import { todayISO } from '@/lib/date';
import { filterItems, reorderText, type ItemFilter, type ItemSort } from '@/features/items/helpers';
import { ItemRow } from '@/features/items/ItemRow';
import { useApp } from '@/store/app';
import { liveCategories, liveItems, useData } from '@/store/data';
import {
  BottomSheet, Button, ChipGroup, colors, EmptyState, Icon, ListRow, PAD, radius, Screen, SegmentedControl, T, TextField,
} from '@/ui';

export default function ItemsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ filter?: ItemFilter }>();
  const business = useApp((s) => s.business);
  const itemsMap = useData((s) => s.items);
  const catsMap = useData((s) => s.categories);

  const [filter, setFilter] = useState<ItemFilter>(params.filter ?? 'all');
  const [categoryId, setCategoryId] = useState<string | null | 'none'>(null);
  const [sort, setSort] = useState<ItemSort>('name');
  const [basis, setBasis] = useState<'cost' | 'price'>('cost');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<null | 'sort' | 'category'>(null);

  useEffect(() => { if (params.filter) setFilter(params.filter); }, [params.filter]);
  // IT-11: debounce 150 ms.
  useEffect(() => { const h = setTimeout(() => setSearch(query.trim()), 150); return () => clearTimeout(h); }, [query]);

  const today = todayISO();
  const slowDays = business?.slowMovingDays ?? 30;
  const all = useMemo(() => liveItems(itemsMap), [itemsMap]);
  const active = useMemo(() => all.filter((i) => !i.archived), [all]);
  const counts = useMemo(() => ({
    low: active.filter((i) => stockStatus(i.stockQty, i.lowStockQty) === 'low').length,
    out: active.filter((i) => i.stockQty <= 0).length,
    slow: active.filter((i) => isSlowMoving(i, today, slowDays)).length,
    archived: all.length - active.length,
  }), [all, active, today, slowDays]);
  const cats = useMemo(() => liveCategories(catsMap), [catsMap]);

  const { items, soundMatches } = useMemo(
    () => filterItems(all, catsMap, { filter, categoryId, search, sort, today, slowDays }),
    [all, catsMap, filter, categoryId, search, sort, today, slowDays],
  );
  const value = stockValue(active, basis);
  const narrowed = filter !== 'all' || categoryId !== null;

  const shareReorder = useCallback(() => {
    void Share.share({ message: reorderText(t, business?.name ?? '', items) });
  }, [t, business?.name, items]);

  const catName = (id: string | null) => (id ? catsMap[id]?.name : undefined);
  const categoryLabel = categoryId === null ? t('items.filter.category')
    : categoryId === 'none' ? t('items.noCategory') : catName(categoryId) ?? '';

  const filterChips = [
    { value: 'all' as const, label: t('items.filter.all') },
    { value: 'low' as const, label: t('items.filter.low'), count: counts.low, countColor: colors.warning },
    { value: 'out' as const, label: t('items.filter.out'), count: counts.out, countColor: colors.loss },
    { value: 'slow' as const, label: t('items.filter.slow'), count: counts.slow },
    ...(counts.archived ? [{ value: 'archived' as const, label: t('items.filter.archived'), count: counts.archived }] : []),
  ];

  // Empty shop: two ways in, including the starter catalogue.
  if (all.length === 0) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}><T size="h2" weight="bold" accessibilityRole="header">{t('tabs.items')}</T></View>
        <EmptyState icon="box" title={t('items.emptyTitle')} body={t('items.emptyBody')}>
          <Button label={t('items.addFirst')} onPress={() => router.push('/items/new')} style={{ alignSelf: 'stretch' }} />
          <Button label={t('items.pickCommon')} variant="secondary" icon="list" onPress={() => router.push('/items/starter')} style={{ alignSelf: 'stretch' }} />
        </EmptyState>
      </Screen>
    );
  }

  const header = (
    <View>
      <View style={styles.summary}>
        <View style={{ flex: 1 }}>
          <T size="small" color={colors.textMuted} num>{t('items.count', { count: active.length })} · {t(basis === 'cost' ? 'items.valueCost' : 'items.valuePrice')}</T>
          <T size="title" weight="bold" num>{formatINR(value, { decimals: 'never' })}</T>
        </View>
        <SegmentedControl label={t('items.valueBasis')} value={basis} onChange={setBasis}
          options={[{ value: 'cost', label: t('items.cost') }, { value: 'price', label: t('items.price') }]} />
      </View>
      <View style={{ paddingHorizontal: PAD, paddingBottom: 12 }}>
        <TextField value={query} onChangeText={setQuery} placeholder={t('items.searchPh')} leftIcon="search" clearable
          accessibilityLabel={t('items.searchPh')} />
      </View>
      <View style={{ flexDirection: 'row', paddingBottom: 12 }}>
        <ChipGroup<ItemFilter | 'cat'> scroll options={[...filterChips, { value: 'cat', label: `${categoryLabel} ▾` }]}
          value={filter} accessibilityLabel={t('items.filter.label')}
          onChange={(v) => (v === 'cat' ? setSheet('category') : setFilter(v))} />
      </View>
      {search ? (
        <T size="small" color={colors.textMuted} style={styles.note}>
          {narrowed ? t('items.searchedIn', { count: items.length }) : t('items.searchedAll', { count: all.length })}
          {soundMatches ? ` · ${t('items.soundNote')}` : ''}
        </T>
      ) : null}
      {filter === 'low' && items.length > 0 ? (
        <View style={{ paddingHorizontal: PAD, paddingBottom: 12 }}>
          <Button label={t('items.shareReorder')} variant="outline" icon="share" compact onPress={shareReorder} />
        </View>
      ) : null}
      {filter === 'archived' ? <T size="small" color={colors.textMuted} style={styles.note}>{t('items.archivedNote')}</T> : null}
    </View>
  );

  const noResults = (
    <View style={{ paddingTop: 32 }}>
      <EmptyState icon="searchMinus"
        title={search ? t('items.noMatch', { q: search }) : t(`items.emptyFilter.${filter}`)}
        body={search ? (hasDevanagari(search) ? t('items.noMatchBodyHi') : t('items.noMatchBody')) : undefined}>
        {narrowed ? <Button label={t('items.searchAll')} variant="secondary" compact onPress={() => { setFilter('all'); setCategoryId(null); }} /> : null}
        {search ? (
          <Button label={t('items.addNamed', { q: search })} icon="plus" compact
            onPress={() => router.push({ pathname: '/items/new', params: { name: search } })} />
        ) : null}
      </EmptyState>
    </View>
  );

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <T size="h2" weight="bold" accessibilityRole="header" style={{ flex: 1 }}>{t('tabs.items')}</T>
        <Pressable accessibilityRole="button" accessibilityLabel={t('items.sortBy', { sort: t(`items.sort.${sort}`) })}
          onPress={() => setSheet('sort')} style={styles.sortBtn} hitSlop={4}>
          <Icon name="sort" size={20} />
          <T>{t(`items.sort.${sort}`)}</T>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={header}
        ListEmptyComponent={noResults}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ItemRow item={item} categoryName={catName(item.categoryId)} showValue="price"
            onPress={() => router.push(`/items/${item.id}`)} />
        )}
        // Leaves room for the FAB so it never covers the last row's numbers (v1 gap).
        contentContainerStyle={{ paddingBottom: 96 }}
        initialNumToRender={14}
        windowSize={11}
        removeClippedSubviews
      />
      <Pressable accessibilityRole="button" accessibilityLabel={t('items.add')} onPress={() => router.push('/items/new')} style={styles.fab}>
        <Icon name="plus" color="#fff" />
        <T size="title" weight="bold" color="#fff">{t('items.add')}</T>
      </Pressable>

      <BottomSheet visible={sheet === 'sort'} onClose={() => setSheet(null)} title={t('items.sortTitle')}>
        <View style={{ marginHorizontal: -PAD }}>
          {(['name', 'stockAsc', 'value', 'lastSold'] as ItemSort[]).map((s) => (
            <ListRow key={s} title={t(`items.sort.${s}`)} subtitle={t(`items.sortSub.${s}`)}
              right={sort === s ? <Icon name="check" color={colors.ink} /> : undefined}
              onPress={() => { setSort(s); setSheet(null); }} />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={sheet === 'category'} onClose={() => setSheet(null)} title={t('items.filter.category')}>
        <View style={{ marginHorizontal: -PAD }}>
          <ListRow title={t('items.allCategories')} right={categoryId === null ? <Icon name="check" color={colors.ink} /> : undefined}
            onPress={() => { setCategoryId(null); setSheet(null); }} />
          {cats.map((c) => (
            <ListRow key={c.id} title={c.name} right={categoryId === c.id ? <Icon name="check" color={colors.ink} /> : undefined}
              onPress={() => { setCategoryId(c.id); setSheet(null); }} />
          ))}
          <ListRow title={t('items.noCategory')} italic right={categoryId === 'none' ? <Icon name="check" color={colors.ink} /> : undefined}
            onPress={() => { setCategoryId('none'); setSheet(null); }} />
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: PAD,
    backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 12 },
  note: { paddingHorizontal: PAD, paddingBottom: 8 },
  fab: {
    position: 'absolute', right: PAD, bottom: 16, height: 52, paddingHorizontal: 20, borderRadius: radius.input,
    backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#1C1B19', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
});
