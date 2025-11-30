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
import { Ionicons } from '@expo/vector-icons';
import { SelectFriendsForReceiptScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { FriendSelector } from '../../components/splits';
import { useFriends } from '../../hooks/useFriends';

export default function SelectFriendsForReceiptScreen({
  navigation,
  route
}: SelectFriendsForReceiptScreenProps) {
  const { receipt, imageUri } = route.params;

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

    navigation.navigate('ItemAssignment', {
      receipt,
      imageUri,
      selectedFriends: selectedFriendIds,
    });
  };

  const handleSkip = () => {
    // Allow continuing without friends (solo receipt tracking)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    navigation.navigate('ItemAssignment', {
      receipt,
      imageUri,
      selectedFriends: [],
    });
  };

  const isValid = selectedFriendIds.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Who's Splitting?</Text>
          <Text style={styles.headerSubtitle}>
            Select friends to split this receipt with
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Receipt Badge */}
        <View style={styles.receiptBadge}>
          <View style={styles.receiptBadgeLeft}>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            <View style={styles.receiptBadgeInfo}>
              <Text style={styles.receiptBadgeMerchant}>
                {receipt.merchant || 'Receipt'}
              </Text>
              <Text style={styles.receiptBadgeItems}>
                {receipt.items.length} items
              </Text>
            </View>
          </View>
          <Text style={styles.receiptBadgeAmount}>
            ${receipt.total.toFixed(2)}
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
            <Ionicons name="people-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptyHint}>
              Add friends from your profile to split bills with them
            </Text>
          </View>
        )}
      </View>

      {/* Footer Buttons */}
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
            Continue with Friends
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={isValid ? colors.surface : colors.gray400}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>
            Skip - Just track my items
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h5,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  receiptBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  receiptBadgeInfo: {
    gap: spacing.xxs,
  },
  receiptBadgeMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  receiptBadgeItems: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  receiptBadgeAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  friendSelectorContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
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
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
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
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
