import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { starterFor, type StarterItem } from '@/services/starterCatalog';
import { useApp } from '@/store/app';
import { findDuplicateItem, useData } from '@/store/data';
import { toast } from '@/store/toast';
import { AppHeader, BottomActionBar, Button, colors, Icon, PAD, radius, Screen, SectionLabel, T } from '@/ui';
import { unitLabel } from '@/features/items/helpers';

export default function StarterCatalogScreen() {
  const { t } = useTranslation();
  const type = useApp((s) => s.business?.type);
  const items = useData((s) => s.items);
  const addStarterItems = useData((s) => s.addStarterItems);
  const catalog = useMemo(() => starterFor(type), [type]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const sections = useMemo(() => {
    const by = new Map<string, StarterItem[]>();
    for (const s of catalog) by.set(s.category, [...(by.get(s.category) ?? []), s]);
    return [...by.entries()].map(([title, data]) => ({ title, data }));
  }, [catalog]);

  const toggle = (name: string) => setPicked((p) => {
    const n = new Set(p);
    if (n.has(name)) n.delete(name); else n.add(name);
    return n;
  });

  const add = () => {
    const count = addStarterItems(catalog.filter((s) => picked.has(s.name)));
    toast({ kind: 'success', message: t('starter.added', { count }) });
    router.replace('/items');
  };

  return (
    <Screen>
      <AppHeader title={t('starter.title')} />
      <SectionList
        sections={sections}
        keyExtractor={(s) => s.name}
        ListHeaderComponent={<T color={colors.textMuted} style={{ padding: PAD }}>{t('starter.sub')}</T>}
        renderSectionHeader={({ section }) => <SectionLabel>{section.title}</SectionLabel>}
        stickySectionHeadersEnabled={false}
        renderItem={({ item: s }) => {
          const exists = !!findDuplicateItem(items, s.name);
          const on = picked.has(s.name);
          return (
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on || exists, disabled: exists }} disabled={exists}
              onPress={() => toggle(s.name)} style={styles.row}>
              <View style={[styles.box, (on || exists) && styles.boxOn, exists && { backgroundColor: colors.textDisabled, borderColor: colors.textDisabled }]}>
                {on || exists ? <Icon name="check" size={16} color="#fff" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <T color={exists ? colors.textMuted : colors.text}>{s.name}</T>
                <T size="small" color={colors.textMuted}>{exists ? t('starter.exists') : t('starter.unit', { unit: unitLabel(t, s.unit, 1) })}</T>
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <BottomActionBar style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
        <T size="small" color={colors.textMuted} center>{t('starter.note')}</T>
        <Button label={picked.size ? t('starter.add', { count: picked.size }) : t('starter.pick')} disabled={!picked.size} onPress={add} />
      </BottomActionBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, minHeight: 60, paddingVertical: 8, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.ink, borderColor: colors.ink },
});
