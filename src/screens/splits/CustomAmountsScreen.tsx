import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CustomAmountsScreenProps } from '../../types/navigation';
import { spacing, radius, typography } from '../../constants/theme';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

interface ParticipantEntry {
  id: string;
  name: string;
  email?: string;
  value: number; // Amount in $ for custom, percentage for percentage mode
  isCreator: boolean;
}

export default function CustomAmountsScreen({ navigation, route }: CustomAmountsScreenProps) {
  const { amount, title, description, selectedFriends, splitMethod = 'custom', groupId } = route.params;
  const isPercentageMode = splitMethod === 'percentage';
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { allFriends } = useFriends();
  const { colors, isDark } = useTheme();

  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // Initialize participants (including creator)
  useEffect(() => {
    if (allFriends.length > 0 && participants.length === 0 && user) {
      const friendsData = selectedFriends
        .map(id => allFriends.find(f => f.id === id))
        .filter(f => f !== undefined);

      const totalPeople = friendsData.length + 1; // Friends + creator
      const defaultValue = isPercentageMode
        ? Math.floor(100 / totalPeople)
        : Math.floor((amount / totalPeople) * 100) / 100;

      // Build participants list with creator first
      const allParticipants: ParticipantEntry[] = [
        {
          id: user.id,
          name: 'You',
          email: user.email || undefined,
          value: defaultValue,
          isCreator: true,
        },
        ...friendsData.map(friend => ({
          id: friend!.id,
          name: friend!.full_name || 'Unknown',
          email: friend!.email,
          value: defaultValue,
          isCreator: false,
        })),
      ];

      // Adjust last person to make total exactly 100% or full amount
      if (isPercentageMode) {
        const totalSoFar = defaultValue * totalPeople;
        const remainder = 100 - totalSoFar;
        if (remainder !== 0 && allParticipants.length > 0) {
          allParticipants[allParticipants.length - 1].value += remainder;
        }
      } else {
        const totalSoFar = defaultValue * totalPeople;
        const remainder = Math.round((amount - totalSoFar) * 100) / 100;
        if (Math.abs(remainder) > 0.001 && allParticipants.length > 0) {
          allParticipants[allParticipants.length - 1].value += remainder;
        }
      }

      setParticipants(allParticipants);

      // Initialize editing values
      const initialEditing: Record<string, string> = {};
      allParticipants.forEach(p => {
        initialEditing[p.id] = p.value.toString();
      });
      setEditingValues(initialEditing);
    }
  }, [allFriends, selectedFriends, amount, user, isPercentageMode]);

  // Calculate totals
  const totalAssigned = participants.reduce((sum, p) => sum + p.value, 0);
  const targetTotal = isPercentageMode ? 100 : amount;
  const remaining = targetTotal - totalAssigned;
  const isValid = Math.abs(remaining) < 0.01;

  const handleValueChange = (participantId: string, text: string) => {
    setEditingValues(prev => ({ ...prev, [participantId]: text }));

    const numericValue = parseFloat(text) || 0;
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, value: numericValue } : p
      )
    );
  };

  const handleContinue = () => {
    if (!isValid) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create custom amounts object (convert percentages to amounts if needed)
    const customAmounts: Record<string, number> = {};

    // Only include friends (not creator) in the amounts that get saved
    // Creator's portion stays with them, friends owe their portion
    participants.forEach(p => {
      if (!p.isCreator) {
        if (isPercentageMode) {
          // Convert percentage to amount
          customAmounts[p.id] = Math.round((p.value / 100) * amount * 100) / 100;
        } else {
          customAmounts[p.id] = p.value;
        }
      }
    });

    navigation.navigate('ReviewSplit', {
      amount,
      title,
      description,
      selectedFriends,
      splitMethod,
      customAmounts,
      groupId,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.gray900 }]}>
            {isPercentageMode ? 'Split by Percentage' : 'Custom Amounts'}
          </Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            {isPercentageMode ? 'Enter percentage for each person' : 'Enter amount for each person'}
          </Text>
        </View>

        {/* Progress Card */}
        <View style={[
          styles.progressCard,
          { backgroundColor: colors.surface, borderColor: colors.gray200 },
          !isValid && { borderColor: colors.warning, backgroundColor: colors.warningLight }
        ]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {isPercentageMode ? 'Target' : 'Total Bill'}
            </Text>
            <Text style={[styles.progressAmount, { color: colors.gray900 }]}>
              {isPercentageMode ? '100%' : `$${amount.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Assigned</Text>
            <Text style={[
              styles.progressAmount,
              { color: colors.gray900 },
              totalAssigned > targetTotal && { color: colors.error }
            ]}>
              {isPercentageMode ? `${totalAssigned.toFixed(0)}%` : `$${totalAssigned.toFixed(2)}`}
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
              {isPercentageMode ? `${remaining.toFixed(0)}%` : `$${remaining.toFixed(2)}`}
            </Text>
          </View>

          {!isValid && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {remaining > 0.01
                ? isPercentageMode
                  ? `Assign ${remaining.toFixed(0)}% more to reach 100%`
                  : `Assign $${remaining.toFixed(2)} more to match total`
                : isPercentageMode
                  ? `Reduce by ${Math.abs(remaining).toFixed(0)}% to reach 100%`
                  : `Reduce by $${Math.abs(remaining).toFixed(2)} to match total`}
            </Text>
          )}
        </View>

        {/* Participants List */}
        <ScrollView
          style={styles.participantsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {participants.map(participant => (
            <View
              key={participant.id}
              style={[
                styles.participantRow,
                {
                  backgroundColor: participant.isCreator ? colors.primaryLight : colors.surface,
                  borderColor: participant.isCreator ? colors.primary : colors.gray200,
                  borderWidth: participant.isCreator ? 2 : 1,
                }
              ]}
            >
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {participant.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.infoContainer}>
                <Text style={[styles.name, { color: colors.gray900 }]}>
                  {participant.name}
                </Text>
                {participant.email && (
                  <Text style={[styles.email, { color: colors.gray500 }]}>{participant.email}</Text>
                )}
              </View>

              {/* Amount/Percentage Input */}
              <View style={[
                styles.inputContainer,
                { backgroundColor: colors.gray100, borderColor: colors.gray300 }
              ]}>
                {!isPercentageMode && (
                  <Text style={[styles.symbol, { color: colors.gray500 }]}>$</Text>
                )}
                <TextInput
                  style={[styles.input, { color: colors.gray900 }]}
                  value={editingValues[participant.id] || ''}
                  onChangeText={(text) => handleValueChange(participant.id, text)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.gray400}
                />
                {isPercentageMode && (
                  <Text style={[styles.symbol, { color: colors.gray500 }]}>%</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Continue Button - Fixed at Bottom */}
      <View style={[styles.buttonContainer, { backgroundColor: colors.gray50, borderTopColor: colors.gray200 }]}>
        {isValid && (
          <Text style={[styles.validText, { color: colors.success }]}>
            {isPercentageMode ? 'Percentages add up to 100%' : 'Amounts match total'}
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
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    minWidth: 80,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 50,
    padding: 0,
    textAlign: 'center',
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
