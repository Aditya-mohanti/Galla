import { useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatBp } from '@/core/money';
import { formatPhone } from '@/core/phone';
import type { RoundingMode } from '@/core/roundNice';
import type { MarginMode } from '@/core/pricing';
import { formatDateTime } from '@/lib/date';
import { useApp, type BusinessType, type Lang } from '@/store/app';
import {
  AppHeader, Banner, BottomSheet, Button, ChipGroup, colors, ConfirmSheet, ListRow, PAD, Screen, SectionLabel, SegmentedControl, T, TextField,
} from '@/ui';

type Sheet = null | 'name' | 'type' | 'language' | 'target' | 'rounding' | 'logout';

export default function BusinessProfileScreen() {
  const { t } = useTranslation();
  const app = useApp();
  const b = app.business;
  const [sheet, setSheet] = useState<Sheet>(null);
  const [name, setName] = useState(b?.name ?? '');
  const [type, setType] = useState<BusinessType>(b?.type ?? 'retail');
  const [target, setTarget] = useState(String((b?.defaultMarginBp ?? 2000) / 100));
  const [mode, setMode] = useState<MarginMode>(b?.marginMode ?? 'markup');
  const [rounding, setRounding] = useState<RoundingMode>(b?.roundingMode ?? 'nice');
  if (!b) return null;

  const close = () => setSheet(null);
  const nameLen = name.trim().length;
  const nameErr = nameLen < 2 ? t('setup.errNameShort') : null;
  // On-price margin must stay under 100% (00 §6.4); markup is capped at a sane 500%.
  const targetPct = Number(target);
  const targetErr = !target || !(targetPct > 0) || targetPct >= (mode === 'on_price' ? 100 : 500) ? t('profile.targetErr') : null;
  const roundingOptions: { value: RoundingMode; label: string }[] = [
    { value: 'nice', label: t('profile.round.nice') }, { value: '1', label: '₹1' }, { value: '5', label: '₹5' },
    { value: '10', label: '₹10' }, { value: 'none', label: t('profile.round.none') },
  ];

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title={t('profile.title')} />
      <ScrollView>
        <SectionLabel>{t('profile.business')}</SectionLabel>
        <ListRow label={t('profile.name')} title={b.name} chevron onPress={() => { setName(b.name); setSheet('name'); }} />
        <ListRow label={t('profile.type')} title={t(`setup.type.${b.type}.title`)} chevron onPress={() => { setType(b.type); setSheet('type'); }} />
        <ListRow label={t('profile.language')} title={b.language === 'hi' ? 'हिन्दी' : 'English'} chevron onPress={() => setSheet('language')} />
        <ListRow label={t('profile.target')} title={t(b.marginMode === 'markup' ? 'profile.onCost' : 'profile.onPrice', { pct: formatBp(b.defaultMarginBp) })}
          chevron onPress={() => { setTarget(String(b.defaultMarginBp / 100)); setMode(b.marginMode); setSheet('target'); }} />
        <ListRow label={t('profile.rounding')} title={roundingOptions.find((o) => o.value === b.roundingMode)?.label ?? ''}
          subtitle={b.roundingMode === 'nice' ? t('profile.round.niceEx') : undefined}
          chevron onPress={() => { setRounding(b.roundingMode); setSheet('rounding'); }} />
        <ListRow label={t('categories.title')} title={t('profile.manageCategories')} chevron onPress={() => router.push('/more/categories')} />

        <SectionLabel>{t('profile.account')}</SectionLabel>
        <ListRow label={t('profile.loggedIn')} title={`+91 ${formatPhone(app.session?.phone ?? b.ownerPhone)}`} />
        <ListRow label={t('profile.backup')}
          title={app.lastBackupAt ? formatDateTime(app.lastBackupAt, b.language) : t('profile.neverBacked')}
          subtitle={app.unbackedChanges ? t('profile.pending', { count: app.unbackedChanges }) : undefined} />
        <ListRow title={t('profile.logout')} titleColor={colors.loss} onPress={() => setSheet('logout')} />
        <T size="small" color={colors.textMuted} style={{ padding: PAD }}>{t('profile.logoutNote')}</T>
      </ScrollView>

      <BottomSheet visible={sheet === 'name'} onClose={close} title={t('profile.name')}
        footer={<Button label={t('common.save')} disabled={!!nameErr} onPress={() => { app.updateBusiness({ name: name.trim() }); close(); }} />}>
        <TextField value={name} onChangeText={(s) => setName(s.slice(0, 60))} autoFocus error={nameErr} maxLength={60} accessibilityLabel={t('profile.name')} />
      </BottomSheet>

      <BottomSheet visible={sheet === 'type'} onClose={close} title={t('profile.type')}
        footer={<Button label={t('common.save')} onPress={() => { app.updateBusiness({ type }); close(); }} />}>
        <ChipGroup options={(['retail', 'wholesale', 'online', 'home'] as const).map((v) => ({ value: v, label: t(`setup.type.${v}.title`) }))}
          value={type} onChange={setType} accessibilityLabel={t('profile.type')} />
        <T size="small" color={colors.ink}>{t(`setup.type.${type}.effect`)}</T>
      </BottomSheet>

      <BottomSheet visible={sheet === 'language'} onClose={close} title={t('profile.language')} subtitle={t('profile.languageNow')}>
        {(['hi', 'en'] as Lang[]).map((l) => (
          <Button key={l} label={l === 'hi' ? 'हिन्दी' : 'English'} variant={b.language === l ? 'outline' : 'secondary'}
            icon={b.language === l ? 'check' : undefined} onPress={() => { app.setLanguage(l); close(); }} />
        ))}
      </BottomSheet>

      <BottomSheet visible={sheet === 'target'} onClose={close} title={t('profile.target')} subtitle={t('qs.targetHelp')}
        footer={<Button label={t('common.save')} disabled={!!targetErr}
          onPress={() => { app.updateBusiness({ defaultMarginBp: Math.round(Number(target) * 100), marginMode: mode }); app.setQuickstart({ target: true }); close(); }} />}>
        <SegmentedControl label={t('profile.target')} value={mode} onChange={setMode}
          options={[{ value: 'markup', label: t('profile.modeCost') }, { value: 'on_price', label: t('profile.modePrice') }]} />
        <TextField value={target} onChangeText={(s) => setTarget(s.replace(/[^\d.]/g, '').slice(0, 5))} keyboardType="decimal-pad" suffix="%"
          error={targetErr}
          accessibilityLabel={t('profile.target')} />
        <T size="small" color={colors.textMuted}>{t(mode === 'markup' ? 'profile.modeCostEx' : 'profile.modePriceEx', { pct: `${target || 0}%` })}</T>
      </BottomSheet>

      <BottomSheet visible={sheet === 'rounding'} onClose={close} title={t('profile.rounding')}
        footer={<Button label={t('common.save')} onPress={() => { app.updateBusiness({ roundingMode: rounding }); close(); }} />}>
        <ChipGroup options={roundingOptions} value={rounding} onChange={setRounding} accessibilityLabel={t('profile.rounding')} />
        <T size="small" color={colors.textMuted}>{t(`profile.round.ex_${rounding}`)}</T>
      </BottomSheet>

      <ConfirmSheet visible={sheet === 'logout'} onClose={close} danger title={t('profile.logoutTitle')}
        confirmLabel={t('profile.logout')}
        onConfirm={() => { close(); app.logout(); router.replace('/'); }}>
        <T color={colors.textMuted}>{t('profile.logoutBody')}</T>
        {app.unbackedChanges > 0 ? (
          <Banner tone="warning" title={t('profile.unbackedTitle', { count: app.unbackedChanges })} body={t('profile.unbackedBody')} />
        ) : (
          <Banner tone="profit" title={t('profile.allBacked')} />
        )}
      </ConfirmSheet>
    </Screen>
  );
}
