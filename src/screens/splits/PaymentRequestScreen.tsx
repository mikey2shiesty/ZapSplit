import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import {
  PaymentMethod,
  sharePaymentDetails,
  copyPaymentDetails,
  sendPaymentViaSMS,
  sendPaymentViaWhatsApp,
  formatBSB,
  formatPayID,
  PaymentRequest,
} from '../../services/paymentService';

// This will be from navigation params in the real implementation
interface PaymentRequestScreenProps {
  navigation: any;
  route: {
    params: {
      amount: number; // Your total amount
      description: string; // e.g., "Your share for dinner at Chipotle"
      splitId?: string;
    };
  };
}

export default function PaymentRequestScreen({ navigation, route }: PaymentRequestScreenProps) {
  const { amount, description, splitId } = route.params;

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

  const handleSMS = async () => {
    // TODO: Get friend's phone number from split participants
    Alert.alert('Send SMS', 'This will send an SMS to the person who paid the bill');
  };

  const handleWhatsApp = async () => {
    // TODO: Get friend's phone number from split participants
    Alert.alert('Send WhatsApp', 'This will send a WhatsApp message');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Request Payment</Text>
          <Text style={styles.headerSubtitle}>Share your payment details</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Your Total</Text>
          <Text style={styles.amountValue}>${amount.toFixed(2)}</Text>
          <Text style={styles.amountDescription}>{description}</Text>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          <Text style={styles.sectionSubtitle}>How do you want to receive payment?</Text>

          {/* PayID Option */}
          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'payid' && styles.methodCardSelected]}
            onPress={() => {
              setSelectedMethod('payid');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.methodIcon}>
              <Ionicons
                name="phone-portrait-outline"
                size={24}
                color={selectedMethod === 'payid' ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={styles.methodContent}>
              <Text style={[styles.methodTitle, selectedMethod === 'payid' && styles.methodTitleSelected]}>
                PayID
              </Text>
              <Text style={styles.methodSubtitle}>
                {formatPayID(mockPaymentDetails.payid, 'phone')}
              </Text>
            </View>
            {selectedMethod === 'payid' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>

          {/* Bank Transfer Option */}
          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'bank_transfer' && styles.methodCardSelected]}
            onPress={() => {
              setSelectedMethod('bank_transfer');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.methodIcon}>
              <Ionicons
                name="business-outline"
                size={24}
                color={selectedMethod === 'bank_transfer' ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={styles.methodContent}>
              <Text style={[styles.methodTitle, selectedMethod === 'bank_transfer' && styles.methodTitleSelected]}>
                Bank Transfer
              </Text>
              <Text style={styles.methodSubtitle}>
                {mockPaymentDetails.bankName} • BSB {formatBSB(mockPaymentDetails.bsb)}
              </Text>
            </View>
            {selectedMethod === 'bank_transfer' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>

          {/* PayPal Option */}
          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'paypal' && styles.methodCardSelected]}
            onPress={() => {
              setSelectedMethod('paypal');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.methodIcon}>
              <Ionicons
                name="logo-paypal"
                size={24}
                color={selectedMethod === 'paypal' ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={styles.methodContent}>
              <Text style={[styles.methodTitle, selectedMethod === 'paypal' && styles.methodTitleSelected]}>
                PayPal
              </Text>
              <Text style={styles.methodSubtitle}>paypal.me/{mockPaymentDetails.paypalUsername}</Text>
            </View>
            {selectedMethod === 'paypal' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Payment Details Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.detailsCard}>
            {selectedMethod === 'payid' && (
              <>
                <DetailRow label="PayID" value={formatPayID(mockPaymentDetails.payid, 'phone')} />
                <DetailRow label="Name" value={mockPaymentDetails.accountName} />
              </>
            )}
            {selectedMethod === 'bank_transfer' && (
              <>
                <DetailRow label="Bank" value={mockPaymentDetails.bankName} />
                <DetailRow label="BSB" value={formatBSB(mockPaymentDetails.bsb)} />
                <DetailRow label="Account" value={mockPaymentDetails.accountNumber} />
                <DetailRow label="Name" value={mockPaymentDetails.accountName} />
              </>
            )}
            {selectedMethod === 'paypal' && (
              <>
                <DetailRow label="PayPal" value={`paypal.me/${mockPaymentDetails.paypalUsername}`} />
                <DetailRow label="Amount" value={`$${amount.toFixed(2)} AUD`} />
              </>
            )}
          </View>
        </View>

        {/* Share Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share Payment Request</Text>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color={colors.surface} />
            <Text style={styles.shareButtonText}>Share via...</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleCopyDetails} activeOpacity={0.8}>
            <Ionicons name="copy-outline" size={20} color={colors.surface} />
            <Text style={styles.shareButtonText}>Copy to Clipboard</Text>
          </TouchableOpacity>

          {/* TODO: Implement when we have friend phone numbers */}
          {/* <TouchableOpacity style={styles.shareButtonSecondary} onPress={handleSMS} activeOpacity={0.8}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            <Text style={styles.shareButtonSecondaryText}>Send SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButtonSecondary} onPress={handleWhatsApp} activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={20} color={colors.primary} />
            <Text style={styles.shareButtonSecondaryText}>Send WhatsApp</Text>
          </TouchableOpacity> */}
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate('CreateSplit'); // Navigate back to home
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Detail Row Component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  amountCard: {
    backgroundColor: colors.primary,
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.medium,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.surface,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  amountValue: {
    ...typography.h1,
    color: colors.surface,
    fontWeight: '700',
  },
  amountDescription: {
    ...typography.body,
    color: colors.surface,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 2,
  },
  methodTitleSelected: {
    color: colors.primary,
  },
  methodSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  shareButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  shareButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareButtonSecondaryText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButton: {
    backgroundColor: colors.gray200,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  doneButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});
