import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, IconButton } from './Button';
import { T } from './Text';
import { colors, PAD, radius, sheetShadow } from './theme';

export function BottomSheet({ visible, onClose, title, subtitle, children, footer }: {
  visible: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable accessibilityLabel={t('common.close')} style={styles.scrim} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]} accessibilityViewIsModal>
          <View style={styles.grab} />
          <View style={styles.head}>
            <View style={{ flex: 1, gap: 2 }}>
              <T size="title" weight="bold" accessibilityRole="header">{title}</T>
              {typeof subtitle === 'string' ? <T size="small" color={colors.textMuted}>{subtitle}</T> : subtitle}
            </View>
            <IconButton name="close" label={t('common.close')} onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: PAD, gap: 16, paddingBottom: 8 }}
            style={{ flexGrow: 0 }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: PAD, paddingTop: 12, gap: 8 }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Every destructive action goes through this. */
export function ConfirmSheet({ visible, onClose, title, body, confirmLabel, onConfirm, danger, cancelLabel, children, confirmDisabled }: {
  visible: boolean; onClose: () => void; title: string; body?: string; confirmLabel: string; onConfirm: () => void;
  danger?: boolean; cancelLabel?: string; children?: ReactNode; confirmDisabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}
      footer={<>
        <Button label={confirmLabel} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} disabled={confirmDisabled} />
        <Button label={cancelLabel ?? t('common.cancel')} variant="secondary" onPress={onClose} />
      </>}>
      {body ? <T color={colors.textMuted}>{body}</T> : null}
      {children}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, maxHeight: '90%', ...sheetShadow },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 8, marginBottom: 4 },
  head: { flexDirection: 'row', alignItems: 'center', paddingLeft: PAD, paddingRight: 4, paddingBottom: 8 },
});
