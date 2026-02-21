import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../services/supabase';
import { createConnectAccount, checkAccountStatus, ConnectAccountStatus } from '../../services/stripeService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

export default function ConnectStripeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [accountStatus, setAccountStatus] = useState<ConnectAccountStatus | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    loadAccountStatus();
  }, []);

  const loadAccountStatus = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to continue');
        return;
      }

      setCurrentUserId(user.id);
      setUserEmail(user.email || '');

      // Check Stripe account status
      const status = await checkAccountStatus(user.id);
      setAccountStatus(status);
    } catch (error) {
      console.error('Error loading account status:', error);
      Alert.alert('Error', 'Failed to load account status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async () => {
    if (!currentUserId || !userEmail) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    try {
      setConnecting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Create Connect account and get onboarding URL
      const result = await createConnectAccount(
        currentUserId,
        userEmail
        // Using default HTTPS URLs from Edge Function
      );

      if (!result) {
        throw new Error('Failed to create Connect account');
      }

      // Open Stripe onboarding in browser
      const canOpen = await Linking.canOpenURL(result.onboardingUrl);
      if (canOpen) {
        await Linking.openURL(result.onboardingUrl);

        // Show instructions
        Alert.alert(
          'Complete Setup',
          'Please complete the Stripe onboarding in your browser. Return to the app when done.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh status after user returns
                setTimeout(() => {
                  loadAccountStatus();
                }, 2000);
              },
            },
          ]
        );
      } else {
        throw new Error('Cannot open Stripe onboarding URL');
      }
    } catch (error: any) {
      console.error('Error connecting account:', error);
      Alert.alert('Connection Failed', error.message || 'Failed to connect bank account. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleRefreshStatus = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAccountStatus();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.gray50, paddingTop: insets.top }]}>
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.gray900 }]}>Receive Payments</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.gray600 }]}>Loading account status...</Text>
        </View>
      </View>
    );
  }

  const isConnected = accountStatus?.connected && accountStatus?.chargesEnabled;

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50, paddingTop: insets.top }]}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.gray900 }]}>Receive Payments</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: colors.gray600 }]}>
            Connect your bank account to receive payments from splits
          </Text>
        </View>

      {/* Status Card */}
      <Card variant="elevated" style={styles.card}>
        {!isConnected ? (
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="wallet-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.gray900 }]}>Connect Your Bank Account</Text>
            <Text style={[styles.cardDescription, { color: colors.gray600 }]}>
              To receive payments through ZapSplit, you'll need to connect your bank account via Stripe.
            </Text>
            <View style={styles.benefits}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.benefitText, { color: colors.gray700 }]}>Secure bank-level encryption</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.benefitText, { color: colors.gray700 }]}>Instant payouts to your bank</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.benefitText, { color: colors.gray700 }]}>No monthly fees</Text>
              </View>
            </View>
            <Button
              variant="primary"
              size="large"
              onPress={handleConnectAccount}
              disabled={connecting}
              style={styles.connectButton}
            >
              {connecting ? 'Connecting...' : 'Connect Bank Account'}
            </Button>
            <View style={styles.stripeFooter}>
              <Ionicons name="lock-closed" size={13} color={colors.gray500} />
              <Text style={[styles.poweredBy, { color: colors.gray500 }]}>Powered by</Text>
              <Text style={styles.stripeLogo}>Stripe</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.gray900 }]}>Bank Account Connected</Text>
            <Text style={[styles.cardDescription, { color: colors.gray600 }]}>
              You're all set to receive payments through ZapSplit!
            </Text>

            {/* Account Info */}
            <View style={[styles.accountInfo, { backgroundColor: colors.gray50 }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.gray600 }]}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
              {accountStatus?.chargesEnabled && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.gray600 }]}>Charges</Text>
                  <Text style={[styles.infoValue, { color: colors.gray900 }]}>Enabled</Text>
                </View>
              )}
              {accountStatus?.payoutsEnabled && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.gray600 }]}>Payouts</Text>
                  <Text style={[styles.infoValue, { color: colors.gray900 }]}>Enabled</Text>
                </View>
              )}
            </View>

            <Button
              variant="outline"
              size="medium"
              onPress={handleRefreshStatus}
              style={styles.refreshButton}
            >
              Refresh Status
            </Button>
          </View>
        )}
      </Card>

      {/* Requirements — only show when NOT fully connected */}
      {!isConnected && accountStatus?.requirements && accountStatus.requirements.currently_due.length > 0 && (
        <Card variant="default" style={[styles.requirementsCard, { backgroundColor: colors.warningLight }]}>
          <View style={styles.requirementsTitleRow}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={[styles.requirementsTitle, { color: colors.gray900 }]}>Finish Your Setup</Text>
          </View>
          <Text style={[styles.requirementsDescription, { color: colors.gray700 }]}>
            Stripe needs a few more details to verify your identity and enable payouts. Tap below to continue where you left off.
          </Text>
          <Button
            variant="primary"
            size="small"
            onPress={handleConnectAccount}
            style={styles.completeButton}
          >
            Continue Setup
          </Button>
        </Card>
      )}

      {/* Info Section */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoTitle, { color: colors.gray900 }]}>How it works</Text>
        <Text style={[styles.infoText, { color: colors.gray700 }]}>
          1. Connect your bank account through Stripe's secure onboarding
        </Text>
        <Text style={[styles.infoText, { color: colors.gray700 }]}>
          2. Stripe verifies your information (usually instant)
        </Text>
        <Text style={[styles.infoText, { color: colors.gray700 }]}>
          3. Start receiving payments from your splits
        </Text>
        <Text style={[styles.infoText, { color: colors.gray700 }]}>
          4. Funds are automatically deposited to your bank account
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  header: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    marginBottom: 20,
  },
  cardContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
    gap: spacing.sm + 2,
  },
  benefitText: {
    fontSize: 15,
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm + 4,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  benefits: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  requirementsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  connectButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  stripeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  poweredBy: {
    fontSize: 13,
  },
  stripeLogo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#635BFF',
  },
  accountInfo: {
    width: '100%',
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    width: '100%',
  },
  requirementsCard: {
    padding: 20,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  requirementsDescription: {
    fontSize: 14,
    marginBottom: spacing.sm + 4,
  },
  completeButton: {
    marginTop: spacing.sm + 4,
  },
  infoSection: {
    borderRadius: radius.md,
    padding: 20,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm + 4,
  },
});
