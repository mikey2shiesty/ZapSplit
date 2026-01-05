import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SelectFriendsScreenProps } from '../../types/navigation';
import { spacing, radius, typography } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { FriendSelector } from '../../components/splits';
import { useFriends } from '../../hooks/useFriends';

export default function SelectFriendsScreen({ navigation, route }: SelectFriendsScreenProps) {
  const { amount, title, description } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.gray900 }]}>Select Friends</Text>
          <Text style={[styles.pageSubtitle, { color: colors.gray500 }]}>
            Who are you splitting with?
          </Text>
        </View>

        {/* Split Details Badge */}
        <View style={[styles.splitBadge, { backgroundColor: colors.infoLight }]}>
          <Text style={[styles.splitBadgeTitle, { color: colors.gray900 }]}>{title}</Text>
          <Text style={[styles.splitBadgeAmount, { color: colors.primary }]}>
            ${amount.toFixed(2)}
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.gray500 }]}>Loading friends...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <Text style={[styles.errorHint, { color: colors.gray500 }]}>
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
            <Text style={[styles.emptyText, { color: colors.gray900 }]}>No friends yet</Text>
            <Text style={[styles.emptyHint, { color: colors.gray500 }]}>
              Add friends from your profile to start splitting bills
            </Text>
          </View>
        )}
      </View>

      {/* Continue Button - Fixed at Bottom */}
      <View style={[styles.buttonContainer, { backgroundColor: colors.gray50, borderTopColor: colors.gray200 }]}>
        {selectedFriendIds.length > 0 && (
          <Text style={[styles.selectedCount, { color: colors.primary }]}>
            {selectedFriendIds.length} friend{selectedFriendIds.length > 1 ? 's' : ''} selected
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            !isValid && { backgroundColor: colors.gray200 }
          ]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.continueButtonText,
            { color: colors.surface },
            !isValid && { color: colors.gray400 }
          ]}>
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  pageTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  splitBadge: {
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
    flex: 1,
  },
  splitBadgeAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  friendSelectorContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
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
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorHint: {
    fontSize: 14,
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
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
});
