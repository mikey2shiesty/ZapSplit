import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { getOnboardingLink, describeRequirement } from '../../services/stripeService';
import { useStripeAccountStatus } from '../../hooks/useStripeAccountStatus';

interface Props {
  visible: boolean;
  onClose: () => void;
  // Optional override copy for the title — e.g. "Verify your ID to receive payments"
  // vs. "Verify your ID to send a request".
  title?: string;
  message?: string;
}

export default function VerifyIdRequiredModal({ visible, onClose, title, message }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { currentlyDue, hasAccount, refresh } = useStripeAccountStatus();
  const [opening, setOpening] = useState(false);

  const needsId = currentlyDue.some((r) => r.startsWith('individual.verification.document'));

  const computedTitle =
    title ||
    (!hasAccount
      ? 'Set up payouts first'
      : needsId
        ? 'Verify your ID first'
        : 'Action required on your Stripe account');

  const computedMessage =
    message ||
    (!hasAccount
      ? 'Connect your bank account so you can receive money. It takes about 60 seconds.'
      : needsId
        ? 'Stripe needs a photo of your government ID before it can release your payouts. We’ll open the upload screen now — it’s under a minute.'
        : 'Stripe needs a couple more details before it can pay you out. We’ll open the right screen for you.');

  const handleVerify = async () => {
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpening(true);
    try {
      const link = await getOnboardingLink(user.id);
      if (!link?.url) {
        Alert.alert('Hmm', 'Couldn’t open Stripe right now. Please try again in a moment.');
        return;
      }
      const can = await Linking.canOpenURL(link.url);
      if (can) {
        await Linking.openURL(link.url);
        setTimeout(() => refresh(), 3000);
        onClose();
      } else {
        Alert.alert('Hmm', 'Couldn’t open Stripe in your browser.');
      }
    } finally {
      setOpening(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface ?? '#FFFFFF' }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: (colors.warning ?? '#F59E0B') + '22' }]}>
            <Ionicons name="alert-circle" size={32} color={colors.warning ?? '#F59E0B'} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{computedTitle}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{computedMessage}</Text>

          {currentlyDue.length > 0 && (
            <View style={styles.bulletList}>
              {currentlyDue.slice(0, 4).map((req) => (
                <View key={req} style={styles.bullet}>
                  <Ionicons name="ellipse" size={6} color={colors.text} style={{ marginTop: 7 }} />
                  <Text style={[styles.bulletText, { color: colors.text }]}>{describeRequirement(req)}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.primary, { backgroundColor: colors.primary }]}
            onPress={handleVerify}
            disabled={opening}
            activeOpacity={0.85}
          >
            {opening ? (
              <ActivityIndicator color={colors.textInverse ?? '#FFFFFF'} />
            ) : (
              <Text style={[styles.primaryLabel, { color: colors.textInverse ?? '#FFFFFF' }]}>
                {needsId ? 'Upload ID now' : !hasAccount ? 'Set up now' : 'Continue setup'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancel} activeOpacity={0.7}>
            <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>Not now</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  bulletList: {
    width: '100%',
    marginBottom: spacing.md,
    gap: 6,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  primary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancel: {
    paddingVertical: spacing.sm,
  },
  cancelLabel: {
    fontSize: 14,
  },
});
