import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { QuickStartList } from '@/features/onboarding/QuickStartList';
import { useApp } from '@/store/app';
import { BottomActionBar, Button, colors, Screen, ScreenTitle } from '@/ui';

export default function QuickStartScreen() {
  const { t } = useTranslation();
  const name = useApp((s) => s.business?.name ?? '');
  return (
    <Screen>
      <View style={{ paddingTop: 24, paddingBottom: 16 }}>
        <ScreenTitle eyebrow={t('qs.ready', { name })} title={t('qs.title')} sub={t('qs.sub')} />
      </View>
      <View style={styles.list}><QuickStartList /></View>
      <View style={{ flex: 1 }} />
      <BottomActionBar>
        <Button label={t('qs.skip')} variant="ghost" onPress={() => router.replace('/home')} />
      </BottomActionBar>
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border } });
