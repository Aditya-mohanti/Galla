import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconButton } from './Button';
import { T } from './Text';
import { colors, PAD } from './theme';

export function Screen({ children, edges = ['top', 'bottom'], bg = colors.paper, keyboard }: {
  children: ReactNode; edges?: Edge[]; bg?: string; keyboard?: boolean;
}) {
  const body = <View style={{ flex: 1 }}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg }}>
      {keyboard ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}</KeyboardAvoidingView>
      ) : body}
    </SafeAreaView>
  );
}

/** Back / title / actions. `plain` drops the white bar for onboarding screens. */
export function AppHeader({ title, back = true, close, onBack, right, plain }: {
  title?: string; back?: boolean; close?: boolean; onBack?: () => void; right?: ReactNode; plain?: boolean;
}) {
  const { t } = useTranslation();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={[styles.header, plain && styles.plain]}>
      {(back || close) ? (
        <IconButton name={close ? 'close' : 'back'} label={close ? t('common.close') : t('common.back')} onPress={goBack} />
      ) : <View style={{ width: 8 }} />}
      <View style={{ flex: 1 }}>
        {title ? <T size="title" weight="bold" numberOfLines={1}>{title}</T> : null}
      </View>
      {right}
    </View>
  );
}

/** Big screen title for tab roots and onboarding. */
export function ScreenTitle({ title, sub, eyebrow }: { title: string; sub?: string; eyebrow?: string }) {
  return (
    <View style={{ paddingHorizontal: PAD, gap: 4 }}>
      {eyebrow ? <T size="small" color={colors.textMuted}>{eyebrow}</T> : null}
      <T size="h2" weight="bold" accessibilityRole="header">{title}</T>
      {sub ? <T color={colors.textMuted}>{sub}</T> : null}
    </View>
  );
}

/** Primary action pinned to the bottom. */
export function BottomActionBar({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.bar, style]}>{children}</View>;
}

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      <T size="small" color={colors.textMuted} upper style={{ flex: 1 }}>{children}</T>
      {right}
    </View>
  );
}

export const Divider = () => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;

const styles = StyleSheet.create({
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4,
    backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  plain: { backgroundColor: 'transparent', borderBottomWidth: 0 },
  bar: { paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 12, gap: 8, backgroundColor: colors.paper },
  section: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingTop: 20, paddingBottom: 8 },
});
