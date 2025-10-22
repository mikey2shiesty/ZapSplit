import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ReviewSplitScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { SplitSummary, Participant } from '../../components/splits';

export default function ReviewSplitScreen({ navigation, route }: ReviewSplitScreenProps) {
  const { amount, title, description, selectedFriends, splitMethod, customAmounts } = route.params;

  // Mock friends data
  const mockFriendsData = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: '4', name: 'Bob Wilson', email: 'bob@example.com' },
    { id: '5', name: 'Emma Davis', email: 'emma@example.com' },
    { id: '6', name: 'Michael Brown', email: 'michael@example.com' },
  ];

  // Build participants list
  const selectedFriendsData = selectedFriends
    .map(id => mockFriendsData.find(f => f.id === id))
    .filter((f): f is { id: string; name: string; email: string } => f !== undefined);

  // Calculate amounts based on split method
  const calculateAmount = (participantId: string): number => {
    if (customAmounts) {
      return customAmounts[participantId] || 0;
    }
    // Equal split
    return amount / (selectedFriendsData.length + 1);
  };

  const participants: Participant[] = [
    {
      id: 'current-user',
      name: 'You',
      email: 'your@email.com',
      amount_owed: calculateAmount('current-user'),
      amount_paid: 0,
      status: 'pending',
    },
    ...selectedFriendsData.map(friend => ({
      id: friend.id,
      name: friend.name,
      email: friend.email,
      amount_owed: calculateAmount(friend.id),
      amount_paid: 0,
      status: 'pending' as const,
    })),
  ];

  const handleCreateSplit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Phase 5 will save to Supabase
    // For now, just navigate to success screen
    navigation.navigate('SplitSuccess', {
      splitId: 'temp-' + Date.now(),
      amount,
      participantCount: participants.length,
    });
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
            currentUserId="current-user"
            description={description}
            splitMethod={splitMethod}
            showProgress={false}
          />
        </View>
      </View>

      {/* Create Split Button - Fixed at Bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateSplit}
          activeOpacity={0.7}
        >
          <Text style={styles.createButtonText}>
            Create Split
          </Text>
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
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
