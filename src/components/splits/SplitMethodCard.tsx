import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/theme';

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
        isSelected && styles.cardSelected,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
        <Ionicons
          name={config.icon}
          size={32}
          color={isSelected ? colors.primary : colors.textSecondary}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{config.title}</Text>
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.description}>{config.description}</Text>

        {/* Preview Amount */}
        {totalAmount > 0 && participantCount > 0 && (
          <View style={styles.previewContainer}>
            <Text style={[
              styles.previewText,
              isSelected && styles.previewTextSelected,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'flex-start',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: colors.primaryLight,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  checkmark: {
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  previewContainer: {
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  previewTextSelected: {
    color: colors.primary,
  },
});
