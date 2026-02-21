import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { colors } = useTheme();

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
      {/* Large Amount Display */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.amountTouchable}>
        <Text style={[
          styles.formattedValue,
          { color: colors.gray900 },
          numericValue === 0 && { color: colors.gray300 },
          isFocused && numericValue === 0 && { color: colors.gray400 },
          error && { color: colors.error },
        ]}>
          {currency}{displayValue}
        </Text>
        {isFocused && (
          <View style={[styles.cursor, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>

      {/* Tap hint + Clear */}
      <View style={styles.controlsRow}>
        {value && value !== '0' ? (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: colors.gray100 }]}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="backspace-outline" size={18} color={colors.gray500} />
            <Text style={[styles.clearText, { color: colors.gray500 }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
            <Text style={[styles.tapHint, { color: colors.gray400 }]}>
              Tap the amount to edit
            </Text>
          </TouchableOpacity>
        )}
      </View>

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
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  amountTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formattedValue: {
    fontSize: 56,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -2,
  },
  cursor: {
    width: 2,
    height: 44,
    marginLeft: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  controlsRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 14,
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
    marginTop: 8,
  },
});
