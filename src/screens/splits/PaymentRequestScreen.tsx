import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius, typography, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { PaymentRequestScreenProps } from '../../types/navigation';
import {
  PaymentMethod,
  sharePaymentDetails,
  copyPaymentDetails,
  formatBSB,
  formatPayID,
  PaymentRequest,
} from '../../services/paymentService';

export default function PaymentRequestScreen({ navigation, route }: PaymentRequestScreenProps) {
  const { amount, description, splitId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // TODO: Get from user profile
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('payid');

  // Mock user payment details (TODO: fetch from profile)
  const mockPaymentDetails = {
    payid: '0412345678',
    payidType: 'phone' as const,
    bsb: '062000',
    accountNumber: '12345678',
    accountName: 'John Smith',
    bankName: 'CommBank' as const,
    paypalUsername: 'johnsmith',
  };

  const paymentRequest: PaymentRequest = {
    recipientName: mockPaymentDetails.accountName,
    amount,
    description,
    splitId,
    paymentDetails: {
      method: selectedMethod,
      ...(selectedMethod === 'payid' && {
        payid: mockPaymentDetails.payid,
        payidType: mockPaymentDetails.payidType,
        accountName: mockPaymentDetails.accountName,
      }),
      ...(selectedMethod === 'bank_transfer' && {
        bsb: mockPaymentDetails.bsb,
        accountNumber: mockPaymentDetails.accountNumber,
        accountName: mockPaymentDetails.accountName,
        bankName: mockPaymentDetails.bankName,
      }),
      ...(selectedMethod === 'paypal' && {
        paypalUsername: mockPaymentDetails.paypalUsername,
      }),
    },
  };

  const handleCopyDetails = async () => {
    try {
      await copyPaymentDetails(paymentRequest);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied!', 'Payment details copied to clipboard');
    } catch (error) {
      console.error('Error copying:', error);
      Alert.alert('Error', 'Failed to copy payment details');
    }
  };

  const handleShare = async () => {
    try {
      await sharePaymentDetails(paymentRequest);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share payment details');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.gray900 }]}>Request Payment</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Share your payment details</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <View style={[styles.amountCard, { backgroundColor: colors.primary }]}>
          <Text style={[styles.amountLabel, { color: colors.surface }]}>Your Total</Text>
          <Text style={[styles.amountValue, { color: colors.surface }]}>${amount.toFixed(2)}</Text>
          <Text style={[styles.amountDescription, { color: colors.surface }]}>{description}</Text>
        </View>

        {/* Quick Pay with Card Option */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Pay Instantly</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Pay now with your credit or debit card</Text>

          <TouchableOpacity
            style={[styles.payNowButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              // TODO: Need recipientId and participantId in route params
              // For now, show coming soon alert
              Alert.alert(
                'Pay with Card',
                'Instant card payments coming soon! You\'ll be able to pay directly via Stripe.',
                [{ text: 'OK' }]
              );
              // Future implementation:
              // navigation.navigate('PayScreen', {
              //   splitId,
              //   participantId: currentUserParticipantId,
              //   recipientId: split.creator_id,
              //   amount,
              // });
            }}
            activeOpacity={0.8}
          >
            <View style={styles.payNowIcon}>
              <Ionicons name="card-outline" size={24} color={colors.surface} />
            </View>
            <Text style={[styles.payNowText, { color: colors.surface }]}>Pay ${amount.toFixed(2)} with Card</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.surface} />
          </TouchableOpacity>

          <Text style={[styles.payNowNote, { color: colors.textSecondary }]}>
            Secure payment via Stripe - Instant confirmation
          </Text>
        </View>

        {/* OR Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Payment Method Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Choose Payment Method</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>How do you want to receive payment?</Text>

          {/* PayID Option */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              { backgroundColor: colors.surface, borderColor: 'transparent' },
              selectedMethod === 'payid' && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
            ]}
            onPress={() => {
              setSelectedMethod('payid');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.methodIcon, { backgroundColor: colors.gray100 }]}>
              <Ionicons
                name="phone-portrait-outline"
                size={24}
                color={selectedMethod === 'payid' ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={styles.methodContent}>
              <Text style={[
                styles.methodTitle,
                { color: colors.gray900 },
                selectedMethod === 'payid' && { color: colors.primary },
              ]}>
                PayID
              </Text>
              <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>
                {formatPayID(mockPaymentDetails.payid, 'phone')}
              </Text>
            </View>
            {selectedMethod === 'payid' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>

          {/* Bank Transfer Option */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              { backgroundColor: colors.surface, borderColor: 'transparent' },
              selectedMethod === 'bank_transfer' && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
            ]}
            onPress={() => {
              setSelectedMethod('bank_transfer');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.methodIcon, { backgroundColor: colors.gray100 }]}>
              <Ionicons
                name="business-outline"
                size={24}
                color={selectedMethod === 'bank_transfer' ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={styles.methodContent}>
              <Text style={[
                styles.methodTitle,
                { color: colors.gray900 },
                selectedMethod === 'bank_transfer' && { color: colors.primary },
              ]}>
                Bank Transfer
              </Text>
              <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>
                {mockPaymentDetails.bankName} - BSB {formatBSB(mockPaymentDetails.bsb)}
              </Text>
            </View>
            {selectedMethod === 'bank_transfer' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>

          {/* PayPal Option */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              { backgroundColor: colors.surface, borderColor: 'transparent' },
              selectedMethod === 'paypal' && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
            ]}
            onPress={() => {
              setSelectedMethod('paypal');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.methodIcon, { backgroundColor: colors.gray100 }]}>
              <Ionicons
                name="logo-paypal"
                size={24}
                color={selectedMethod === 'paypal' ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={styles.methodContent}>
              <Text style={[
                styles.methodTitle,
                { color: colors.gray900 },
                selectedMethod === 'paypal' && { color: colors.primary },
              ]}>
                PayPal
              </Text>
              <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>paypal.me/{mockPaymentDetails.paypalUsername}</Text>
            </View>
            {selectedMethod === 'paypal' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Payment Details Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Payment Details</Text>
          <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
            {selectedMethod === 'payid' && (
              <>
                <DetailRow label="PayID" value={formatPayID(mockPaymentDetails.payid, 'phone')} colors={colors} />
                <DetailRow label="Name" value={mockPaymentDetails.accountName} colors={colors} />
              </>
            )}
            {selectedMethod === 'bank_transfer' && (
              <>
                <DetailRow label="Bank" value={mockPaymentDetails.bankName} colors={colors} />
                <DetailRow label="BSB" value={formatBSB(mockPaymentDetails.bsb)} colors={colors} />
                <DetailRow label="Account" value={mockPaymentDetails.accountNumber} colors={colors} />
                <DetailRow label="Name" value={mockPaymentDetails.accountName} colors={colors} />
              </>
            )}
            {selectedMethod === 'paypal' && (
              <>
                <DetailRow label="PayPal" value={`paypal.me/${mockPaymentDetails.paypalUsername}`} colors={colors} />
                <DetailRow label="Amount" value={`$${amount.toFixed(2)} AUD`} colors={colors} />
              </>
            )}
          </View>
        </View>

        {/* Share Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Share Payment Request</Text>

          <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color={colors.surface} />
            <Text style={[styles.shareButtonText, { color: colors.surface }]}>Share via...</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleCopyDetails} activeOpacity={0.8}>
            <Ionicons name="copy-outline" size={20} color={colors.surface} />
            <Text style={[styles.shareButtonText, { color: colors.surface }]}>Copy to Clipboard</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: colors.gray200 }]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate('CreateSplit'); // Navigate back to home
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.doneButtonText, { color: colors.gray900 }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Detail Row Component
function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.gray900 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
  },
  headerSubtitle: {
    ...typography.caption,
  },
  content: {
    flex: 1,
  },
  amountCard: {
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.medium,
  },
  amountLabel: {
    ...typography.caption,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  amountValue: {
    ...typography.h1,
    fontWeight: '700',
  },
  amountDescription: {
    ...typography.body,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    ...typography.h4,
    marginBottom: 2,
  },
  methodSubtitle: {
    ...typography.caption,
  },
  detailsCard: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  detailLabel: {
    ...typography.body,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  shareButtonText: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  doneButton: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  doneButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  // Pay with Card styles
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    ...shadows.low,
  },
  payNowIcon: {
    marginRight: spacing.sm,
  },
  payNowText: {
    flex: 1,
    ...typography.body,
    fontWeight: '700',
    fontSize: 16,
  },
  payNowNote: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    fontWeight: '600',
  },
});
