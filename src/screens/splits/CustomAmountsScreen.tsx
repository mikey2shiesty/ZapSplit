import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CustomAmountsScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { ParticipantRow, Participant } from '../../components/splits';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../hooks/useAuth';

export default function CustomAmountsScreen({ navigation, route }: CustomAmountsScreenProps) {
  const { amount, title, description, selectedFriends } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { allFriends } = useFriends();

  // Initialize with empty - friends will be added when loaded
  // Creator is NOT a participant - only friends who owe money are participants
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [totalAssigned, setTotalAssigned] = useState(0);
  const [remaining, setRemaining] = useState(0);

  // Update participants when friends are loaded
  useEffect(() => {
    if (allFriends.length > 0 && participants.length === 0) {
      const friendsData = selectedFriends
        .map(id => allFriends.find(f => f.id === id))
        .filter(f => f !== undefined);

      // Only friends are participants - creator receives the money
      const perPerson = amount / friendsData.length;

      setParticipants(
        friendsData.map(friend => ({
          id: friend!.id,
          name: friend!.full_name || 'Unknown',
          email: friend!.email,
          amount_owed: perPerson,
        }))
      );
    }
  }, [allFriends, selectedFriends, amount]);

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
    </View>
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
