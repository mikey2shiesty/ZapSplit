import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { CreateSplitScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import { useStripeAccountStatus } from '../../hooks/useStripeAccountStatus';
import VerifyIdRequiredModal from '../../components/modals/VerifyIdRequiredModal';

// Cash App / Venmo-style amount-first split creation.
//   • Top bar: close (X) on left, scan-receipt camera icon on the right.
//   • Hero amount centered, focus-on-mount, system numeric keyboard slides in.
//   • Title + optional note rendered as compact rows beneath.
//   • Continue pill at bottom — pinned, slides with keyboard.
// Removes the old "scan card vs manual entry" tug-of-war by demoting scan to
// an icon button instead of a competing block.

export default function CreateSplitScreen({ navigation, route }: CreateSplitScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const groupId = route.params?.groupId;

  // Amount stored as digits-only string; display reformats as $X.XX (cents-mode).
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);

  const amountRef = useRef<TextInput>(null);
  const titleRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  // Gate the entire split-creation flow on Stripe payout readiness — every
  // entry point (Home, Splits FAB, FriendProfile, Scan tab) routes through
  // this screen, so checking once here covers them all.
  const stripeStatus = useStripeAccountStatus();
  const canReceive = stripeStatus.payoutsEnabled && stripeStatus.currentlyDue.length === 0;
  const [showVerifyGate, setShowVerifyGate] = useState(false);

  useEffect(() => {
    if (!stripeStatus.loading && !canReceive) {
      setShowVerifyGate(true);
    }
  }, [stripeStatus.loading, canReceive]);

  useEffect(() => {
    // Focus the amount on mount so the keypad is up immediately.
    const t = setTimeout(() => amountRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const amountValue = parseFloat(amount || '0') / 100;
  const isValid = amountValue > 0 && title.trim().length >= 3;

  // Format digits string → "$1,234.56"
  const formatted = (() => {
    const cents = parseInt(amount || '0', 10) || 0;
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  })();

  const handleAmountChange = (text: string) => {
    // Strip non-digits, cap at reasonable length (1 billion).
    const digits = text.replace(/\D/g, '').slice(0, 11);
    setAmount(digits);
    if (digits.length > (amount?.length ?? 0)) {
      Haptics.selectionAsync();
    }
  };

  const handleContinue = () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('SelectFriends', {
      amount: amountValue,
      title: title.trim(),
      description: note.trim() || undefined,
      groupId,
    });
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ScanReceipt');
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Dismiss the entire SplitFlow modal stack and return to tabs.
    const parent = navigation.getParent();
    if (parent) {
      parent.goBack();
    } else {
      navigation.goBack();
    }
  };

  const titleBorder = titleFocused ? colors.primary : colors.border;
  const titleWidth = titleFocused ? 2 : 1;
  const noteBorder = noteFocused ? colors.primary : colors.border;
  const noteWidth = noteFocused ? 2 : 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* TOP BAR — close + scan icon */}
        <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
            activeOpacity={0.7}
            hitSlop={6}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleScan}
            style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
            activeOpacity={0.7}
            hitSlop={6}
          >
            <Ionicons name="camera" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HERO AMOUNT — Cash App-style centered focus input */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => amountRef.current?.focus()}
            style={styles.amountBlock}
          >
            <Text
              style={[
                styles.amountKicker,
                { color: colors.textSecondary },
              ]}
            >
              How much?
            </Text>
            <Text
              style={[
                styles.amountValue,
                {
                  color: amountValue > 0 ? colors.text : colors.textTertiary,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatted}
            </Text>
            {/* Hidden text input that drives the amount + summons keypad. */}
            <TextInput
              ref={amountRef}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="number-pad"
              style={styles.hiddenInput}
              caretHidden
              autoFocus
              maxLength={11}
            />
          </TouchableOpacity>

          {/* TITLE ROW */}
          <View style={styles.section}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              What's this for?
            </Text>
            <TextInput
              ref={titleRef}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
              placeholder="Dinner at Nobu"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              maxLength={50}
              returnKeyType="next"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: titleBorder,
                  borderWidth: titleWidth,
                  color: colors.text,
                },
              ]}
            />
          </View>

          {/* NOTE — collapsible. Pill row to expand, then a textarea slides in. */}
          {!showNote ? (
            <TouchableOpacity
              onPress={() => {
                setShowNote(true);
                Haptics.selectionAsync();
                setTimeout(() => noteRef.current?.focus(), 100);
              }}
              activeOpacity={0.7}
              style={[
                styles.addNoteRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={[styles.addNoteLabel, { color: colors.primary }]}>
                Add a note
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.section}>
              <View style={styles.noteHeader}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Note
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowNote(false);
                    setNote('');
                  }}
                  hitSlop={8}
                >
                  <Text style={[styles.removeLabel, { color: colors.textTertiary }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                ref={noteRef}
                value={note}
                onChangeText={setNote}
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
                placeholder="Birthday dinner, paid the whole bill…"
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={200}
                style={[
                  styles.input,
                  styles.noteInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: noteBorder,
                    borderWidth: noteWidth,
                    color: colors.text,
                  },
                ]}
              />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                {note.length}/200
              </Text>
            </View>
          )}
        </ScrollView>

        {/* CONTINUE PILL — pinned bottom, lives above keyboard via KAV */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.primaryPill,
              {
                backgroundColor: isValid ? colors.primary : colors.gray100,
                opacity: isValid ? 1 : 0.6,
              },
            ]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.primaryPillLabel,
                { color: isValid ? colors.textInverse : colors.textTertiary },
              ]}
            >
              Continue
            </Text>
            {isValid && (
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Gate: dismissing without verifying pops the user back out of the flow. */}
      <VerifyIdRequiredModal
        visible={showVerifyGate}
        onClose={() => {
          setShowVerifyGate(false);
          handleClose();
        }}
        title="Verify your ID to create splits"
        message="Splits send payments to you. Before creating one, finish setting up your bank account so funds can land safely."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },

  // Hero amount block — Cash App / Venmo style.
  amountBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    marginBottom: spacing.xl,
  },
  amountKicker: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  amountValue: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '700',
    letterSpacing: -1.6,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  section: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.bodyLarge,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  noteInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  removeLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  charCount: {
    ...typography.caption,
    marginTop: 6,
    textAlign: 'right',
  },
  addNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  addNoteLabel: {
    ...typography.button,
    fontSize: 14,
  },

  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.pill,
  },
  primaryPillLabel: {
    ...typography.button,
    fontSize: 17,
    fontWeight: '700',
  },
});
