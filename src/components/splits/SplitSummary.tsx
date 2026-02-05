import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';
import ParticipantRow, { Participant } from './ParticipantRow';

interface SplitSummaryProps {
  title: string;
  totalAmount: number;
  participants: Participant[];
  currentUserId?: string;
  description?: string;
  splitMethod?: 'equal' | 'custom' | 'percentage' | 'receipt';
  showProgress?: boolean;
}

export default function SplitSummary({
  title,
  totalAmount,
  participants,
  currentUserId,
  description,
  splitMethod = 'equal',
  showProgress = false,
}: SplitSummaryProps) {
  const { colors } = useTheme();
  // Calculate progress
  const paidCount = participants.filter(p => p.status === 'paid').length;
  const totalCount = participants.length;
  const progressPercentage = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  // Calculate total collected
  const totalCollected = participants.reduce(
    (sum, p) => sum + (p.amount_paid || 0),
    0
  );

  // Get method display name
  const getMethodName = (): string => {
    switch (splitMethod) {
      case 'equal':
        return 'Split Equally';
      case 'custom':
        return 'Custom Amounts';
      case 'percentage':
        return 'By Percentage';
      case 'receipt':
        return 'By Receipt Items';
      default:
        return '';
    }
  };

  // Get method icon
  const getMethodIcon = (): 'people' | 'calculator' | 'pie-chart' | 'receipt' => {
    switch (splitMethod) {
      case 'equal':
        return 'people';
      case 'custom':
        return 'calculator';
      case 'percentage':
        return 'pie-chart';
      case 'receipt':
        return 'receipt';
      default:
        return 'people';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface }]}>
        {/* Title */}
        <Text style={[styles.title, { color: colors.gray900 }]}>{title}</Text>

        {/* Description */}
        {description && (
          <Text style={[styles.description, { color: colors.gray500 }]}>{description}</Text>
        )}

        {/* Total Amount */}
        <View style={[styles.totalContainer, { borderColor: colors.gray200 }]}>
          <Text style={[styles.totalLabel, { color: colors.gray500 }]}>TOTAL AMOUNT</Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>${totalAmount.toFixed(2)}</Text>
        </View>

        {/* Split Method Badge */}
        <View style={[styles.methodBadge, { backgroundColor: colors.primaryLight }]}>
          <Ionicons
            name={getMethodIcon()}
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.methodText, { color: colors.primary }]}>{getMethodName()}</Text>
        </View>
      </View>

      {/* Progress Card (if showing progress) */}
      {showProgress && (
        <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.gray900 }]}>Payment Progress</Text>
            <Text style={[styles.progressCount, { color: colors.primary }]}>
              {paidCount}/{totalCount} paid
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.gray200 }]}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%`, backgroundColor: colors.success }]} />
          </View>

          {/* Amount Collected */}
          <View style={styles.collectedContainer}>
            <Text style={[styles.collectedLabel, { color: colors.gray500 }]}>Collected</Text>
            <Text style={[styles.collectedAmount, { color: colors.gray900 }]}>
              ${totalCollected.toFixed(2)} / ${totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Participants Section */}
      <View style={styles.participantsSection}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Participants ({participants.length})
        </Text>

        {/* Participant List */}
        {participants.map((participant) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            showStatus={showProgress}
            isHighlighted={participant.id === currentUserId}
          />
        ))}
      </View>

      {/* Summary Stats */}
      <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.gray500 }]}>Per Person Average</Text>
          <Text style={[styles.statValue, { color: colors.gray900 }]}>
            ${(participants.reduce((sum, p) => sum + p.amount_owed, 0) / participants.length).toFixed(2)}
          </Text>
        </View>

        {showProgress && (
          <>
            <View style={[styles.statDivider, { backgroundColor: colors.gray200 }]} />
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>Remaining</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                ${(totalAmount - totalCollected).toFixed(2)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Legend (if showing status) */}
      {showProgress && (
        <View style={[styles.legendCard, { backgroundColor: colors.gray100 }]}>
          <View style={styles.legendItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.legendText, { color: colors.gray500 }]}>Paid</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="time" size={20} color={colors.warning} />
            <Text style={[styles.legendText, { color: colors.gray500 }]}>Pending</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  totalContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  progressCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  collectedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectedLabel: {
    fontSize: 14,
  },
  collectedAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  participantsSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  statsCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statDivider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  legendCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  legendText: {
    fontSize: 14,
    marginLeft: spacing.xs,
  },
});
