import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../services/supabase';
import { createConnectAccount, checkAccountStatus, ConnectAccountStatus } from '../../services/stripeService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { colors } from '../../constants/theme';

export default function ConnectStripeScreen() {
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
        userEmail,
        'zapsplit://connect-stripe?refresh=true',
        'zapsplit://connect-stripe?success=true'
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading account status...</Text>
        </View>
      </View>
    );
  }

  const isConnected = accountStatus?.connected && accountStatus?.chargesEnabled;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Receive Payments</Text>
        <Text style={styles.subtitle}>
          Connect your bank account to receive payments from splits
        </Text>
      </View>

      {/* Status Card */}
      <Card variant="elevated" style={styles.card}>
        {!isConnected ? (
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>💳</Text>
            </View>
            <Text style={styles.cardTitle}>Connect Your Bank Account</Text>
            <Text style={styles.cardDescription}>
              To receive payments through ZapSplit, you'll need to connect your bank account via Stripe.
            </Text>
            <View style={styles.benefits}>
              <Text style={styles.benefitItem}>✓ Secure bank-level encryption</Text>
              <Text style={styles.benefitItem}>✓ Fast payouts (1-3 business days)</Text>
              <Text style={styles.benefitItem}>✓ No monthly fees</Text>
            </View>
            <Button
              title={connecting ? 'Connecting...' : 'Connect Bank Account'}
              variant="primary"
              size="large"
              onPress={handleConnectAccount}
              disabled={connecting}
              style={styles.connectButton}
            />
            <View style={styles.stripeFooter}>
              <Text style={styles.poweredBy}>Powered by</Text>
              <Text style={styles.stripeLogo}>Stripe</Text>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>✅</Text>
            </View>
            <Text style={styles.cardTitle}>Bank Account Connected</Text>
            <Text style={styles.cardDescription}>
              You're all set to receive payments through ZapSplit!
            </Text>

            {/* Account Info */}
            <View style={styles.accountInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
              {accountStatus?.chargesEnabled && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Charges</Text>
                  <Text style={styles.infoValue}>Enabled ✓</Text>
                </View>
              )}
              {accountStatus?.payoutsEnabled && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payouts</Text>
                  <Text style={styles.infoValue}>Enabled ✓</Text>
                </View>
              )}
            </View>

            <Button
              title="Refresh Status"
              variant="outline"
              size="medium"
              onPress={handleRefreshStatus}
              style={styles.refreshButton}
            />
          </View>
        )}
      </Card>

      {/* Requirements (if any) */}
      {accountStatus?.requirements && accountStatus.requirements.currently_due.length > 0 && (
        <Card variant="default" style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>⚠️ Action Required</Text>
          <Text style={styles.requirementsDescription}>
            Please complete the following to activate your account:
          </Text>
          {accountStatus.requirements.currently_due.map((req, index) => (
            <Text key={index} style={styles.requirementItem}>
              • {req.replace(/_/g, ' ')}
            </Text>
          ))}
          <Button
            title="Complete Setup"
            variant="primary"
            size="small"
            onPress={handleConnectAccount}
            style={styles.completeButton}
          />
        </Card>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>
          1. Connect your bank account through Stripe's secure onboarding
        </Text>
        <Text style={styles.infoText}>
          2. Stripe verifies your information (instant or 1-2 business days)
        </Text>
        <Text style={styles.infoText}>
          3. Start receiving payments from your splits
        </Text>
        <Text style={styles.infoText}>
          4. Funds are automatically deposited to your bank account
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
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
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    lineHeight: 22,
  },
  card: {
    marginBottom: 20,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  benefits: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    fontSize: 15,
    color: colors.gray[700],
    marginBottom: 8,
    paddingLeft: 8,
  },
  connectButton: {
    width: '100%',
    marginBottom: 16,
  },
  stripeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  poweredBy: {
    fontSize: 13,
    color: colors.gray[500],
  },
  stripeLogo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#635BFF',
  },
  lockIcon: {
    fontSize: 14,
  },
  accountInfo: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.gray[600],
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
    backgroundColor: colors.warning + '15',
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  requirementsDescription: {
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: 12,
  },
  requirementItem: {
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: 6,
  },
  completeButton: {
    marginTop: 12,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
  },
  infoText: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
    marginBottom: 12,
  },
});
