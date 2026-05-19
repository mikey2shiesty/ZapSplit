import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { spacing, typography, radius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

// Friendly Fintech Badge — soft-tinted pill with weight-600 text in matching tone.
// Title case, NOT uppercase (consumer fintech doesn't shout).

type BadgeVariant =
  | 'paid'
  | 'pending'
  | 'owed'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'medium',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const { colors } = useTheme();

  const tint: Record<BadgeVariant, { fill: string; ink: string }> = {
    paid: { fill: colors.successLight, ink: colors.success },
    pending: { fill: colors.warningLight, ink: colors.warning },
    owed: { fill: colors.errorLight, ink: colors.error },
    success: { fill: colors.successLight, ink: colors.success },
    warning: { fill: colors.warningLight, ink: colors.warning },
    error: { fill: colors.errorLight, ink: colors.error },
    info: { fill: colors.primaryLight, ink: colors.primary },
    neutral: { fill: colors.gray100, ink: colors.textSecondary },
  };

  const config = tint[variant];

  return (
    <View
      style={[
        styles.base,
        styles[size],
        { backgroundColor: config.fill },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: config.ink }, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    gap: spacing.xs,
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  medium: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
  },
  large: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  text: {
    ...typography.chip,
  },
});
