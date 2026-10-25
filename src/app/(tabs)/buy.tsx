import { useTranslation } from 'react-i18next';
import { EmptyState, Screen, ScreenTitle } from '@/ui';
import { View } from 'react-native';

// Module 04 builds this screen.
export default function BuyScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']}>
      <View style={{ paddingTop: 16 }}><ScreenTitle title={t('tabs.buy')} /></View>
      <EmptyState icon="buy" title={t('placeholder.buyTitle')} body={t('placeholder.body')} />
    </Screen>
  );
}
