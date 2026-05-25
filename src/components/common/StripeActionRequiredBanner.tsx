import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useStripeAccountStatus } from '../../hooks/useStripeAccountStatus';
import { getOnboardingLink } from '../../services/stripeService';

interface Props {
  // Banner is hidden by default for users with no Stripe account yet — they don't
  // need to be nagged about KYC before they've even signed up to receive money.
  // Set to true on a screen where we want to also prompt unconnected users
  // (e.g. immediately after they try to receive a payment).
  promptIfNoAccount?: boolean;
}

export default function StripeActionRequiredBanner({ promptIfNoAccount = false }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { loading, hasAccount, payoutsEnabled, currentlyDue, refresh } = useStripeAccountStatus();
  const [opening, setOpening] = useState(false);

  if (loading) return null;
  if (!user?.id) return null;

  // Fully verified — nothing to show.
  if (hasAccount && payoutsEnabled && currentlyDue.length === 0) return null;

  // No account at all — only show if explicitly asked to nag.
  if (!hasAccount && !promptIfNoAccount) return null;

  const needsId = currentlyDue.some((r) => r.startsWith('individual.verification.document'));
  const title = !hasAccount
    ? 'Set up payouts'
    : needsId
      ? 'Verify your ID to release your payments'
      : 'Action required on your Stripe account';
  const body = !hasAccount
    ? 'Connect your bank to receive money from splits.'
    : needsId
      ? 'Stripe needs a photo of your ID before it can pay you out.'
      : 'Finish setting up your account so payments can reach your bank.';

  const handleTap = async () => {
    if (opening) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        // Give Stripe ~3s before we re-check, then refresh.
        setTimeout(() => refresh(), 3000);
      } else {
        Alert.alert('Hmm', 'Couldn’t open Stripe in your browser.');
      }
    } finally {
      setOpening(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleTap}
      activeOpacity={0.85}
      style={[
        styles.container,
        {
          backgroundColor: colors.warningLight ?? '#FEF3C7',
          borderColor: colors.warning ?? '#F59E0B',
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: (colors.warning ?? '#F59E0B') + '22' }]}>
        <Ionicons name="alert-circle" size={22} color={colors.warning ?? '#F59E0B'} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]} numberOfLines={2}>
          {body}
        </Text>
      </View>
      {opening ? (
        <ActivityIndicator size="small" color={colors.warning ?? '#F59E0B'} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.85,
  },
});
