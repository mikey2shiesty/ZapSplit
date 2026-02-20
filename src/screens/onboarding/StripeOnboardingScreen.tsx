import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../services/supabase';
import { createConnectAccount } from '../../services/stripeService';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

interface StripeOnboardingScreenProps {
  onComplete: () => void;
}

export default function StripeOnboardingScreen({ onComplete }: StripeOnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [connecting, setConnecting] = useState(false);

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ stripe_onboarding_dismissed: true })
          .eq('id', user.id);
      }
    } catch (error) {
      // Non-blocking — still dismiss even if DB update fails
      console.error('Failed to save onboarding dismissal:', error);
    }
    onComplete();
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to continue');
        return;
      }

      const result = await createConnectAccount(user.id, user.email || '');
      if (!result) {
        throw new Error('Failed to create Connect account');
      }

      const canOpen = await Linking.canOpenURL(result.onboardingUrl);
      if (canOpen) {
        await Linking.openURL(result.onboardingUrl);
        Alert.alert(
          'Complete Setup',
          'Please complete the Stripe onboarding in your browser. Return to the app when done.',
          [{ text: 'OK', onPress: onComplete }]
        );
      } else {
        throw new Error('Cannot open Stripe onboarding URL');
      }
    } catch (error: any) {
      console.error('Error connecting account:', error);
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect bank account. Please try again.'
      );
    } finally {
      setConnecting(false);
    }
  };

  const benefits = [
    { icon: 'shield-checkmark-outline' as const, text: 'Secure bank-level encryption' },
    { icon: 'flash-outline' as const, text: 'Instant payouts to your Australian bank' },
    { icon: 'wallet-outline' as const, text: 'No monthly fees — only pay when you get paid' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50, paddingTop: insets.top }]}>
      {/* Skip link (top-right) */}
      <View style={styles.topBar}>
        <View style={styles.placeholder} />
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.gray500 }]}>Set up later</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="wallet-outline" size={48} color={colors.primary} />
        </View>

        {/* Title & Subtitle */}
        <Text style={[styles.title, { color: colors.gray900 }]}>
          Connect Your Bank Account
        </Text>
        <Text style={[styles.subtitle, { color: colors.gray600 }]}>
          To receive money when friends pay their share, connect your bank account via Stripe.
        </Text>

        {/* Benefits */}
        <View style={styles.benefits}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View style={[styles.checkCircle, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
              </View>
              <Text style={[styles.benefitText, { color: colors.gray700 }]}>
                {benefit.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom actions */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: colors.primary }]}
          onPress={handleConnect}
          disabled={connecting}
          activeOpacity={0.8}
        >
          {connecting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.connectButtonText}>Connect Bank Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.laterButton}>
          <Text style={[styles.laterText, { color: colors.gray500 }]}>
            Set up later in Settings
          </Text>
        </TouchableOpacity>

        {/* Powered by Stripe */}
        <View style={styles.stripeFooter}>
          <Ionicons name="lock-closed" size={13} color={colors.gray400} />
          <Text style={[styles.poweredBy, { color: colors.gray400 }]}>Powered by</Text>
          <Text style={styles.stripeLogo}>Stripe</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  placeholder: {
    width: 80,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm + 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  benefits: {
    width: '100%',
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 4,
  },
  benefitText: {
    fontSize: 15,
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  connectButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  laterText: {
    fontSize: 15,
  },
  stripeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: spacing.sm,
  },
  poweredBy: {
    fontSize: 13,
  },
  stripeLogo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#635BFF',
  },
});
