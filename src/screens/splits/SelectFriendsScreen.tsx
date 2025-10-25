import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SelectFriendsScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { FriendSelector } from '../../components/splits';
import { useFriends } from '../../hooks/useFriends';

export default function SelectFriendsScreen({ navigation, route }: SelectFriendsScreenProps) {
  const { amount, title, description } = route.params;

  // Load real friends from Supabase
  const { friends, loading, error } = useFriends();

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

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading friends...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Try adding friends from your profile first
            </Text>
          </View>
        )}

        {/* Friend Selector - Only show when friends exist */}
        {!loading && !error && friends.length > 0 && (
          <View style={styles.friendSelectorContainer}>
            <FriendSelector
              friends={friends}
              selectedFriendIds={selectedFriendIds}
              onToggleFriend={handleToggleFriend}
            />
          </View>
        )}

        {/* Empty State - Only show when no friends */}
        {!loading && !error && friends.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptyHint}>
              Add friends from your profile to start splitting bills
            </Text>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
