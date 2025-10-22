import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SelectFriendsScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { FriendSelector, Friend } from '../../components/splits';

export default function SelectFriendsScreen({ navigation, route }: SelectFriendsScreenProps) {
  const { amount, title, description } = route.params;

  // Mock friends data (Phase 5 will load from Supabase)
  const mockFriends: Friend[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', avatar_url: undefined },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar_url: undefined },
    { id: '3', name: 'Alice Johnson', email: 'alice@example.com', avatar_url: undefined },
    { id: '4', name: 'Bob Wilson', email: 'bob@example.com', avatar_url: undefined },
    { id: '5', name: 'Emma Davis', email: 'emma@example.com', avatar_url: undefined },
    { id: '6', name: 'Michael Brown', email: 'michael@example.com', avatar_url: undefined },
  ];

  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleContinue = () => {
    if (selectedFriendIds.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    navigation.navigate('SplitMethod', {
      amount,
      title,
      description,
      selectedFriends: selectedFriendIds,
    });
  };

  const isValid = selectedFriendIds.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Select Friends</Text>
          <Text style={styles.pageSubtitle}>
            Who are you splitting with?
          </Text>
        </View>

        {/* Split Details Badge */}
        <View style={styles.splitBadge}>
          <Text style={styles.splitBadgeTitle}>{title}</Text>
          <Text style={styles.splitBadgeAmount}>
            ${amount.toFixed(2)}
          </Text>
        </View>

        {/* Friend Selector */}
        <View style={styles.friendSelectorContainer}>
          <FriendSelector
            friends={mockFriends}
            selectedFriendIds={selectedFriendIds}
            onToggleFriend={handleToggleFriend}
          />
        </View>
      </View>

      {/* Continue Button - Fixed at Bottom */}
      <View style={styles.buttonContainer}>
        {selectedFriendIds.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedFriendIds.length} friend{selectedFriendIds.length > 1 ? 's' : ''} selected
          </Text>
        )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
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
    textAlign: 'center',
  },
  splitBadge: {
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitBadgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  splitBadgeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  friendSelectorContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
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
