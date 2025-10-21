import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface RecentSplitCardProps {
  title: string;
  paidCount: number;
  totalCount: number;
  amount: number;
  date: string;
  onPress?: () => void;
}

export default function RecentSplitCard({
  title,
  paidCount,
  totalCount,
  amount,
  date,
  onPress,
}: RecentSplitCardProps) {
  const progressPercentage = (paidCount / totalCount) * 100;
  const isComplete = paidCount === totalCount;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={isComplete ? "checkmark-circle" : "receipt-outline"}
            size={24}
            color={isComplete ? colors.success : colors.primary}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {date} • {paidCount}/{totalCount} paid
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: isComplete ? colors.success : colors.primary
                  }
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.rightContent}>
          <Text style={styles.amount}>${amount.toFixed(2)}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
});
