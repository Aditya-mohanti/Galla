import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApp, type BusinessType } from '@/store/app';
import { BottomActionBar, Button, colors, FieldMessage, Icon, PAD, ProgressBar, radius, Screen, T, TextField, type IconName } from '@/ui';

const TYPES: { value: BusinessType; icon: IconName }[] = [
  { value: 'retail', icon: 'store' },
  { value: 'wholesale', icon: 'box' },
  { value: 'online', icon: 'laptop' },
  { value: 'home', icon: 'house' },
];

const NAME_MIN = 2;
const NAME_MAX = 60;

export default function SetupScreen() {
  const { t } = useTranslation();
  const draft = useApp((s) => s.setupDraft);
  const setDraft = useApp((s) => s.setSetupDraft);
  const createBusiness = useApp((s) => s.createBusiness);
  const [tried, setTried] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const len = draft.name.trim().length;
  const nameErr = len === 0 ? t('setup.errNameEmpty') : len < NAME_MIN ? t('setup.errNameShort') : null;
  const typeErr = !draft.type ? t('setup.errType') : null;

  const start = () => {
    setTried(true);
    if (nameErr || typeErr || !draft.type) return;
    createBusiness(draft.name, draft.type);
    router.replace('/quickstart');
  };

  return (
    <Screen keyboard>
      <ScrollView contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: 24, paddingBottom: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <T size="small" color={colors.textMuted}>{t('setup.step')}</T>
          <ProgressBar value={1} label={t('setup.step')} />
          <T size="h2" weight="bold" accessibilityRole="header">{t('setup.title')}</T>
        </View>

        <TextField
          label={t('setup.name')}
          required
          value={draft.name}
          onChangeText={(s) => setDraft({ name: s.slice(0, NAME_MAX) })}
          onBlur={() => setNameTouched(true)}
          placeholder={t('setup.namePh')}
          maxLength={NAME_MAX}
          error={(tried || nameTouched) ? nameErr : null}
          hint={len > NAME_MAX - 10 ? t('setup.nameCount', { n: len, max: NAME_MAX }) : null}
        />

        <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t('setup.kind')}>
          <T size="small" color={colors.textMuted}>{t('setup.kind')} *</T>
          {TYPES.map((o) => {
            const on = draft.type === o.value;
            return (
              <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: on }}
                onPress={() => setDraft({ type: o.value })}
                style={[styles.card, on && styles.cardOn, tried && typeErr && styles.cardErr]}>
                <View style={[styles.icon, on && { backgroundColor: colors.inkTint }]}>
                  <Icon name={o.icon} color={on ? colors.ink : colors.text} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T size="title" weight="bold">{t(`setup.type.${o.value}.title`)}</T>
                  <T size="small" color={colors.textMuted}>{t(`setup.type.${o.value}.sub`)}</T>
                  {on ? <T size="small" color={colors.ink} style={{ marginTop: 4 }}>{t(`setup.type.${o.value}.effect`)}</T> : null}
                </View>
                {on ? <Icon name="check" color={colors.ink} /> : null}
              </Pressable>
            );
          })}
          {tried ? <FieldMessage error={typeErr} /> : null}
        </View>
        <T size="small" color={colors.textMuted}>{t('setup.changeLater')}</T>
      </ScrollView>
      <BottomActionBar>
        <Button label={t('setup.start')} onPress={start} />
      </BottomActionBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, minHeight: 76,
    borderRadius: radius.sheet, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  cardOn: { borderWidth: 2, borderColor: colors.ink },
  cardErr: { borderColor: colors.loss },
  icon: { width: 48, height: 48, borderRadius: radius.input, backgroundColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
});
