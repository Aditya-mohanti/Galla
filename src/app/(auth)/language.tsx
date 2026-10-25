import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useApp, type Lang } from '@/store/app';
import { colors, Icon, PAD, radius, Screen, T } from '@/ui';

// 1.1 — shown on first launch. Both languages are always visible here, so no t() fallback
// can leave a Hindi-only reader stuck on an English screen.
const OPTIONS: { value: Lang; title: string; sub: string }[] = [
  { value: 'hi', title: 'हिन्दी', sub: 'Hindi' },
  { value: 'en', title: 'English', sub: 'अंग्रेज़ी' },
];

export default function LanguageScreen() {
  const current = useApp((s) => s.language);
  const setLanguage = useApp((s) => s.setLanguage);
  const pick = (l: Lang) => {
    setLanguage(l);
    router.push('/phone');
  };
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: PAD, gap: 12 }}>
        <View style={styles.logo}><T size="h2" weight="bold" color="#fff">G</T></View>
        <T size="h1" weight="bold" accessibilityRole="header">Galla</T>
        <T color={colors.textMuted}>Buying, selling, stock and profit — in one register.</T>
        <T color={colors.textMuted}>खरीदा, बेचा, स्टॉक और मुनाफा — एक ही बही में।</T>
      </View>
      <View style={{ paddingHorizontal: PAD, gap: 12, paddingBottom: 16 }}>
        <T size="small" color={colors.textMuted}>Choose your language · भाषा चुनें</T>
        {OPTIONS.map((o) => {
          const on = current === o.value;
          return (
            <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: on }}
              accessibilityLabel={`${o.title}, ${o.sub}`} onPress={() => pick(o.value)}
              style={({ pressed }) => [styles.card, on && styles.cardOn, pressed && { backgroundColor: colors.keypad }]}>
              <View style={{ flex: 1 }}>
                <T size="h2" weight="bold">{o.title}</T>
                <T color={colors.textMuted}>{o.sub}</T>
              </View>
              <Icon name={on ? 'checkCircle' : 'chevronRight'} color={on ? colors.ink : colors.textMuted} />
            </Pressable>
          );
        })}
        <T size="small" color={colors.textMuted} center>You can change this later in Settings · बाद में सेटिंग में बदल सकते हैं</T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 64, height: 64, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  card: {
    minHeight: 84, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderRadius: radius.sheet,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  cardOn: { borderWidth: 2, borderColor: colors.ink },
});
