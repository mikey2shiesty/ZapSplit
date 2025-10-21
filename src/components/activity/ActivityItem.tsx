import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { colors, spacing, radius } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

export type ActivityType = 'payment_sent' | 'payment_received' | 'split_created' | 'split_settled';

interface ActivityItemProps {
  type: ActivityType;
  userName: string;
  description: string;
  amount?: number;
  timestamp: string;
  onPress?: () => void;
}

export default function ActivityItem({
  type,
  userName,
  description,
  amount,
  timestamp,
  onPress,
}: ActivityItemProps) {
  const isPositive = type === 'payment_received';
  const isNegative = type === 'payment_sent';

  const getIcon = () => {
    switch (type) {
      case 'payment_sent':
        return { name: 'arrow-up-circle' as const, color: colors.error };
      case 'payment_received':
        return { name: 'arrow-down-circle' as const, color: colors.success };
      case 'split_created':
        return { name: 'receipt' as const, color: colors.primary };
      case 'split_settled':
        return { name: 'checkmark-circle' as const, color: colors.success };
    }
  };

  const icon = getIcon();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      activeOpacity={0.7}
    >
      <Avatar name={userName} size="md" />

      <View style={styles.content}>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>

      <View style={styles.rightContent}>
        {amount !== undefined && (
          <Text
            style={[
              styles.amount,
              isPositive && { color: colors.success },
              isNegative && { color: colors.error },
            ]}
          >
            {isPositive ? '+' : isNegative ? '-' : ''}${Math.abs(amount).toFixed(2)}
          </Text>
        )}
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  description: {
    fontSize: 14,
    color: colors.gray600,
  },
  timestamp: {
    fontSize: 12,
    color: colors.gray500,
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    letterSpacing: -0.2,
  },
});
