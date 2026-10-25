import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { useApp } from '@/store/app';
import { colors, Icon, ListRow, PAD, Screen, ScreenTitle, SectionLabel, T, type IconName } from '@/ui';

export default function MoreScreen() {
  const { t } = useTranslation();
  const business = useApp((s) => s.business);
  const row = (icon: IconName, title: string, onPress: () => void, sub?: string) => (
    <ListRow key={title} title={title} subtitle={sub} onPress={onPress} chevron
      left={<Icon name={icon} color={colors.textMuted} />} />
  );
  return (
    <Screen edges={['top']}>
      <ScrollView>
        <View style={{ paddingTop: 16, paddingBottom: 8 }}><ScreenTitle title={t('tabs.more')} /></View>
        <SectionLabel>{t('more.business')}</SectionLabel>
        {row('store', t('profile.title'), () => router.push('/more/business'), business?.name)}
        {row('tag', t('categories.title'), () => router.push('/more/categories'))}
        {row('archive', t('more.archived'), () => router.push({ pathname: '/items', params: { filter: 'archived' } }))}
        {row('list', t('qs.starter'), () => router.push('/items/starter'))}
        <SectionLabel>{t('more.app')}</SectionLabel>
        {row('globe', t('profile.language'), () => router.push('/more/business'), business?.language === 'hi' ? 'हिन्दी' : 'English')}
        <T size="small" color={colors.textMuted} style={{ padding: PAD }}>
          Galla {Constants.expoConfig?.version ?? ''}
        </T>
      </ScrollView>
    </Screen>
  );
}
