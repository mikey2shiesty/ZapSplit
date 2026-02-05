import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ReviewSplitScreenProps } from '../../types/navigation';
import { spacing, radius, typography } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { SplitSummary, Participant } from '../../components/splits';
import { createSplit, calculateEqualSplitAmounts } from '../../services/splitService';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../hooks/useAuth';

export default function ReviewSplitScreen({ navigation, route }: ReviewSplitScreenProps) {
  const { amount, title, description, selectedFriends, splitMethod, customAmounts } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const { user } = useAuth();
  const { allFriends } = useFriends();
  const [loading, setLoading] = useState(false);

  // Build participants list from real friends
  const selectedFriendsData = selectedFriends
    .map(id => allFriends.find(f => f.id === id))
    .filter(f => f !== undefined);

  // For equal split: divide total among ALL people (friends + creator)
  // Each friend owes their share to the creator
  // For custom split: amounts are already set by user, divide only among friends
  const isEqualSplit = splitMethod === 'equal' || !splitMethod;

  // For equal split, include creator in the count for fair division
  // e.g., $78.44 with 2 people = $39.22 each, friend owes $39.22
  const equalSplitIds = isEqualSplit
    ? [...selectedFriends, user?.id || 'creator'] // Include creator for equal division
    : selectedFriends;
  const equalAmounts = calculateEqualSplitAmounts(amount, equalSplitIds);

  // Calculate amounts based on split method
  const calculateAmount = (participantId: string): number => {
    if (customAmounts) {
      return customAmounts[participantId] || 0;
    }
    // Equal split - use pre-calculated amounts for accuracy
    return equalAmounts[participantId] || 0;
  };

  // Calculate creator's share (their portion of the split)
  const creatorShare = isEqualSplit
    ? equalAmounts[user?.id || 'creator'] || 0
    : amount - Object.values(customAmounts || {}).reduce((sum, val) => sum + val, 0);

  // Build display participants list (including creator for UI)
  // Creator is shown first with highlight
  const displayParticipants: Participant[] = [
    {
      id: user?.id || 'creator',
      name: 'You',
      email: user?.email || undefined,
      amount_owed: creatorShare,
      amount_paid: creatorShare, // Creator's share is "paid" by them
      status: 'paid' as const,
    },
    ...selectedFriendsData.map(friend => ({
      id: friend!.id,
      name: friend!.full_name || 'Unknown',
      email: friend!.email,
      amount_owed: calculateAmount(friend!.id),
      amount_paid: 0,
      status: 'pending' as const,
    })),
  ];

  // Friends-only list for database (they are the ones who owe money)
  const participants: Participant[] = selectedFriendsData.map(friend => ({
    id: friend!.id,
    name: friend!.full_name || 'Unknown',
    email: friend!.email,
    amount_owed: calculateAmount(friend!.id),
    amount_paid: 0,
    status: 'pending' as const,
  }));

  const handleCreateSplit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a split');
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Prepare participants for database
      const participantsData = participants.map(p => ({
        user_id: p.id,
        amount_owed: p.amount_owed,
      }));

      // Create split in Supabase
      const split = await createSplit({
        title: title.trim(),
        description: description?.trim(),
        total_amount: amount,
        currency: 'AUD',
        split_method: splitMethod,
        participants: participantsData,
      });

      // Build participant amounts for display
      const participantAmounts = participants.map(p => ({
        name: p.name,
        amount: p.amount_owed,
      }));

      // Navigate to success screen with real split ID
      navigation.navigate('SplitSuccess', {
        splitId: split.id,
        amount,
        participantCount: participants.length,
        splitMethod,
        participantAmounts,
      });
    } catch (error) {
      console.error('Error creating split:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create split. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {/* Header with Edit button */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.pageTitle, { color: colors.gray900 }]}>Review Split</Text>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.surface }]}
              onPress={handleEdit}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.pageSubtitle, { color: colors.gray500 }]}>
            Review the details before creating
          </Text>
        </View>

        {/* Split Summary Component */}
        <View style={styles.summaryContainer}>
          <SplitSummary
            title={title}
            totalAmount={amount}
            participants={displayParticipants}
            currentUserId={user?.id || 'creator'}
            description={description}
            splitMethod={splitMethod}
            showProgress={false}
          />
        </View>
      </View>

      {/* Create Split Button - Fixed at Bottom */}
      <View style={[styles.buttonContainer, { backgroundColor: colors.gray50, borderTopColor: colors.gray200 }]}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }, loading && styles.createButtonDisabled]}
          onPress={handleCreateSplit}
          activeOpacity={0.7}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={[styles.createButtonText, { color: colors.surface }]}>
              Create Split
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.helperText, { color: colors.gray500 }]}>
          Participants will be notified after you create this split
        </Text>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pageTitle: {
    ...typography.h2,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pageSubtitle: {
    fontSize: 16,
  },
  summaryContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  createButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
