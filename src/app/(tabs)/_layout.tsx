import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { nextRoute } from '@/features/onboarding/guard';
import { useApp } from '@/store/app';
import { colors, Icon, T, type IconName } from '@/ui';

const TABS: { name: string; icon: IconName; key: string; verb?: boolean }[] = [
  { name: 'home', icon: 'home', key: 'tabs.home' },
  { name: 'items', icon: 'box', key: 'tabs.items' },
  { name: 'buy', icon: 'buy', key: 'tabs.buy', verb: true },
  { name: 'sell', icon: 'sell', key: 'tabs.sell', verb: true },
  { name: 'more', icon: 'menu', key: 'tabs.more' },
];

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const i = state.routes.findIndex((r) => r.name === tab.name);
        if (i < 0) return null;
        const on = state.index === i;
        // Buy and Sell are the main verbs: darker by default, but no floating centre button.
        const c = on ? colors.ink : tab.verb ? colors.text : colors.textMuted;
        return (
          <Pressable key={tab.name} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t(tab.key)}
            onPress={() => navigateToTab(state.routes[i].key)} style={styles.tab}>
            <View style={[styles.pill, on && { backgroundColor: colors.inkTint }]}>
              <Icon name={tab.icon} color={c} strokeWidth={tab.verb || on ? 2.4 : 2} />
            </View>
            <T size="small" weight={on ? 'bold' : tab.verb ? 'medium' : 'regular'} color={c} numberOfLines={1}>{t(tab.key)}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const s = useApp();
  const route = nextRoute(s);
  if (route !== '/home') return <Redirect href={route} />;
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => <Tabs.Screen key={tab.name} name={tab.name} />)}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  tab: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pill: { width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
