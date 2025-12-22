import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SplitMethodScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { SplitMethodCard, SplitMethod } from '../../components/splits';

export default function SplitMethodScreen({ navigation, route }: SplitMethodScreenProps) {
  const { amount, title, description, selectedFriends } = route.params;
  const insets = useSafeAreaInsets();

  const [selectedMethod, setSelectedMethod] = useState<SplitMethod>('equal');

  // Total participants = only the friends who owe money (creator is NOT a participant)
  const participantCount = selectedFriends.length;

  const handleMethodSelect = (method: SplitMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMethod(method);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (selectedMethod === 'equal') {
      // For equal split, go straight to review
      navigation.navigate('ReviewSplit', {
        amount,
        title,
        description,
        selectedFriends,
        splitMethod: selectedMethod,
      });
    } else {
      // For custom/percentage, go to CustomAmounts screen
      navigation.navigate('CustomAmounts', {
        amount,
        title,
        description,
        selectedFriends,
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Split Method</Text>
          <Text style={styles.pageSubtitle}>
            How should we split ${amount.toFixed(2)}?
          </Text>
          <Text style={styles.participantCount}>
            {participantCount} people total
          </Text>
        </View>

        {/* Split Method Cards */}
        <View style={styles.methodCardsContainer}>
          <SplitMethodCard
            method="equal"
            isSelected={selectedMethod === 'equal'}
            onSelect={() => handleMethodSelect('equal')}
            totalAmount={amount}
            participantCount={participantCount}
          />

          <SplitMethodCard
            method="custom"
            isSelected={selectedMethod === 'custom'}
            onSelect={() => handleMethodSelect('custom')}
            totalAmount={amount}
            participantCount={participantCount}
          />

          <SplitMethodCard
            method="percentage"
            isSelected={selectedMethod === 'percentage'}
            onSelect={() => handleMethodSelect('percentage')}
            totalAmount={amount}
            participantCount={participantCount}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            {selectedMethod === 'equal'
              ? '✓ Everyone pays the same amount'
              : selectedMethod === 'custom'
              ? '→ You\'ll enter specific amounts for each person'
              : '→ You\'ll assign percentages to each person'}
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at Bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.7}
        >
          <Text style={styles.continueButtonText}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  participantCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  methodCardsContainer: {
    marginBottom: spacing.lg,
  },
  infoSection: {
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoText: {
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
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
    letterSpacing: 0.5,
  },
});
