import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../services/supabase';
import { getOnboardingLink } from '../../services/stripeService';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

// Post-signup gate. Sole purpose: prepare the user for what Stripe will ask,
// THEN open Stripe. The pre-flight checklist exists specifically to prevent
// the "I typed my Apple Sign In name instead of my legal name" failure that
// puts accounts in keyed-identity-failed limbo.

interface StripeOnboardingScreenProps {
  onComplete: () => void;
}

export default function StripeOnboardingScreen({ onComplete }: StripeOnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [opening, setOpening] = useState(false);

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ stripe_onboarding_dismissed: true })
          .eq('id', user.id);
      }
    } catch (error) {
      // Non-blocking — still dismiss locally even if the DB update fails.
      console.error('Failed to save onboarding dismissal:', error);
    }
    onComplete();
  };

  const handleConnect = async () => {
    try {
      setOpening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to continue');
        return;
      }

      const link = await getOnboardingLink(user.id);
      if (!link?.url) {
        throw new Error('Could not generate Stripe onboarding link');
      }

      // Do NOT gate on Linking.canOpenURL(): it returns false for https:// URLs
      // on iOS in many cases even when the link opens fine, which silently
      // blocked Stripe onboarding. openURL() handles https on its own.
      await Linking.openURL(link.url);
      // Hide the gate immediately. When Stripe redirects back via
      // `zapsplit://stripe-return`, the user lands in MainNavigator and the
      // banner / status hook picks up the new state on focus.
      onComplete();
    } catch (error: any) {
      console.error('Error connecting account:', error);
      Alert.alert(
        'Connection failed',
        error.message || 'Failed to open Stripe. Please try again.'
      );
    } finally {
      setOpening(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Skip link (top-right) */}
      <View style={styles.topBar}>
        <View style={styles.placeholder} />
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Set up later</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="wallet-outline" size={42} color={colors.primary} />
        </View>

        {/* Title + intro */}
        <Text style={[styles.title, { color: colors.text }]}>
          Set up payouts
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          To receive money when friends pay their share, you’ll connect your bank through Stripe. Here’s what you’ll need before we start.
        </Text>

        {/* Checklist — this is the bit that prevents the keyed-identity failure. */}
        <View style={styles.checklist}>
          <ChecklistRow
            icon="card-outline"
            title="Government ID"
            subtitle="A clear photo of your passport or Australian driver’s licence."
            colors={colors}
          />
          <ChecklistRow
            icon="business-outline"
            title="Bank account details"
            subtitle="Your BSB and account number for payouts."
            colors={colors}
          />
          <ChecklistRow
            icon="person-outline"
            title="Your legal details — exactly as on your ID"
            subtitle="Stripe automatically checks the name and date of birth you enter. If they don’t match your ID, payouts get held."
            emphasis
            colors={colors}
          />
        </View>

        {/* Footer reassurance */}
        <View style={styles.benefits}>
          <BenefitRow text="Secure bank-level encryption" colors={colors} />
          <BenefitRow text="Instant payouts to your Australian bank" colors={colors} />
          <BenefitRow text="No monthly fees — only pay when you get paid" colors={colors} />
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: colors.primary }]}
          onPress={handleConnect}
          disabled={opening}
          activeOpacity={0.85}
        >
          {opening ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.connectButtonText}>I’m ready, continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.laterButton}>
          <Text style={[styles.laterText, { color: colors.textSecondary }]}>
            Set up later in Settings
          </Text>
        </TouchableOpacity>

        <View style={styles.stripeFooter}>
          <Ionicons name="lock-closed" size={13} color={colors.textTertiary} />
          <Text style={[styles.poweredBy, { color: colors.textTertiary }]}>Powered by</Text>
          <Text style={styles.stripeLogo}>Stripe</Text>
        </View>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────

function ChecklistRow({
  icon, title, subtitle, emphasis, colors,
}: {
  icon: any; title: string; subtitle: string; emphasis?: boolean; colors: any;
}) {
  return (
    <View style={styles.checklistRow}>
      <View style={[
        styles.checklistIcon,
        { backgroundColor: emphasis ? (colors.warning ?? '#F59E0B') + '22' : colors.primary + '15' },
      ]}>
        <Ionicons name={icon} size={20} color={emphasis ? (colors.warning ?? '#F59E0B') : colors.primary} />
      </View>
      <View style={styles.checklistBody}>
        <Text style={[styles.checklistTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.checklistSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function BenefitRow({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.benefitRow}>
      <View style={[styles.checkCircle, { backgroundColor: colors.success + '20' }]}>
        <Ionicons name="checkmark" size={14} color={colors.success} />
      </View>
      <Text style={[styles.benefitText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  placeholder: { width: 80 },
  skipButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  skipText: { fontSize: 15, fontWeight: '500' },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24, fontWeight: '700',
    textAlign: 'center', marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15, textAlign: 'center', lineHeight: 22,
    paddingHorizontal: spacing.sm, marginBottom: spacing.xl,
  },

  checklist: { width: '100%', gap: spacing.md, marginBottom: spacing.xl },
  checklistRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checklistIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  checklistBody: { flex: 1 },
  checklistTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  checklistSubtitle: { fontSize: 13, lineHeight: 18 },

  benefits: { width: '100%', gap: spacing.sm + 4 },
  benefitRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm + 2,
  },
  benefitText: { fontSize: 14, flex: 1 },

  bottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  connectButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 52,
  },
  connectButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  laterButton: { alignItems: 'center', paddingVertical: spacing.xs },
  laterText: { fontSize: 15 },

  stripeFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingTop: spacing.sm,
  },
  poweredBy: { fontSize: 13 },
  stripeLogo: { fontSize: 15, fontWeight: '700', color: '#635BFF' },
});
