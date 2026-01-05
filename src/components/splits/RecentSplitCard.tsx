import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { colors } = useTheme();
  const progressPercentage = (paidCount / totalCount) * 100;
  const isComplete = paidCount === totalCount;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.gray100 }]}>
          <Ionicons
            name={isComplete ? "checkmark-circle" : "receipt-outline"}
            size={24}
            color={isComplete ? colors.success : colors.primary}
          />
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.gray900 }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.gray600 }]}>
            {date} • {paidCount}/{totalCount} paid
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.gray200 }]}>
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
          <Text style={[styles.amount, { color: colors.gray900 }]}>${amount.toFixed(2)}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  subtitle: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 4,
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
  },
});
