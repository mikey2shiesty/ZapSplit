import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CreateSplitScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius, typography } from '../../constants/theme';
import { AmountInput } from '../../components/splits';

export default function CreateSplitScreen({ navigation }: CreateSplitScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
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

  const handleScanReceipt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ScanReceipt');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

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
          <Text style={[styles.pageTitle, { color: colors.gray900 }]}>Create Split</Text>
          <Text style={[styles.pageSubtitle, { color: colors.gray500 }]}>
            Enter the bill amount and details, or scan a receipt
          </Text>

          {/* Scan Receipt Button */}
          <TouchableOpacity
            style={[styles.scanReceiptButton, { backgroundColor: colors.surface, borderColor: colors.primary + '30', shadowColor: colors.primary }]}
            onPress={handleScanReceipt}
            activeOpacity={0.7}
          >
            <View style={[styles.scanIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.scanTextContainer}>
              <Text style={[styles.scanButtonTitle, { color: colors.gray900 }]}>Scan Receipt</Text>
              <Text style={[styles.scanButtonSubtitle, { color: colors.gray500 }]}>
                AI will automatically extract items and split the bill
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.gray200 }]} />
            <Text style={[styles.dividerText, { color: colors.gray500 }]}>or enter manually</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.gray200 }]} />
          </View>

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
            <Text style={[styles.inputLabel, { color: colors.gray500 }]}>Split Title</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.gray200 }]}>
              <TextInput
                style={[styles.textInput, { color: colors.gray900 }]}
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
              <Text style={[styles.errorText, { color: colors.error }]}>
                Title must be at least 3 characters
              </Text>
            )}
          </View>

          {/* Description Input (Optional) */}
          <View style={styles.section}>
            <Text style={[styles.inputLabel, { color: colors.gray500 }]}>
              Description <Text style={[styles.optionalLabel, { color: colors.gray400 }]}>(optional)</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.gray200 }]}>
              <TextInput
                style={[styles.textInput, styles.textArea, { color: colors.gray900 }]}
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
            <Text style={[styles.charCount, { color: colors.gray500 }]}>
              {description.length}/200
            </Text>
          </View>

          {/* Helper Text */}
          <View style={[styles.helperSection, { backgroundColor: colors.infoLight }]}>
            <Text style={[styles.helperText, { color: colors.gray900 }]}>
              You'll select friends and split method in the next steps
            </Text>
          </View>
        </ScrollView>

        {/* Continue Button - Fixed at Bottom */}
        <View style={[styles.buttonContainer, { backgroundColor: colors.gray50, borderTopColor: colors.gray200 }]}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: isValid ? colors.primary : colors.gray200 }]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.7}
          >
            <Text style={[styles.continueButtonText, { color: isValid ? colors.surface : colors.gray400 }]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: '400',
    textTransform: 'none',
  },
  inputContainer: {
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInput: {
    fontSize: 16,
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
    marginTop: spacing.xs,
  },
  charCount: {
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  helperSection: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  continueButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scanReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 2,
    marginBottom: spacing.lg,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  scanButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanButtonSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
