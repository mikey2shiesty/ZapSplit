import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

type BadgeVariant = 'paid' | 'pending' | 'owed' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
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
  const variantConfig = {
    paid: {
      backgroundColor: colors.successLight,
      color: colors.success,
    },
    pending: {
      backgroundColor: colors.warningLight,
      color: colors.warning,
    },
    owed: {
      backgroundColor: colors.errorLight,
      color: colors.error,
    },
    success: {
      backgroundColor: colors.successLight,
      color: colors.success,
    },
    warning: {
      backgroundColor: colors.warningLight,
      color: colors.warning,
    },
    error: {
      backgroundColor: colors.errorLight,
      color: colors.error,
    },
    info: {
      backgroundColor: colors.infoLight,
      color: colors.info,
    },
    neutral: {
      backgroundColor: colors.gray100,
      color: colors.gray700,
    },
  };

  const config = variantConfig[variant];

  return (
    <View
      style={[
        styles.base,
        styles[size],
        { backgroundColor: config.backgroundColor },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
          { color: config.color },
          textStyle,
        ]}
      >
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
    gap: spacing.xxs,
  },
  small: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
  },
  medium: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  large: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
});
