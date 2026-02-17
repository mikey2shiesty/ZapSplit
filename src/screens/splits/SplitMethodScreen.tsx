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
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius, typography } from '../../constants/theme';
import { SplitMethodCard, SplitMethod } from '../../components/splits';

export default function SplitMethodScreen({ navigation, route }: SplitMethodScreenProps) {
  const { amount, title, description, selectedFriends, externalPeople } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [selectedMethod, setSelectedMethod] = useState<SplitMethod>('equal');

  // For display purposes, count includes everyone (creator + friends)
  // Friends count is used for calculating how much they owe the creator
  const externalCount = externalPeople?.length || 0;
  const friendsCount = selectedFriends.length + externalCount;
  const totalPeopleCount = friendsCount + 1; // +1 for creator

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
        externalPeople,
        splitMethod: selectedMethod,
      });
    } else {
      // For custom/percentage, go to CustomAmounts screen
      navigation.navigate('CustomAmounts', {
        amount,
        title,
        description,
        selectedFriends,
        externalPeople,
        splitMethod: selectedMethod,
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.gray900 }]}>Split Method</Text>
          <Text style={[styles.pageSubtitle, { color: colors.gray900 }]}>
            How should we split ${amount.toFixed(2)}?
          </Text>
          <Text style={[styles.participantCount, { color: colors.primary }]}>
            {totalPeopleCount} people total
          </Text>
        </View>

        {/* Split Method Cards */}
        <View style={styles.methodCardsContainer}>
          <SplitMethodCard
            method="equal"
            isSelected={selectedMethod === 'equal'}
            onSelect={() => handleMethodSelect('equal')}
            totalAmount={amount}
            participantCount={totalPeopleCount}
          />

          <SplitMethodCard
            method="custom"
            isSelected={selectedMethod === 'custom'}
            onSelect={() => handleMethodSelect('custom')}
            totalAmount={amount}
            participantCount={friendsCount}
          />

          <SplitMethodCard
            method="percentage"
            isSelected={selectedMethod === 'percentage'}
            onSelect={() => handleMethodSelect('percentage')}
            totalAmount={amount}
            participantCount={totalPeopleCount}
          />
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.infoLight }]}>
          <Text style={[styles.infoText, { color: colors.gray900 }]}>
            {selectedMethod === 'equal'
              ? '✓ Everyone pays the same amount'
              : selectedMethod === 'custom'
              ? '→ You\'ll enter specific amounts for each person'
              : '→ You\'ll assign percentages to each person'}
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at Bottom */}
      <View style={[styles.buttonContainer, { backgroundColor: colors.gray50, borderTopColor: colors.gray200 }]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.7}
        >
          <Text style={[styles.continueButtonText, { color: colors.surface }]}>
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
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  participantCount: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  methodCardsContainer: {
    marginBottom: spacing.lg,
  },
  infoSection: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoText: {
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
});
