import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { SplitSuccessScreenProps } from '../../types/navigation';
import { spacing, radius, typography } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

export default function SplitSuccessScreen({ navigation, route }: SplitSuccessScreenProps) {
  const { splitId, amount, participantCount, splitMethod, participantAmounts, paymentLink } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const isEqualSplit = splitMethod === 'equal' || !splitMethod;

  // Haptic feedback on mount
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate back to home (dismiss modal)
    navigation.getParent()?.goBack();
  };

  const handleViewSplit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to split detail screen
    navigation.navigate('SplitDetail', { splitId });
  };

  const handleShareLink = async () => {
    if (!paymentLink) {
      // Fallback to view split if no link
      handleViewSplit();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Share.share({
        message: `Hey! I'm splitting a bill with you. Claim your items and pay here: ${paymentLink}`,
        url: paymentLink,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!paymentLink) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(paymentLink);
    Alert.alert('Copied!', 'Payment link copied to clipboard');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark-circle"
            size={100}
            color={colors.success}
          />
        </View>

        {/* Success Message */}
        <Text style={[styles.title, { color: colors.text }]}>Split Created!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your split has been created successfully
        </Text>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Amount</Text>
            <Text style={[styles.summaryAmount, { color: colors.primary }]}>${amount.toFixed(2)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Participants</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{participantCount} people</Text>
          </View>

          {isEqualSplit ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Per Person</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                ${(amount / participantCount).toFixed(2)}
              </Text>
            </View>
          ) : participantAmounts && participantAmounts.length > 0 ? (
            <View style={styles.participantsList}>
              <Text style={[styles.participantsHeader, { color: colors.textSecondary }]}>Individual Amounts</Text>
              {participantAmounts.map((p, index) => (
                <View key={index} style={styles.participantRow}>
                  <Text style={[styles.participantName, { color: colors.text }]}>{p.name}</Text>
                  <Text style={[styles.participantAmount, { color: colors.text }]}>${p.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Per Person</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>Varies</Text>
            </View>
          )}
        </View>

        {/* Info Text */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : colors.infoLight }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Share the link below - friends can claim their items and pay via card, Apple Pay, or Google Pay
          </Text>
        </View>

        {/* Payment Link Card */}
        {paymentLink && (
          <TouchableOpacity style={[styles.linkCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleCopyLink} activeOpacity={0.7}>
            <View style={styles.linkContent}>
              <Ionicons name="link" size={20} color={colors.primary} />
              <Text style={styles.linkText} numberOfLines={1}>{paymentLink}</Text>
            </View>
            <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleShareLink}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Share Link</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.gray100 }]}
          onPress={handleViewSplit}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>View Split Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          activeOpacity={0.7}
        >
          <Text style={[styles.doneButtonText, { color: colors.textSecondary }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryAmount: {
    ...typography.numberLarge,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  participantsList: {
    marginTop: spacing.xs,
  },
  participantsHeader: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '500',
  },
  participantAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    marginLeft: spacing.sm,
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  doneButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    marginTop: spacing.md,
    borderWidth: 1,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  linkText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: spacing.sm,
    flex: 1,
  },
});
