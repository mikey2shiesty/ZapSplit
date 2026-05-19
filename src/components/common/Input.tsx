import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

// Friendly Fintech Input — 12pt-corner box on canvas, 1px border, white fill.
// Bold weight-600 text, soft border, accent focus, negative error.
// Use SearchInput (below) for the pill-shaped search bar variant.

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...textInputProps
}: InputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;
  const borderWidth = isFocused || error ? 2 : 1;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderWidth,
            // Compensate so 1px ↔ 2px transition doesn't shift the layout.
            paddingHorizontal: spacing.md - (borderWidth - 1),
            paddingVertical: 14 - (borderWidth - 1),
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, { color: colors.text }, style]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            { color: error ? colors.error : colors.textSecondary },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

// ========================================
// SearchInput — pill-shaped search bar
// ========================================
// 44pt height, fully rounded, soft-blue tinted fill, search glyph at left.
// This is the Coinbase / Uber / Public top-of-screen search.
interface SearchInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
}

export function SearchInput({ containerStyle, style, ...rest }: SearchInputProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.search,
        { backgroundColor: colors.primaryLight },
        containerStyle,
      ]}
    >
      <Ionicons name="search" size={18} color={colors.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }, style]}
        placeholderTextColor={colors.textTertiary}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    ...typography.bodyLarge,
    padding: 0,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  helperText: {
    ...typography.bodySmall,
    marginTop: 2,
  },

  // Search pill
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontWeight: '500',
    padding: 0,
  },
});
