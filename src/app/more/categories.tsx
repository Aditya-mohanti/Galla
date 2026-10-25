import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { liveCategories, liveItems, useData } from '@/store/data';
import type { Category } from '@/store/types';
import { toast } from '@/store/toast';
import { AppHeader, BottomSheet, Button, ChipGroup, colors, FieldLabel, Icon, IconButton, ListRow, PAD, Screen, T, TextField } from '@/ui';

type Sheet = null | { kind: 'new' } | { kind: 'edit'; cat: Category } | { kind: 'move'; cat: Category };

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const d = useData();
  const cats = useMemo(() => liveCategories(d.categories), [d.categories]);
  const items = useMemo(() => liveItems(d.items), [d.items]);
  const countOf = (id: string | null) => items.filter((i) => i.categoryId === id).length;
  const [sheet, setSheet] = useState<Sheet>(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState<string>('none');

  const open = (s: Sheet) => {
    setErr(null);
    setName(s && s.kind === 'edit' ? s.cat.name : '');
    setMoveTo('none');
    setSheet(s);
  };
  const errText = (e: 'duplicate' | 'empty') => (e === 'duplicate' ? t('categories.errDuplicate') : t('categories.errEmpty'));

  const save = () => {
    if (!sheet) return;
    const r = sheet.kind === 'new' ? d.createCategory(name) : sheet.kind === 'edit' ? d.renameCategory(sheet.cat.id, name) : null;
    if (r && !r.ok) return setErr(errText(r.error));
    setSheet(null);
  };

  const remove = (cat: Category) => {
    if (countOf(cat.id) > 0) return open({ kind: 'move', cat });
    d.deleteCategory(cat.id);
    toast({ kind: 'success', message: t('categories.deleted', { name: cat.name }) });
    setSheet(null);
  };

  const moveAndDelete = (cat: Category) => {
    d.moveCategoryItems(cat.id, moveTo === 'none' ? null : moveTo);
    d.deleteCategory(cat.id);
    toast({ kind: 'success', message: t('categories.deleted', { name: cat.name }) });
    setSheet(null);
  };

  return (
    <Screen>
      <AppHeader title={t('categories.title')} right={<Button label={`+ ${t('categories.new')}`} variant="outline" compact onPress={() => open({ kind: 'new' })} style={{ marginRight: 8 }} />} />
      <FlatList
        data={cats}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={styles.summary}>
            <T size="small" color={colors.textMuted} num style={{ flex: 1 }}>{t('categories.summary', { cats: cats.length, items: items.length })}</T>
            <T size="small" color={colors.textMuted}>{t('categories.tapRename')}</T>
          </View>
        }
        renderItem={({ item: c }) => {
          const n = countOf(c.id);
          return (
            <ListRow title={c.name} onPress={() => open({ kind: 'edit', cat: c })}
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <T weight="bold" num>{n}</T>
                  {n === 0
                    ? <IconButton name="trash" color={colors.loss} label={t('categories.deleteNamed', { name: c.name })} onPress={() => remove(c)} />
                    : <View style={{ width: 48, alignItems: 'center' }}><Icon name="chevronRight" size={20} color={colors.textDisabled} /></View>}
                </View>
              } />
          );
        }}
        ListFooterComponent={
          <>
            <ListRow title={t('items.noCategory')} italic right={<View style={{ paddingRight: 48 }}><T weight="bold" num>{countOf(null)}</T></View>} />
            <T size="small" color={colors.textMuted} style={{ padding: PAD }}>{t('categories.footer')}</T>
          </>
        }
      />

      <BottomSheet visible={!!sheet && sheet.kind !== 'move'} onClose={() => setSheet(null)}
        title={sheet?.kind === 'edit' ? t('categories.rename') : t('categories.new')}
        footer={<>
          <Button label={t('common.save')} onPress={save} disabled={!name.trim()} />
          {sheet?.kind === 'edit' ? (
            <Button label={countOf(sheet.cat.id) ? t('categories.moveDelete') : t('categories.delete')} variant="ghost" compact
              onPress={() => remove(sheet.cat)} />
          ) : null}
        </>}>
        <TextField value={name} onChangeText={(s) => { setName(s.slice(0, 40)); setErr(null); }} autoFocus error={err}
          placeholder={t('categories.newPh')} accessibilityLabel={t('categories.name')} onSubmitEditing={save} />
      </BottomSheet>

      {/* Deleting a category with items: move them first, in the same sheet. */}
      <BottomSheet visible={sheet?.kind === 'move'} onClose={() => setSheet(null)}
        title={sheet?.kind === 'move' ? t('categories.moveTitle', { name: sheet.cat.name }) : ''}
        subtitle={sheet?.kind === 'move' ? t('categories.moveSub', { count: countOf(sheet.cat.id) }) : undefined}
        footer={sheet?.kind === 'move' ? (
          <>
            <Button label={t('categories.moveConfirm')} variant="danger" onPress={() => moveAndDelete(sheet.cat)} />
            <Button label={t('common.cancel')} variant="secondary" onPress={() => setSheet(null)} />
          </>
        ) : null}>
        <FieldLabel>{t('categories.moveTo')}</FieldLabel>
        <ChipGroup accessibilityLabel={t('categories.moveTo')} value={moveTo} onChange={setMoveTo}
          options={[{ value: 'none', label: t('items.noCategory') },
            ...cats.filter((c) => sheet?.kind !== 'move' || c.id !== sheet.cat.id).map((c) => ({ value: c.id, label: c.name }))]} />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', paddingHorizontal: PAD, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
