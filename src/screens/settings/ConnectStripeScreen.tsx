import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../services/supabase';
import {
  checkAccountStatus,
  getOnboardingLink,
  describeRequirement,
  ConnectAccountStatus,
} from '../../services/stripeService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';
import Header from '../../components/common/Header';

// Three-state screen:
//  • not_connected — show "what you'll need" checklist, then open Stripe.
//  • action_required — list outstanding requirements + a direct "Continue setup" button.
//  • ready — green confirmation + "Manage in Stripe" (login link to dashboard).
//
// Source of truth is the live Stripe API via checkAccountStatus(); the function
// also keeps profiles.stripe_payouts_enabled / stripe_requirements_currently_due
// in sync, so the global banner + modal stay accurate.

type Stage = 'overview' | 'checklist';

export default function ConnectStripeScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [accountStatus, setAccountStatus] = useState<ConnectAccountStatus | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('overview');

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to continue');
        return;
      }
      setCurrentUserId(user.id);
      const status = await checkAccountStatus(user.id);
      setAccountStatus(status);
    } catch (err) {
      console.error('Error loading account status:', err);
      Alert.alert('Something went wrong', 'Couldn\'t load your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);
  useFocusEffect(useCallback(() => { loadStatus(); }, [loadStatus]));

  const openStripe = useCallback(async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'User information not available');
      return;
    }
    try {
      setOpening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const link = await getOnboardingLink(currentUserId);
      if (!link?.url) {
        Alert.alert('Hmm', 'Couldn\'t open Stripe right now. Please try again in a moment.');
        return;
      }

      // Do NOT gate on Linking.canOpenURL(): it returns false for https:// URLs
      // on iOS in many cases even when the link opens fine, which silently
      // blocked Stripe onboarding. openURL() handles https on its own.
      await Linking.openURL(link.url);
      // Drop them back to overview so when they return, refresh shows the new state.
      setStage('overview');
      setTimeout(loadStatus, 2500);
    } catch (err: any) {
      console.error('Error opening Stripe:', err);
      Alert.alert('Something went wrong', 'Couldn\'t open Stripe. Please try again.');
    } finally {
      setOpening(false);
    }
  }, [currentUserId, loadStatus]);

  const handleStartSetup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStage('checklist');
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadStatus();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Receive payments" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      </View>
    );
  }

  const connected = !!accountStatus?.connected;
  const payoutsEnabled = !!accountStatus?.payoutsEnabled;
  const chargesEnabled = !!accountStatus?.chargesEnabled;
  const currentlyDue = accountStatus?.requirements?.currently_due ?? [];
  const stripeErrors = accountStatus?.requirements?.errors ?? [];
  const isReady = connected && chargesEnabled && payoutsEnabled && currentlyDue.length === 0;
  const isActionRequired = connected && (!payoutsEnabled || currentlyDue.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Receive payments" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* CHECKLIST STAGE — only shown to brand-new users before we open Stripe. */}
        {stage === 'checklist' && !isReady && (
          <Card variant="elevated" style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="document-text-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>What you’ll need</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Stripe will ask for a few things to verify your identity. Have these ready before you start.
            </Text>

            <View style={styles.checklist}>
              <ChecklistItem
                colors={colors}
                icon="card-outline"
                title="Government ID"
                subtitle="A clear photo of your passport or Australian driver’s licence."
              />
              <ChecklistItem
                colors={colors}
                icon="business-outline"
                title="Bank account details"
                subtitle="Your BSB and account number for payouts."
              />
              <ChecklistItem
                colors={colors}
                icon="person-outline"
                title="Your legal details — exactly as on your ID"
                subtitle="Stripe automatically checks the name and date of birth you enter. If they don’t match your ID, payouts get held."
                emphasis
              />
            </View>

            <View style={styles.checklistButtonRow}>
              <Button
                variant="outline"
                size="medium"
                onPress={() => setStage('overview')}
                style={styles.secondaryButton}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="medium"
                onPress={openStripe}
                disabled={opening}
                style={styles.primaryButton}
              >
                {opening ? 'Opening…' : 'I’m ready, continue'}
              </Button>
            </View>
          </Card>
        )}

        {/* READY STATE */}
        {stage === 'overview' && isReady && (
          <Card variant="elevated" style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>You’re all set</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Your bank account is connected and payouts are enabled. You can receive money instantly through ZapSplit.
            </Text>

            <View style={[styles.accountInfo, { backgroundColor: colors.background }]}>
              <Row label="Status" valueComponent={
                <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              } colors={colors} />
              <Row label="Charges" value="Enabled" colors={colors} />
              <Row label="Payouts" value="Enabled" colors={colors} />
            </View>

            <View style={styles.checklistButtonRow}>
              <Button variant="outline" size="medium" onPress={handleRefresh} style={styles.secondaryButton}>
                Refresh
              </Button>
              <Button
                variant="primary"
                size="medium"
                onPress={openStripe}
                disabled={opening}
                style={styles.primaryButton}
              >
                {opening ? 'Opening…' : 'Manage in Stripe'}
              </Button>
            </View>
          </Card>
        )}

        {/* ACTION REQUIRED STATE */}
        {stage === 'overview' && !isReady && isActionRequired && (
          <Card variant="elevated" style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: (colors.warning ?? '#F59E0B') + '22' }]}>
              <Ionicons name="alert-circle" size={40} color={colors.warning ?? '#F59E0B'} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Action required</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              {currentlyDue.some((r) => r.startsWith('individual.verification.document'))
                ? 'Stripe needs a photo of your ID before it can release your payments. This usually takes under a minute.'
                : 'Stripe needs a few more details before payouts can be enabled.'}
            </Text>

            {currentlyDue.length > 0 && (
              <View style={[styles.requirementsList, { backgroundColor: colors.background }]}>
                {currentlyDue.map((req) => (
                  <View key={req} style={styles.requirementRow}>
                    <Ionicons name="arrow-forward-circle" size={18} color={colors.warning ?? '#F59E0B'} />
                    <Text style={[styles.requirementText, { color: colors.text }]}>
                      {describeRequirement(req)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {stripeErrors.length > 0 && (
              <View style={[styles.errorsBox, { backgroundColor: (colors.error ?? '#EF4444') + '10', borderColor: colors.error ?? '#EF4444' }]}>
                {stripeErrors.map((e, i) => (
                  <Text key={i} style={[styles.errorText, { color: colors.text }]}>
                    {e.reason}
                  </Text>
                ))}
              </View>
            )}

            <Button
              variant="primary"
              size="large"
              onPress={openStripe}
              disabled={opening}
              style={styles.continueButton}
            >
              {opening ? 'Opening…' : 'Continue setup'}
            </Button>

            <TouchableOpacity onPress={handleRefresh} style={styles.refreshLinkWrap}>
              <Text style={[styles.refreshLink, { color: colors.primary }]}>I’ve done it — refresh status</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* NOT CONNECTED STATE */}
        {stage === 'overview' && !connected && (
          <Card variant="elevated" style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="wallet-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Set up payouts</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Connect your bank account through Stripe to receive money from splits.
            </Text>

            <View style={styles.benefits}>
              <Benefit text="Secure bank-level encryption" colors={colors} />
              <Benefit text="Instant payouts to your bank" colors={colors} />
              <Benefit text="No monthly fees" colors={colors} />
            </View>

            <Button
              variant="primary"
              size="large"
              onPress={handleStartSetup}
              style={styles.connectButton}
            >
              Set up payouts
            </Button>
            <View style={styles.stripeFooter}>
              <Ionicons name="lock-closed" size={13} color={colors.textSecondary} />
              <Text style={[styles.poweredBy, { color: colors.textSecondary }]}>Powered by</Text>
              <Text style={styles.stripeLogo}>Stripe</Text>
            </View>
          </Card>
        )}

        {/* INFO SECTION */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>How it works</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            1. Connect your bank account through Stripe’s secure onboarding
          </Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            2. Upload a photo of your ID so Stripe can verify your identity
          </Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            3. Receive instant payouts when friends pay you
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Subcomponents (kept inline to avoid a folder of one-off pieces)
// ────────────────────────────────────────────────────────────

function ChecklistItem({
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

function Benefit({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      <Text style={[styles.benefitText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

function Row({
  label, value, valueComponent, colors,
}: {
  label: string; value?: string; valueComponent?: React.ReactNode; colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      {valueComponent || <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>}
    </View>
  );
}

// ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: 16 },

  card: { marginBottom: 20, padding: spacing.lg, alignItems: 'center' },

  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: spacing.sm + 4, textAlign: 'center' },
  cardDescription: { fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },

  benefits: { width: '100%', marginBottom: spacing.lg },
  benefitRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.sm + 2, gap: spacing.sm + 2,
  },
  benefitText: { fontSize: 15, flex: 1 },

  checklist: { width: '100%', gap: spacing.md, marginBottom: spacing.lg },
  checklistRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checklistIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  checklistBody: { flex: 1 },
  checklistTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  checklistSubtitle: { fontSize: 13, lineHeight: 18 },

  checklistButtonRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  secondaryButton: { flex: 1 },
  primaryButton: { flex: 1.5 },

  connectButton: { width: '100%', marginBottom: spacing.md },
  continueButton: { width: '100%' },
  refreshLinkWrap: { marginTop: spacing.md, paddingVertical: spacing.sm },
  refreshLink: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

  stripeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  poweredBy: { fontSize: 13 },
  stripeLogo: { fontSize: 16, fontWeight: '700', color: '#635BFF' },

  accountInfo: { width: '100%', borderRadius: radius.md, padding: spacing.md, marginVertical: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm + 4 },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 15, fontWeight: '600' },
  statusBadge: { paddingHorizontal: spacing.sm + 4, paddingVertical: 4, borderRadius: radius.md },
  statusText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  requirementsList: {
    width: '100%', borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md, gap: spacing.sm,
  },
  requirementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  requirementText: { fontSize: 14, flex: 1, lineHeight: 20 },

  errorsBox: {
    width: '100%', borderWidth: 1, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md, gap: 4,
  },
  errorText: { fontSize: 13, lineHeight: 18 },

  infoSection: { borderRadius: radius.md, padding: 20, marginBottom: 40 },
  infoTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.md },
  infoText: { fontSize: 15, lineHeight: 22, marginBottom: spacing.sm + 4 },
});
