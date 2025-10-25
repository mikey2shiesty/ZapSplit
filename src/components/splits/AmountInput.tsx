import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography } from '../../constants/theme';

interface AmountInputProps {
  value: string;
  onChangeValue: (value: string) => void;
  label?: string;
  error?: string;
  currency?: string;
}

export default function AmountInput({
  value,
  onChangeValue,
  label = 'Amount',
  error,
  currency = '$',
}: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Format the value as currency (e.g., "12345" -> "123.45")
  const formatCurrency = (text: string): string => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '');

    if (!digits) return '0.00';

    // Convert to cents, then to dollars
    const cents = parseInt(digits, 10);
    const dollars = (cents / 100).toFixed(2);

    return dollars;
  };

  // Get the displayed value
  const displayValue = value ? formatCurrency(value) : '0.00';
  const numericValue = parseFloat(displayValue);

  const handleChangeText = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Only allow digits
    const digits = text.replace(/\D/g, '');
    onChangeValue(digits);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChangeValue('');
  };

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      {/* Large Amount Display */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Text style={[
          styles.formattedValue,
          numericValue === 0 && styles.formattedValueEmpty,
          error && styles.formattedValueError,
        ]}>
          {currency}{displayValue}
        </Text>
      </TouchableOpacity>

      {/* Tappable Input Area */}
      <TouchableOpacity
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
        activeOpacity={0.7}
        onPress={handlePress}
      >
        {/* Instruction Text */}
        <Text style={styles.instructionText}>Tap to enter amount</Text>

        {/* Clear Button */}
        {value && value !== '0' && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="backspace-outline" size={24} color={colors.gray500} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Hidden TextInput (handles keyboard) */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="numeric"
        placeholder=""
        placeholderTextColor={colors.gray300}
        selectionColor={colors.primary}
      />

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Helper Text */}
      <Text style={styles.helperText}>
        Enter the total bill amount
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
  },
  formattedValue: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginVertical: 24,
    letterSpacing: -2,
  },
  formattedValueEmpty: {
    color: colors.gray300,
  },
  formattedValueError: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    width: '100%',
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  inputContainerError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    padding: 4,
  },
  hiddenInput: {
    position: 'absolute',
    left: -9999,
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 4,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
