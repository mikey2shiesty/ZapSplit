import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import ParticipantRow, { Participant } from './ParticipantRow';

interface SplitSummaryProps {
  title: string;
  totalAmount: number;
  participants: Participant[];
  currentUserId?: string;
  description?: string;
  splitMethod?: 'equal' | 'custom' | 'percentage';
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
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}

        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
        </View>

        {/* Split Method Badge */}
        <View style={styles.methodBadge}>
          <Ionicons
            name={splitMethod === 'equal' ? 'people' : splitMethod === 'custom' ? 'calculator' : 'pie-chart'}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.methodText}>{getMethodName()}</Text>
        </View>
      </View>

      {/* Progress Card (if showing progress) */}
      {showProgress && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Payment Progress</Text>
            <Text style={styles.progressCount}>
              {paidCount}/{totalCount} paid
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>

          {/* Amount Collected */}
          <View style={styles.collectedContainer}>
            <Text style={styles.collectedLabel}>Collected</Text>
            <Text style={styles.collectedAmount}>
              ${totalCollected.toFixed(2)} / ${totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Participants Section */}
      <View style={styles.participantsSection}>
        <Text style={styles.sectionTitle}>
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
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Per Person Average</Text>
          <Text style={styles.statValue}>
            ${(totalAmount / participants.length).toFixed(2)}
          </Text>
        </View>

        {showProgress && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={[styles.statValue, styles.statValuePending]}>
                ${(totalAmount - totalCollected).toFixed(2)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Legend (if showing status) */}
      {showProgress && (
        <View style={styles.legendCard}>
          <View style={styles.legendItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.legendText}>Paid</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="time" size={20} color={colors.warning} />
            <Text style={styles.legendText}>Pending</Text>
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  totalContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray200,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -1,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  collectedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectedLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  collectedAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  participantsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statValuePending: {
    color: colors.warning,
  },
  statDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 12,
  },
  legendCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
});
