import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ReviewSplitScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { SplitSummary, Participant } from '../../components/splits';
import { createSplit, calculateEqualSplit } from '../../services/splitService';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../hooks/useAuth';

export default function ReviewSplitScreen({ navigation, route }: ReviewSplitScreenProps) {
  const { amount, title, description, selectedFriends, splitMethod, customAmounts } = route.params;

  const { user } = useAuth();
  const { allFriends } = useFriends();
  const [loading, setLoading] = useState(false);

  // Build participants list from real friends
  const selectedFriendsData = selectedFriends
    .map(id => allFriends.find(f => f.id === id))
    .filter((f): f is { id: string; full_name: string; email: string } => f !== undefined);

  // Calculate amounts based on split method
  const calculateAmount = (participantId: string): number => {
    if (customAmounts) {
      return customAmounts[participantId] || 0;
    }
    // Equal split
    return calculateEqualSplit(amount, selectedFriendsData.length + 1);
  };

  const participants: Participant[] = [
    {
      id: user?.id || 'current-user',
      name: 'You',
      email: user?.email || 'your@email.com',
      amount_owed: calculateAmount(user?.id || 'current-user'),
      amount_paid: 0,
      status: 'pending',
    },
    ...selectedFriendsData.map(friend => ({
      id: friend.id,
      name: friend.full_name || 'Unknown',
      email: friend.email,
      amount_owed: calculateAmount(friend.id),
      amount_paid: 0,
      status: 'pending' as const,
    })),
  ];

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

      // Navigate to success screen with real split ID
      navigation.navigate('SplitSuccess', {
        splitId: split.id,
        amount,
        participantCount: participants.length,
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Header with Edit button */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.pageTitle}>Review Split</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.pageSubtitle}>
            Review the details before creating
          </Text>
        </View>

        {/* Split Summary Component */}
        <View style={styles.summaryContainer}>
          <SplitSummary
            title={title}
            totalAmount={amount}
            participants={participants}
            currentUserId={user?.id || 'current-user'}
            description={description}
            splitMethod={splitMethod}
            showProgress={false}
          />
        </View>
      </View>

      {/* Create Split Button - Fixed at Bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateSplit}
          activeOpacity={0.7}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.createButtonText}>
              Create Split
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Participants will be notified after you create this split
        </Text>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.text,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.gray100,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
    letterSpacing: 0.5,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
