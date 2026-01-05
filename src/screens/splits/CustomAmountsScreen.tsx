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
import { spacing, radius, typography } from '../../constants/theme';
import { ParticipantRow, Participant } from '../../components/splits';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

export default function CustomAmountsScreen({ navigation, route }: CustomAmountsScreenProps) {
  const { amount, title, description, selectedFriends } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { allFriends } = useFriends();
  const { colors, isDark } = useTheme();

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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.gray900 }]}>Custom Amounts</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            Enter amount for each person
          </Text>
        </View>

        {/* Progress Card */}
        <View style={[
          styles.progressCard,
          { backgroundColor: colors.surface, borderColor: colors.gray200 },
          !isValid && { borderColor: colors.warning, backgroundColor: colors.warningLight }
        ]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Total Bill</Text>
            <Text style={[styles.progressAmount, { color: colors.gray900 }]}>${amount.toFixed(2)}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Assigned</Text>
            <Text style={[
              styles.progressAmount,
              { color: colors.gray900 },
              totalAssigned > amount && { color: colors.error }
            ]}>
              ${totalAssigned.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.gray200 }]} />

          <View style={styles.progressRow}>
            <Text style={[styles.remainingLabel, { color: colors.gray900 }]}>Remaining</Text>
            <Text style={[
              styles.remainingAmount,
              { color: colors.warning },
              remaining < -0.01 && { color: colors.error },
              Math.abs(remaining) < 0.01 && { color: colors.success }
            ]}>
              ${remaining.toFixed(2)}
            </Text>
          </View>

          {!isValid && (
            <Text style={[styles.errorText, { color: colors.error }]}>
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
      <View style={[styles.buttonContainer, { backgroundColor: colors.gray50, borderTopColor: colors.gray200 }]}>
        {isValid && (
          <Text style={[styles.validText, { color: colors.success }]}>
            Amounts match total
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            !isValid && { backgroundColor: colors.gray200 }
          ]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.continueButtonText,
            { color: colors.surface },
            !isValid && { color: colors.gray400 }
          ]}>
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
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  remainingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  remainingAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  participantsList: {
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  validText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  continueButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
