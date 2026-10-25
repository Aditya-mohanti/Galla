import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatPhone } from '@/core/phone';
import { DEV_OTP, LOCK_S, MAX_ATTEMPTS, NoInternetError, OTP_LENGTH, RESEND_AFTER_S, sendOtp, verifyOtp } from '@/services/auth';
import { findBackup } from '@/services/backup';
import { useApp } from '@/store/app';
import { AppHeader, Banner, colors, FieldMessage, PAD, radius, Screen, T } from '@/ui';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function useCountdown(initial: number) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return;
    const h = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(h);
  }, [left]);
  return [left, setLeft] as const;
}

export default function OtpScreen() {
  const { t } = useTranslation();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const login = useApp((s) => s.login);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'wrong' | 'offline'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [resendIn, setResendIn] = useCountdown(RESEND_AFTER_S);
  const [lockedFor, setLockedFor] = useCountdown(0);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const locked = lockedFor > 0;

  useEffect(() => {
    if (!locked && attempts >= MAX_ATTEMPTS) setAttempts(0); // lock over → fresh tries
  }, [locked, attempts]);

  const verify = async (c: string) => {
    setStatus('checking');
    try {
      const ok = await verifyOtp(phone, c);
      if (!ok) {
        const n = attempts + 1;
        setAttempts(n);
        setStatus('wrong');
        if (n >= MAX_ATTEMPTS) { setLockedFor(LOCK_S); setCode(''); }
        return;
      }
      login(phone);
      const existing = useApp.getState().business;
      // Logging back in on the same phone: local data is still here, go straight in.
      if (existing) return router.replace('/home');
      const backup = await findBackup(phone);
      if (backup) router.replace({ pathname: '/restore', params: { summary: JSON.stringify(backup) } });
      else router.replace('/setup');
    } catch (e) {
      setStatus(e instanceof NoInternetError ? 'offline' : 'wrong');
    }
  };

  const onChange = (s: string) => {
    if (locked) return;
    const c = s.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(c);
    if (status === 'wrong' || status === 'offline') setStatus('idle');
    if (c.length === OTP_LENGTH) void verify(c);
  };

  const resend = async () => {
    try {
      await sendOtp(phone);
      setResendIn(RESEND_AFTER_S);
      setCode('');
      setStatus('idle');
    } catch {
      setStatus('offline');
    }
  };

  const triesLeft = MAX_ATTEMPTS - attempts;
  const boxBorder = status === 'wrong' ? colors.loss : colors.border;

  return (
    <Screen keyboard>
      <AppHeader plain />
      <View style={{ paddingHorizontal: PAD, gap: 16 }}>
        <View style={{ gap: 4 }}>
          <T size="h2" weight="bold" accessibilityRole="header">{t('otp.title')}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
            <T color={colors.textMuted} num>{t('otp.sentTo', { phone: `+91 ${formatPhone(phone)}` })} · </T>
            <Pressable accessibilityRole="link" onPress={() => router.back()} hitSlop={8}>
              <T color={colors.ink} weight="medium" style={{ textDecorationLine: 'underline' }}>{t('otp.change')}</T>
            </Pressable>
          </View>
        </View>

        {/* One real input behind the boxes so Android SMS auto-read and iOS code autofill both work. */}
        <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel={t('otp.a11y')} style={styles.boxes}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => {
            const active = i === code.length && !locked && status !== 'checking';
            return (
              <View key={i} style={[styles.box, { borderColor: active ? colors.ink : boxBorder }, (active || status === 'wrong') && { borderWidth: 2 }, locked && styles.boxLocked]}>
                <T size="h2" weight="bold" num>{code[i] ?? ''}</T>
              </View>
            );
          })}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={onChange}
            autoFocus
            editable={!locked}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            maxLength={OTP_LENGTH}
            style={styles.hiddenInput}
            caretHidden
          />
        </Pressable>

        {status === 'checking' ? <T color={colors.textMuted}>{t('otp.checking')}</T> : null}
        {status === 'wrong' && !locked ? (
          <FieldMessage error={triesLeft === 1 ? t('otp.wrongOne') : t('otp.wrong', { count: triesLeft })} />
        ) : null}
        {status === 'offline' ? <Banner tone="warning" icon="wifiOff" title={t('phone.offlineTitle')} body={t('otp.offlineBody')} /> : null}
        {locked ? (
          <Banner tone="loss" icon="lock" title={t('otp.lockedTitle')} body={t('otp.lockedBody', { time: mmss(lockedFor) })} />
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <T size="small" color={colors.textMuted} style={{ flex: 1 }}>
            {Platform.OS === 'android' ? t('otp.autoReadAndroid') : t('otp.autoReadIos')}
          </T>
          {resendIn > 0 ? (
            <T size="small" color={colors.textMuted} num>{t('otp.resendIn')} <T size="small" weight="bold" num>{mmss(resendIn)}</T></T>
          ) : (
            <Pressable accessibilityRole="button" onPress={resend} hitSlop={10} style={{ minHeight: 44, justifyContent: 'center' }}>
              <T weight="bold" color={colors.ink}>{t('otp.resend')}</T>
            </Pressable>
          )}
        </View>
        {__DEV__ ? <T size="small" color={colors.textDisabled}>{t('otp.devHint', { code: DEV_OTP })}</T> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, height: 60, borderWidth: 1, borderRadius: radius.input, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  boxLocked: { backgroundColor: colors.borderSoft },
  hiddenInput: { position: 'absolute', opacity: 0.01, width: '100%', height: '100%' },
});
