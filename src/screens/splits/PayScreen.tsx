import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../services/supabase';
import { useStripe } from '@stripe/stripe-react-native';
import { createPayment, calculateFees, checkAccountStatus } from '../../services/stripeService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';
import { SplitFlowParamList } from '../../types/navigation';

type PayScreenProps = StackScreenProps<SplitFlowParamList, 'PayScreen'>;

export default function PayScreen({ navigation, route }: PayScreenProps) {
  const { splitId, participantId, recipientId, amount } = route.params;
  const { colors } = useTheme();

  // Get Stripe functions from hook
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [recipient, setRecipient] = useState<any>(null);
  const [split, setSplit] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [recipientReady, setRecipientReady] = useState(false);
  const [participantCount, setParticipantCount] = useState(2);

  const fees = calculateFees(amount, participantCount);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to continue');
        navigation.goBack();
        return;
      }
      setCurrentUserId(user.id);

      // Get recipient profile
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', recipientId)
        .single();

      if (recipientError || !recipientData) {
        Alert.alert('Error', 'Recipient not found');
        navigation.goBack();
        return;
      }
      setRecipient(recipientData);

      // Check if recipient has Stripe account set up
      const accountStatus = await checkAccountStatus(recipientId);
      if (!accountStatus?.connected || !accountStatus?.chargesEnabled) {
        Alert.alert(
          'Cannot Process Payment',
          `${recipientData.full_name} hasn't set up their bank account yet. They need to connect their account to receive payments.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      setRecipientReady(true);

      // Get split details
      const { data: splitData, error: splitError } = await supabase
        .from('splits')
        .select('*')
        .eq('id', splitId)
        .single();

      if (splitError || !splitData) {
        Alert.alert('Error', 'Split not found');
        navigation.goBack();
        return;
      }
      setSplit(splitData);

      // Get participant count for fair fee splitting
      const { count } = await supabase
        .from('split_participants')
        .select('*', { count: 'exact', head: true })
        .eq('split_id', splitId);
      if (count && count > 0) {
        setParticipantCount(count);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      Alert.alert('Error', 'Failed to load payment information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!currentUserId || !recipientReady) {
      Alert.alert('Error', 'Payment cannot be processed at this time');
      return;
    }

    try {
      setPaying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Create payment and present Stripe payment sheet
      const result = await createPayment(
        currentUserId,
        recipientId,
        amount,
        splitId,
        initPaymentSheet,
        presentPaymentSheet,
        participantCount
      );

      if (result.success) {
        // Payment successful!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Alert.alert(
          'Payment Successful!',
          `You paid ${recipient.full_name} $${fees.total.toFixed(2)}`,
          [
            {
              text: 'Done',
              onPress: () => {
                // Navigate back to split detail
                navigation.navigate('SplitDetail', { splitId });
              },
            },
          ]
        );
      } else {
        // Payment failed
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        const errorMessage = result.error || 'Payment failed. Please try again.';
        Alert.alert('Payment Failed', errorMessage);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Payment Failed', error.message || 'An error occurred while processing your payment');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.gray600 }]}>Loading payment details...</Text>
        </View>
      </View>
    );
  }

  if (!recipientReady) {
    return null; // Alert already shown
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.gray50 }]} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.gray900 }]}>Pay with Card</Text>
          <Text style={[styles.subtitle, { color: colors.gray600 }]}>Secure payment powered by Stripe</Text>
        </View>

        {/* Recipient Card */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.recipientSection}>
            <Text style={[styles.sectionLabel, { color: colors.gray500 }]}>Paying</Text>
            <View style={styles.recipientInfo}>
              <Avatar
                name={recipient.full_name}
                uri={recipient.avatar_url}
                size="lg"
              />
              <View style={styles.recipientDetails}>
                <Text style={[styles.recipientName, { color: colors.gray900 }]}>{recipient.full_name}</Text>
                <Text style={[styles.recipientEmail, { color: colors.gray600 }]}>{recipient.email}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Split Details Card */}
        {split && (
          <Card variant="default" style={styles.card}>
            <View style={styles.splitSection}>
              <Text style={[styles.sectionLabel, { color: colors.gray500 }]}>For</Text>
              <Text style={[styles.splitTitle, { color: colors.gray900 }]}>{split.title}</Text>
              {split.description && (
                <Text style={[styles.splitDescription, { color: colors.gray600 }]}>{split.description}</Text>
              )}
            </View>
          </Card>
        )}

        {/* Fee Breakdown Card */}
        <Card variant="elevated" style={styles.breakdownCard}>
          <Text style={[styles.breakdownTitle, { color: colors.gray900 }]}>Payment Breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.gray700 }]}>Your share</Text>
            <Text style={[styles.breakdownValue, { color: colors.gray900 }]}>${fees.amount.toFixed(2)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.gray700 }]}>Fees (split {participantCount} ways)</Text>
            <Text style={[styles.breakdownValue, { color: colors.gray900 }]}>+${fees.userFee.toFixed(2)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.gray200 }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.gray900 }]}>Total charge</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${fees.total.toFixed(2)}</Text>
          </View>

          <Text style={[styles.feeNote, { color: colors.gray500 }]}>
            All fees (processing, instant payout, and service fee) are split equally among all {participantCount} participants.
          </Text>
        </Card>

        {/* Payment Method Info */}
        <Card variant="default" style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💳</Text>
            <Text style={[styles.infoText, { color: colors.gray700 }]}>
              Your card information is securely processed by Stripe and never stored on our servers.
            </Text>
          </View>
        </Card>

        {/* Pay Button */}
        <Button
          variant="primary"
          size="large"
          onPress={handlePay}
          disabled={paying}
          style={styles.payButton}
        >
          {paying ? 'Processing...' : `Pay $${fees.total.toFixed(2)}`}
        </Button>

        {/* Cancel Button */}
        <Button
          variant="ghost"
          size="medium"
          onPress={() => navigation.goBack()}
          disabled={paying}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  card: {
    marginBottom: 16,
  },
  recipientSection: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientDetails: {
    marginLeft: 16,
    flex: 1,
  },
  recipientName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  recipientEmail: {
    fontSize: 14,
  },
  splitSection: {
    padding: 20,
  },
  splitTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  splitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  breakdownCard: {
    padding: 20,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 15,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  feeNote: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
  },
  infoCard: {
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  payButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 20,
  },
});
