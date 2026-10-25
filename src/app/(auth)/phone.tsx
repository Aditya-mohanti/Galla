import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Network from 'expo-network';
import { formatPhone, normalizePhone, phoneError } from '@/core/phone';
import { NoInternetError, sendOtp } from '@/services/auth';
import { AppHeader, Banner, BottomActionBar, Button, colors, Icon, NumericKeypad, PAD, Screen, ScreenTitle, T, TextField } from '@/ui';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const [digits, setDigits] = useState('');
  const [sending, setSending] = useState(false);
  const [offline, setOffline] = useState(false);
  const net = Network.useNetworkState();
  const retryOnReconnect = useRef(false);

  const err = phoneError(digits);
  // Show "start" straight away (it can never become valid); length errors only once 10+ digits are typed.
  const visibleErr = err === 'start' ? t('phone.errStart') : err === 'long' ? t('phone.errLong') : null;

  const submit = async () => {
    if (err || sending) return;
    setSending(true);
    try {
      await sendOtp(digits);
      setOffline(false);
      router.push({ pathname: '/otp', params: { phone: digits } });
    } catch (e) {
      if (e instanceof NoInternetError) {
        setOffline(true);
        retryOnReconnect.current = true;
      }
    } finally {
      setSending(false);
    }
  };

  // Edge case: no internet on first login — retry by itself as soon as the network is back.
  useEffect(() => {
    if (offline && retryOnReconnect.current && net.isConnected && net.isInternetReachable !== false) {
      retryOnReconnect.current = false;
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net.isConnected, net.isInternetReachable]);

  return (
    <Screen>
      <AppHeader plain />
      <View style={{ flex: 1, gap: 16 }}>
        <ScreenTitle title={t('phone.title')} sub={t('phone.sub')} />
        <View style={{ paddingHorizontal: PAD, gap: 12 }}>
          <TextField
            big
            prefix="+91"
            value={formatPhone(digits)}
            onChangeText={(s) => setDigits(normalizePhone(s).slice(0, 10))}
            showSoftInputOnFocus={false}
            autoFocus
            error={visibleErr}
            accessibilityLabel={t('phone.a11y')}
            placeholder="98XXX XXXXX"
          />
          {offline ? (
            <Banner tone="warning" icon="wifiOff" title={t('phone.offlineTitle')} body={t('phone.offlineBody')} />
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Icon name="lock" size={18} color={colors.textMuted} />
            <T size="small" color={colors.textMuted} style={{ flex: 1 }}>{t('phone.privacy')}</T>
          </View>
        </View>
      </View>
      <BottomActionBar>
        <Button
          label={offline ? t('common.tryAgain') : t('phone.send')}
          disabled={!!err}
          loading={sending}
          onPress={submit}
          accessibilityHint={err ? t('phone.hintDisabled') : undefined}
        />
      </BottomActionBar>
      <NumericKeypad
        onKey={(d) => setDigits((x) => (x.length < 10 ? x + d : x))}
        onBackspace={() => setDigits((x) => x.slice(0, -1))}
      />
    </Screen>
  );
}
