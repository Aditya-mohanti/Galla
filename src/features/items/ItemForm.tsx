import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, usePreventRemove } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { formatBp, formatINR, paiseToInput, parseRupees } from '@/core/money';
import { markupBp } from '@/core/stock';
import { allowsDecimal, parseQty, UNITS, type Unit } from '@/core/units';
import { findDuplicateItem, liveCategories, useData } from '@/store/data';
import type { ItemInput } from '@/store/types';
import { toast } from '@/store/toast';
import {
  AppHeader, Banner, BottomActionBar, BottomSheet, Button, ChipGroup, colors, ConfirmSheet, FieldLabel, FieldMessage,
  Icon, ListRow, MoneyInput, PAD, QtyInput, radius, Screen, T, TextField,
} from '@/ui';
import { unitLabel } from './helpers';

type Props = { mode: 'add' | 'edit'; itemId?: string; initialName?: string };

export function ItemForm({ mode, itemId, initialName }: Props) {
  const { t } = useTranslation();
  const store = useData();
  const existing = itemId ? store.items[itemId] : undefined;
  const cats = useMemo(() => liveCategories(store.categories), [store.categories]);

  const [name, setName] = useState(existing?.name ?? initialName ?? '');
  const [unit, setUnit] = useState<Unit>(existing?.unit ?? 'piece');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [price, setPrice] = useState(paiseToInput(existing?.sellingPricePaise || null));
  const [openQty, setOpenQty] = useState(existing?.openingQty ? String(existing.openingQty) : '');
  const [openCost, setOpenCost] = useState(paiseToInput(existing?.openingCostPaise || null));
  const [low, setLow] = useState(existing?.lowStockQty != null ? String(existing.lowStockQty) : '');
  const [sku, setSku] = useState(existing?.sku ?? '');
  const [photo, setPhoto] = useState<string | null>(existing?.photoUri ?? null);
  const [moreOpen, setMoreOpen] = useState(!!existing?.sku);
  const [tried, setTried] = useState(false);
  const [decimalNote, setDecimalNote] = useState(false);
  const [sheet, setSheet] = useState<null | 'category' | 'photo' | 'discard'>(null);
  const [newCat, setNewCat] = useState('');
  const [newCatErr, setNewCatErr] = useState<string | null>(null);

  const dec = allowsDecimal(unit);
  const uShort = unitLabel(t, unit, 1);
  const pricePaise = parseRupees(price) ?? 0;
  const costPaise = parseRupees(openCost) ?? 0;
  const qty = openQty ? parseQty(openQty, unit) : 0;
  const lowQty = low ? parseQty(low, unit) : null;

  const dup = name.trim() ? findDuplicateItem(store.items, name, itemId) : undefined;
  const nameErr = !name.trim() ? (tried ? t('item.errName') : null) : dup ? t('item.errDuplicate') : null;
  const qtyErr = openQty && qty === null ? t('item.errWhole', { unit: uShort }) : null;
  const lowErr = low && lowQty === null ? t('item.errWhole', { unit: uShort }) : null;
  const openingChanged = mode === 'edit' && existing &&
    ((qty ?? 0) !== existing.openingQty || costPaise !== existing.openingCostPaise);

  // Live profit line. With no cost, never show a misleading margin.
  const basisCost = mode === 'edit' && existing?.avgCostPaise ? existing.avgCostPaise : costPaise;
  let profitHint: { text: string; tone?: 'profit' | 'warning' } | null = null;
  if (pricePaise > 0 && basisCost > 0) {
    const p = pricePaise - basisCost;
    const mk = markupBp(pricePaise, basisCost) ?? 0;
    profitHint = p >= 0
      ? { text: t('item.profitAt', { amt: formatINR(p), unit: uShort, pct: formatBp(mk) }), tone: 'profit' }
      : { text: t('item.lossAt', { amt: formatINR(-p), unit: uShort }), tone: 'warning' };
  } else if (pricePaise > 0 && mode === 'add') {
    profitHint = { text: t('item.addCostHint') };
  }

  const dirty = mode === 'add'
    ? !!(name || price || openQty || openCost || low || sku || photo)
    : !!existing && (name !== existing.name || unit !== existing.unit || categoryId !== existing.categoryId ||
      pricePaise !== existing.sellingPricePaise || sku !== (existing.sku ?? '') || photo !== existing.photoUri ||
      lowQty !== existing.lowStockQty || !!openingChanged);

  // Hardware back / swipe must not silently lose typed data.
  const allowLeave = usePreventRemove(dirty, () => setSheet('discard'));
  const leave = (fn: () => void) => { allowLeave(); fn(); };
  const close = () => (dirty ? setSheet('discard') : router.back());

  const save = (another?: boolean) => {
    setTried(true);
    if (!name.trim() || dup || qtyErr || lowErr) return;
    const input: ItemInput = {
      name, unit, categoryId, sku: sku.trim() || null, photoUri: photo, sellingPricePaise: pricePaise,
      lowStockQty: lowQty, openingQty: qty ?? 0, openingCostPaise: costPaise,
    };
    const r = mode === 'add' ? store.createItem(input) : store.updateItem(itemId!, input);
    if (!r.ok) return;
    toast({ kind: 'success', message: t(mode === 'add' ? 'item.added' : 'item.updated', { name: name.trim() }) });
    if (another) {
      setName(''); setPrice(''); setOpenQty(''); setOpenCost(''); setLow(''); setSku(''); setPhoto(null); setTried(false);
      return;
    }
    if (mode === 'add') leave(() => router.replace(`/items/${r.id}`));
    else leave(() => router.back());
  };

  const pickPhoto = async (camera: boolean) => {
    setSheet(null);
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast({ kind: 'info', message: t('item.photoDenied') });
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0].uri);
  };

  const addCategory = () => {
    const r = store.createCategory(newCat);
    if (!r.ok) return setNewCatErr(r.error === 'duplicate' ? t('categories.errDuplicate') : t('categories.errEmpty'));
    setCategoryId(r.id); setNewCat(''); setNewCatErr(null); setSheet(null);
  };


  return (
    <Screen keyboard>
      <AppHeader close title={mode === 'add' ? t('item.newTitle') : t('item.editTitle')} onBack={close} />
      <ScrollView contentContainerStyle={{ padding: PAD, gap: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View>
          <TextField label={t('item.name')} required value={name} onChangeText={(s) => setName(s.slice(0, 80))}
            autoFocus={mode === 'add' && !initialName} placeholder={t('item.namePh')} error={nameErr} />
          {dup ? (
            <Pressable accessibilityRole="link" onPress={() => router.push(`/items/${dup.id}`)} style={{ marginTop: 6, minHeight: 32 }}>
              <T weight="bold" color={colors.ink} style={{ textDecorationLine: 'underline' }}>{t('item.openExisting', { name: dup.name })}</T>
            </Pressable>
          ) : null}
        </View>

        <View>
          <FieldLabel required>{t('item.unit')}</FieldLabel>
          <ChipGroup accessibilityLabel={t('item.unit')} value={unit} onChange={(u) => { setUnit(u); setDecimalNote(false); }}
            options={UNITS.map((u) => ({ value: u, label: t(`unitName.${u}`) }))} />
          <FieldMessage hint={dec ? t('item.unitDecimal') : decimalNote ? t('item.unitWhole', { unit: uShort }) : null}
            tone={decimalNote && !dec ? 'warning' : undefined} />
        </View>

        <View>
          <FieldLabel>{t('item.category')}</FieldLabel>
          <Pressable accessibilityRole="button" onPress={() => setSheet('category')} style={styles.select}>
            <T style={{ flex: 1 }} color={categoryId ? colors.text : colors.textDisabled}>
              {categoryId ? store.categories[categoryId]?.name : t('item.pickCategory')}
            </T>
            <Icon name="chevronDown" color={colors.textMuted} />
          </Pressable>
        </View>

        <MoneyInput label={t('item.price', { unit: uShort })} value={price} onChangeText={setPrice} placeholder="0"
          hint={profitHint?.text} hintTone={profitHint?.tone} />

        {mode === 'edit' ? (
          <Banner tone="info" title={t('item.stockRule')} body={t('item.stockRuleBody')} />
        ) : null}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <QtyInput style={{ flex: 1 }} label={t('item.openingQty')} value={openQty} onChangeText={setOpenQty} allowDecimal={dec}
            onDecimalBlocked={() => setDecimalNote(true)} suffix={unitLabel(t, unit, 2)} placeholder="0" error={qtyErr} />
          <MoneyInput style={{ flex: 1 }} label={t('item.costPer', { unit: uShort })} value={openCost} onChangeText={setOpenCost} placeholder="0" />
        </View>
        {openingChanged ? <Banner tone="warning" title={t('item.openingWarnTitle')} body={t('item.openingWarnBody')} /> : null}
        {mode === 'add' && (qty ?? 0) > 0 && costPaise === 0 ? <FieldMessage hint={t('item.noCostWarn')} tone="warning" /> : null}

        <QtyInput label={t('item.lowAlert')} value={low} onChangeText={setLow} allowDecimal={dec}
          onDecimalBlocked={() => setDecimalNote(true)} suffix={t('item.orFewer', { unit: unitLabel(t, unit, 2) })} placeholder="—"
          error={lowErr} hint={t('item.lowAlertHint')} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('item.photo')} onPress={() => setSheet('photo')} style={styles.photo}>
            {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} /> : (
              <><Icon name="camera" color={colors.textMuted} /><T size="small" color={colors.textMuted}>{t('item.photo')}</T></>
            )}
          </Pressable>
          <View style={{ flex: 1, gap: 4 }}>
            <T size="small" color={colors.textMuted}>{t('item.photoHint')}</T>
            {photo ? (
              <Pressable accessibilityRole="button" onPress={() => setPhoto(null)} hitSlop={8}>
                <T weight="bold" color={colors.loss}>{t('item.removePhoto')}</T>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Pressable accessibilityRole="button" accessibilityState={{ expanded: moreOpen }} onPress={() => setMoreOpen((x) => !x)} style={styles.more}>
          <T size="title" weight="medium">{t('item.more')}</T>
          <T size="small" color={colors.textMuted} style={{ flex: 1 }}>{t('item.moreSub')}</T>
          <Icon name={moreOpen ? 'chevronDown' : 'chevronRight'} color={colors.textMuted} />
        </Pressable>
        {moreOpen ? (
          <TextField label={t('item.sku')} value={sku} onChangeText={(s) => setSku(s.slice(0, 30))} placeholder={t('item.skuPh')} />
        ) : null}
      </ScrollView>
      <BottomActionBar style={styles.bar}>
        <Button label={t('common.save')} onPress={() => save()} />
        {mode === 'add' ? <Button label={t('item.saveAnother')} variant="ghost" compact onPress={() => save(true)} /> : null}
      </BottomActionBar>

      <BottomSheet visible={sheet === 'category'} onClose={() => setSheet(null)} title={t('item.category')}>
        <View style={{ marginHorizontal: -PAD }}>
          <ListRow title={t('items.noCategory')} italic right={!categoryId ? <Icon name="check" color={colors.ink} /> : undefined}
            onPress={() => { setCategoryId(null); setSheet(null); }} />
          {cats.map((c) => (
            <ListRow key={c.id} title={c.name} right={categoryId === c.id ? <Icon name="check" color={colors.ink} /> : undefined}
              onPress={() => { setCategoryId(c.id); setSheet(null); }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <TextField style={{ flex: 1 }} value={newCat} onChangeText={(s) => { setNewCat(s.slice(0, 40)); setNewCatErr(null); }}
            placeholder={t('categories.newPh')} error={newCatErr} onSubmitEditing={addCategory} accessibilityLabel={t('categories.new')} />
          <Button label={t('categories.add')} compact variant="outline" onPress={addCategory} disabled={!newCat.trim()} />
        </View>
      </BottomSheet>

      <BottomSheet visible={sheet === 'photo'} onClose={() => setSheet(null)} title={t('item.photo')}>
        <Button label={t('item.camera')} icon="camera" variant="secondary" onPress={() => pickPhoto(true)} />
        <Button label={t('item.gallery')} icon="list" variant="secondary" onPress={() => pickPhoto(false)} />
      </BottomSheet>

      <ConfirmSheet visible={sheet === 'discard'} onClose={() => setSheet(null)} danger title={t('item.discardTitle')}
        body={t('item.discardBody')} confirmLabel={t('item.discard')} cancelLabel={t('item.keepEditing')}
        onConfirm={() => { setSheet(null); leave(() => router.back()); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  select: {
    minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, backgroundColor: colors.surface,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  photo: {
    width: 88, height: 88, borderRadius: radius.input, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textDisabled,
    alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden', backgroundColor: colors.surface,
  },
  more: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12 },
  bar: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
