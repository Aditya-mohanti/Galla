import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, NotoSans_400Regular, NotoSans_500Medium, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';
import {
  NotoSansDevanagari_400Regular, NotoSansDevanagari_500Medium, NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import i18n from '@/i18n';
import { useApp } from '@/store/app';
import { useData } from '@/store/data';
import { colors, ToastHost } from '@/ui';

function useDataHydrated() {
  const [done, setDone] = useState(useData.persist.hasHydrated());
  useEffect(() => useData.persist.onFinishHydration(() => setDone(true)), []);
  return done;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular, NotoSans_500Medium, NotoSans_700Bold,
    NotoSansDevanagari_400Regular, NotoSansDevanagari_500Medium, NotoSansDevanagari_700Bold,
  });
  const appHydrated = useApp((s) => s.hydrated);
  const dataHydrated = useDataHydrated();
  const lang = useApp((s) => s.language) ?? 'en';

  // ON-1: language applies instantly, no restart.
  if (i18n.language !== lang) void i18n.changeLanguage(lang);

  if (!fontsLoaded || !appHydrated || !dataHydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: 'slide_from_right' }}>
        <Stack.Screen name="items/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <ToastHost />
    </SafeAreaProvider>
  );
}
