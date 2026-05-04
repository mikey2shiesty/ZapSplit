import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, radius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

// Friendly Fintech Button — pill-shaped, saturated.
// Primary    → filled accent + white label (Coinbase "Buy")
// Secondary  → soft-blue tint + accent label (Coinbase "Deposit")
// Tertiary   → text-only accent (used for "View all", "Add Friends")
// Destructive→ soft-red tint + negative label
// Outline / Ghost remain as aliases for back-compat — both map to tertiary.

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline' | 'ghost';
type Size = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Map back-compat aliases.
  const v: Variant =
    variant === 'outline' || variant === 'ghost' ? 'tertiary' : variant;

  const heights: Record<Size, number> = { small: 40, medium: 52, large: 56 };
  const horizontalPad: Record<Size, number> = { small: spacing.md, medium: spacing.lg, large: spacing.lg };

  const fills: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.primaryLight,
    tertiary: 'transparent',
    destructive: colors.errorLight,
    outline: 'transparent',
    ghost: 'transparent',
  };
  const labels: Record<Variant, string> = {
    primary: colors.textInverse,
    secondary: colors.primary,
    tertiary: colors.primary,
    destructive: colors.error,
    outline: colors.primary,
    ghost: colors.primary,
  };

  const isPill = v === 'primary' || v === 'secondary' || v === 'destructive';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: heights[size],
          paddingHorizontal: horizontalPad[size],
          backgroundColor: fills[v],
          borderRadius: isPill ? radius.pill : 0,
        },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labels[v]} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, { color: labels[v] }, textStyle]}>
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...typography.button,
  },
});
