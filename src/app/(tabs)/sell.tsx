import { useTranslation } from 'react-i18next';
import { EmptyState, Screen, ScreenTitle } from '@/ui';
import { View } from 'react-native';

// Module 05 builds this screen.
export default function SellScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']}>
      <View style={{ paddingTop: 16 }}><ScreenTitle title={t('tabs.sell')} /></View>
      <EmptyState icon="sell" title={t('placeholder.sellTitle')} body={t('placeholder.body')} />
    </Screen>
  );
}
