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
import { spacing, radius } from '../../constants/theme';
import { AmountInput } from '../../components/splits';

export default function CreateSplitScreen({ navigation, route }: CreateSplitScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const groupId = route.params?.groupId;
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
      groupId,
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
            style={[styles.scanReceiptButton, { backgroundColor: colors.surface }]}
            onPress={handleScanReceipt}
            activeOpacity={0.7}
          >
            <View style={[styles.scanIconContainer, { backgroundColor: colors.primary + '12' }]}>
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.scanTextContainer}>
              <Text style={[styles.scanButtonTitle, { color: colors.gray900 }]}>Scan Receipt</Text>
              <Text style={[styles.scanButtonSubtitle, { color: colors.gray500 }]}>
                AI extracts items and splits the bill
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.gray200 }]} />
            <Text style={[styles.dividerText, { color: colors.gray400 }]}>or enter manually</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.gray200 }]} />
          </View>

          {/* Amount Input */}
          <View style={styles.amountSection}>
            <AmountInput
              value={amount}
              onChangeValue={setAmount}
              currency="$"
            />
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={[styles.inputLabel, { color: colors.gray600 }]}>Split Title</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
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
            <Text style={[styles.inputLabel, { color: colors.gray600 }]}>
              Description <Text style={[styles.optionalLabel, { color: colors.gray400 }]}>(optional)</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: colors.surface }]}>
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
            <Text style={[styles.charCount, { color: colors.gray400 }]}>
              {description.length}/200
            </Text>
          </View>

          {/* Info note */}
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.gray400} />
            <Text style={[styles.infoText, { color: colors.gray400 }]}>
              You'll select friends and split method next
            </Text>
          </View>
        </ScrollView>

        {/* Continue Button - Fixed at Bottom */}
        <View style={[styles.buttonContainer, { backgroundColor: colors.gray50 }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: isValid ? colors.primary : colors.gray200 },
            ]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.7}
          >
            <Text style={[styles.continueButtonText, { color: isValid ? '#FFFFFF' : colors.gray400 }]}>
              Continue
            </Text>
            {isValid && (
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            )}
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
    padding: 20,
    paddingBottom: spacing.xxxl,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 15,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 21,
  },
  amountSection: {
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalLabel: {
    fontSize: 11,
    fontWeight: '400',
    textTransform: 'none',
  },
  inputContainer: {
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  textInput: {
    fontSize: 16,
    padding: 0,
    minHeight: 22,
  },
  textAreaContainer: {
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
  },
  charCount: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  infoText: {
    fontSize: 13,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  continueButton: {
    borderRadius: radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: spacing.md,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scanIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTextContainer: {
    flex: 1,
    gap: 2,
  },
  scanButtonTitle: {
    fontSize: 15,
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
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
