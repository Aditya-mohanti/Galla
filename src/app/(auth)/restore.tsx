import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatDateTime, formatDay, nowIso } from '@/lib/date';
import { RESTORE_CHUNKS, RestoreInterrupted, restoreBackup, type BackupSummary } from '@/services/backup';
import { useApp } from '@/store/app';
import { useData } from '@/store/data';
import { uuid } from '@/lib/id';
import {
  Banner, BottomActionBar, Button, colors, ConfirmSheet, Icon, PAD, ProgressBar, radius, Screen, T,
} from '@/ui';

type Phase = 'found' | 'restoring' | 'failed';

export default function RestoreScreen() {
  const { t } = useTranslation();
  const lang = useApp((s) => s.language) ?? 'en';
  const { summary } = useLocalSearchParams<{ summary: string }>();
  const b = JSON.parse(summary ?? '{}') as BackupSummary;
  const [phase, setPhase] = useState<Phase>('found');
  const [progress, setProgress] = useState(0);
  const [chunk, setChunk] = useState(0);
  const [askFresh, setAskFresh] = useState(false);

  const run = async (from: number) => {
    setPhase('restoring');
    try {
      const data = await restoreBackup(from, (p, c) => { setProgress(p); setChunk(c); });
      useData.getState().replaceAll(data);
      const t0 = nowIso();
      useApp.getState().restoreBusiness({
        id: uuid(), name: b.businessName, type: b.businessType, defaultMarginBp: 2000, marginMode: 'markup',
        roundingMode: 'nice', slowMovingDays: 30, createdAt: t0, updatedAt: t0,
      }, b.backedUpAt);
      router.replace('/home');
    } catch (e) {
      if (e instanceof RestoreInterrupted) setChunk(e.chunk);
      setPhase('failed');
    }
  };

  const notMine = () => {
    useApp.getState().logout();
    router.replace('/phone');
  };

  const rows: [string, string][] = [
    [t('restore.items'), String(b.itemCount)],
    [t('restore.lastSale'), formatDay(b.lastSaleDate, lang)],
    [t('restore.backedUp'), formatDateTime(b.backedUpAt, lang)],
  ];

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: PAD, paddingTop: 48, gap: 16 }}>
        <View style={styles.icon}>
          <Icon name={phase === 'failed' ? 'wifiOff' : 'cloudDown'} size={28} color={phase === 'failed' ? colors.warning : colors.ink} />
        </View>
        {phase === 'found' && (
          <>
            <View style={{ gap: 4 }}>
              <T size="h2" weight="bold" accessibilityRole="header">{t('restore.title')}</T>
              <T color={colors.textMuted}>{t('restore.sub')}</T>
            </View>
            <View style={styles.card}>
              <T size="title" weight="bold" style={{ paddingVertical: 12 }}>{b.businessName}</T>
              {rows.map(([k, v]) => (
                <View key={k} style={styles.kv}>
                  <T color={colors.textMuted}>{k}</T>
                  <T num>{v}</T>
                </View>
              ))}
            </View>
            <T size="small" color={colors.textMuted}>{t('restore.size', { kb: b.sizeKb })}</T>
          </>
        )}
        {phase === 'restoring' && (
          <>
            <View style={{ gap: 4 }}>
              <T size="h2" weight="bold" accessibilityRole="header">{t('restore.progressTitle')}</T>
              <T color={colors.textMuted}>{t('restore.progressSub', { name: b.businessName })}</T>
            </View>
            <ProgressBar value={progress} label={t('restore.progressTitle')} />
            <T num weight="bold">{Math.round(progress * 100)}%</T>
            <Banner tone="info" title={t('restore.keepOpen')} body={t('restore.keepOpenBody')} />
          </>
        )}
        {phase === 'failed' && (
          <>
            <View style={{ gap: 4 }}>
              <T size="h2" weight="bold" accessibilityRole="header">{t('restore.failedTitle')}</T>
              <T color={colors.textMuted}>{t('restore.failedSub', { pct: Math.round((chunk / RESTORE_CHUNKS) * 100) })}</T>
            </View>
            <ProgressBar value={chunk / RESTORE_CHUNKS} color={colors.warning} />
            <Banner tone="info" icon="lock" title={t('restore.safeTitle')} body={t('restore.safeBody')} />
          </>
        )}
      </View>
      {phase !== 'restoring' && (
        <BottomActionBar>
          <Button label={phase === 'failed' ? t('restore.resume') : t('restore.restore')} onPress={() => run(phase === 'failed' ? chunk : 0)} />
          <Button label={t('restore.fresh')} variant="secondary" onPress={() => setAskFresh(true)} />
          {phase === 'found' && <Button label={t('restore.notMine')} variant="ghost" compact onPress={notMine} />}
        </BottomActionBar>
      )}
      <ConfirmSheet
        visible={askFresh}
        onClose={() => setAskFresh(false)}
        title={t('restore.freshTitle')}
        body={t('restore.freshBody')}
        confirmLabel={t('restore.freshConfirm')}
        onConfirm={() => { setAskFresh(false); router.replace('/setup'); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.inkTint, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sheet, paddingHorizontal: PAD, paddingBottom: 4 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
