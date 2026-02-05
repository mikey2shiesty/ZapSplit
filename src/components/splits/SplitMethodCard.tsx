import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

export type SplitMethod = 'equal' | 'custom' | 'percentage';

interface SplitMethodCardProps {
  method: SplitMethod;
  isSelected: boolean;
  onSelect: () => void;
  totalAmount: number;
  participantCount: number;
}

const METHOD_CONFIG = {
  equal: {
    icon: 'people' as const,
    title: 'Split Equally',
    description: 'Everyone pays the same amount',
  },
  custom: {
    icon: 'calculator' as const,
    title: 'Custom Amounts',
    description: 'Enter specific amounts for each person',
  },
  percentage: {
    icon: 'pie-chart' as const,
    title: 'Split by Percentage',
    description: 'Assign percentage to each person',
  },
};

export default function SplitMethodCard({
  method,
  isSelected,
  onSelect,
  totalAmount,
  participantCount,
}: SplitMethodCardProps) {
  const { colors } = useTheme();
  const config = METHOD_CONFIG[method];

  // Calculate preview amount based on method
  const getPreviewText = (): string => {
    if (participantCount === 0) return '';

    switch (method) {
      case 'equal':
        const perPerson = totalAmount / participantCount;
        return `$${perPerson.toFixed(2)} per person`;
      case 'custom':
        return 'You decide who pays what';
      case 'percentage':
        return `${(100 / participantCount).toFixed(0)}% each person`;
      default:
        return '';
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? colors.primaryLight : colors.surface,
          borderColor: isSelected ? colors.primary : colors.gray200,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[
        styles.iconContainer,
        { backgroundColor: isSelected ? colors.primaryLight : colors.gray100 }
      ]}>
        <Ionicons
          name={config.icon}
          size={32}
          color={isSelected ? colors.primary : colors.gray500}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.gray900 }]}>{config.title}</Text>
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.gray500 }]}>{config.description}</Text>

        {/* Preview Amount */}
        {totalAmount > 0 && participantCount > 0 && (
          <View style={[styles.previewContainer, { backgroundColor: colors.gray100 }]}>
            <Text style={[
              styles.previewText,
              { color: isSelected ? colors.primary : colors.gray600 },
            ]}>
              {getPreviewText()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  checkmark: {
    marginLeft: spacing.sm,
  },
  description: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  previewContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
