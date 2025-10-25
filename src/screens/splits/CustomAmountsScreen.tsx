import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CustomAmountsScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { ParticipantRow, Participant } from '../../components/splits';

export default function CustomAmountsScreen({ navigation, route }: CustomAmountsScreenProps) {
  const { amount, title, description, selectedFriends } = route.params;

  // Mock friends data (will match the selected IDs)
  const mockFriendsData = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: '4', name: 'Bob Wilson', email: 'bob@example.com' },
    { id: '5', name: 'Emma Davis', email: 'emma@example.com' },
    { id: '6', name: 'Michael Brown', email: 'michael@example.com' },
  ];

  // Create participants from selected friends
  const selectedFriendsData = selectedFriends
    .map(id => mockFriendsData.find(f => f.id === id))
    .filter((f): f is { id: string; name: string; email: string } => f !== undefined);

  // Initialize participants with equal split
  const initialAmount = amount / (selectedFriendsData.length + 1); // +1 for current user

  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'current-user',
      name: 'You',
      email: 'your@email.com',
      amount_owed: initialAmount,
    },
    ...selectedFriendsData.map(friend => ({
      id: friend.id,
      name: friend.name,
      email: friend.email,
      amount_owed: initialAmount,
    })),
  ]);

  const [totalAssigned, setTotalAssigned] = useState(0);
  const [remaining, setRemaining] = useState(0);

  // Calculate totals whenever participants change
  useEffect(() => {
    const total = participants.reduce((sum, p) => sum + p.amount_owed, 0);
    setTotalAssigned(total);
    setRemaining(amount - total);
  }, [participants, amount]);

  const handleAmountChange = (participantId: string, newAmount: number) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, amount_owed: newAmount } : p
      )
    );
  };

  const handleContinue = () => {
    if (Math.abs(remaining) > 0.01) return; // Not valid if amounts don't match

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create custom amounts object
    const customAmounts: Record<string, number> = {};
    participants.forEach(p => {
      customAmounts[p.id] = p.amount_owed;
    });

    navigation.navigate('ReviewSplit', {
      amount,
      title,
      description,
      selectedFriends,
      splitMethod: 'custom',
      customAmounts,
    });
  };

  const isValid = Math.abs(remaining) < 0.01; // Allow for floating point errors

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Custom Amounts</Text>
          <Text style={styles.pageSubtitle}>
            Enter amount for each person
          </Text>
        </View>

        {/* Progress Card */}
        <View style={[styles.progressCard, !isValid && styles.progressCardError]}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Total Bill</Text>
            <Text style={styles.progressAmount}>${amount.toFixed(2)}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Assigned</Text>
            <Text style={[
              styles.progressAmount,
              totalAssigned > amount && styles.progressAmountError
            ]}>
              ${totalAssigned.toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.progressRow}>
            <Text style={styles.remainingLabel}>Remaining</Text>
            <Text style={[
              styles.remainingAmount,
              remaining < -0.01 && styles.remainingAmountError,
              Math.abs(remaining) < 0.01 && styles.remainingAmountValid
            ]}>
              ${remaining.toFixed(2)}
            </Text>
          </View>

          {!isValid && (
            <Text style={styles.errorText}>
              {remaining > 0.01
                ? `Assign $${remaining.toFixed(2)} more to match total`
                : `Reduce by $${Math.abs(remaining).toFixed(2)} to match total`}
            </Text>
          )}
        </View>

        {/* Participants List */}
        <ScrollView
          style={styles.participantsList}
          showsVerticalScrollIndicator={false}
        >
          {participants.map(participant => (
            <ParticipantRow
              key={participant.id}
              participant={participant}
              isEditable
              onAmountChange={handleAmountChange}
              isHighlighted={participant.id === 'current-user'}
            />
          ))}
        </ScrollView>
      </View>

      {/* Continue Button - Fixed at Bottom */}
      <View style={styles.buttonContainer}>
        {isValid && (
          <Text style={styles.validText}>
            ✓ Amounts match total
          </Text>
        )}
        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.7}
        >
          <Text style={[styles.continueButtonText, !isValid && styles.continueButtonTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  progressCardError: {
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  progressAmountError: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.sm,
  },
  remainingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  remainingAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.warning,
  },
  remainingAmountError: {
    color: colors.error,
  },
  remainingAmountValid: {
    color: colors.success,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  participantsList: {
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  validText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
    letterSpacing: 0.5,
  },
  continueButtonTextDisabled: {
    color: colors.gray400,
  },
});
