import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CreateSplitScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { AmountInput } from '../../components/splits';

export default function CreateSplitScreen({ navigation }: CreateSplitScreenProps) {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Validation
  const amountValue = parseFloat(amount) / 100 || 0;
  const isValid = amountValue > 0 && title.trim().length >= 3;

  const handleContinue = () => {
    if (!isValid) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    navigation.navigate('SelectFriends', {
      amount: amountValue,
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Page Title */}
          <Text style={styles.pageTitle}>Create Split</Text>
          <Text style={styles.pageSubtitle}>
            Enter the bill amount and details
          </Text>

          {/* Amount Input */}
          <View style={styles.section}>
            <AmountInput
              value={amount}
              onChangeValue={setAmount}
              label="Total Amount"
              currency="$"
            />
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Split Title</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Dinner at Nobu"
                placeholderTextColor={colors.gray400}
                maxLength={50}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => {}}
              />
            </View>
            {title.trim().length > 0 && title.trim().length < 3 && (
              <Text style={styles.errorText}>
                Title must be at least 3 characters
              </Text>
            )}
          </View>

          {/* Description Input (Optional) */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>
              Description <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add details about this split..."
                placeholderTextColor={colors.gray400}
                maxLength={200}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
              />
            </View>
            <Text style={styles.charCount}>
              {description.length}/200
            </Text>
          </View>

          {/* Helper Text */}
          <View style={styles.helperSection}>
            <Text style={styles.helperText}>
              You'll select friends and split method in the next steps
            </Text>
          </View>
        </ScrollView>

        {/* Continue Button - Fixed at Bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.7}
          >
            <Text style={[styles.continueButtonText, !isValid && styles.continueButtonTextDisabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.gray400,
    textTransform: 'none',
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInput: {
    fontSize: 16,
    color: colors.text,
    padding: 0,
    minHeight: 24,
  },
  textAreaContainer: {
    paddingVertical: spacing.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: spacing.xs,
  },
  charCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  helperSection: {
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  helperText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
    letterSpacing: 0.5,
  },
  continueButtonTextDisabled: {
    color: colors.gray400,
  },
});
