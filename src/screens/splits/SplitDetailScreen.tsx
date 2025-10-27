import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Share as RNShare,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { SplitDetailScreenProps } from '../../types/navigation';
import {
  getSplitById,
  markParticipantAsPaid,
  deleteSplit,
  generateShareMessage,
  SplitWithParticipants,
  SplitParticipant,
} from '../../services/splitService';
import { supabase } from '../../services/supabase';

export default function SplitDetailScreen({ navigation, route }: SplitDetailScreenProps) {
  const { splitId } = route.params;

  const [loading, setLoading] = useState(true);
  const [split, setSplit] = useState<SplitWithParticipants | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load split details
  useEffect(() => {
    loadSplitDetails();
    getCurrentUser();
  }, [splitId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadSplitDetails = async () => {
    try {
      setLoading(true);
      const splitData = await getSplitById(splitId);
      setSplit(splitData);
    } catch (error) {
      console.error('Error loading split:', error);
      Alert.alert('Error', 'Failed to load split details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const refreshSplitDetails = async () => {
    try {
      setRefreshing(true);
      const splitData = await getSplitById(splitId);
      setSplit(splitData);
    } catch (error) {
      console.error('Error refreshing split:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsPaid = async (participant: any) => {
    if (!split || !currentUserId) return;

    // Only creator can mark as paid
    if (split.creator_id !== currentUserId) {
      Alert.alert('Permission Denied', 'Only the creator can mark payments');
      return;
    }

    // Show confirmation
    Alert.alert(
      'Mark as Paid',
      `Mark ${participant.user?.full_name || 'participant'} as paid $${participant.amount_owed.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          style: 'default',
          onPress: async () => {
            try {
              await markParticipantAsPaid(participant.id, splitId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await refreshSplitDetails();
            } catch (error) {
              console.error('Error marking as paid:', error);
              Alert.alert('Error', 'Failed to mark as paid');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!split || !currentUserId) return;

    // Only creator can delete
    if (split.creator_id !== currentUserId) {
      Alert.alert('Permission Denied', 'Only the creator can delete this split');
      return;
    }

    // Check if any payments received
    const hasPaidParticipants = split.participants.some(p => p.status === 'paid');

    const warningMessage = hasPaidParticipants
      ? 'Some participants have already paid. Are you sure you want to delete this split?'
      : 'Delete this split? This cannot be undone.';

    Alert.alert(
      'Delete Split',
      warningMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSplit(splitId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
              // TODO: Show toast "Split deleted"
            } catch (error) {
              console.error('Error deleting split:', error);
              Alert.alert('Error', 'Failed to delete split');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!split || !currentUserId) return;

    const message = generateShareMessage(split, currentUserId);

    try {
      await RNShare.share({
        message,
        title: `Split: ${split.title}`,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading split...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!split) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Split not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCreator = currentUserId === split.creator_id;
  const isSettled = split.status === 'settled';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Split Details</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt Image (if exists) */}
        {split.image_url && (
          <View style={styles.receiptImageContainer}>
            <Image source={{ uri: split.image_url }} style={styles.receiptImage} resizeMode="cover" />
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{split.title}</Text>
            {isSettled && (
              <View style={styles.settledBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.settledBadgeText}>Settled</Text>
              </View>
            )}
          </View>

          {split.description && <Text style={styles.summaryDescription}>{split.description}</Text>}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>${split.total_amount.toFixed(2)} AUD</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Split Method</Text>
            <Text style={styles.summaryValue}>{getSplitMethodLabel(split.split_type)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Created</Text>
            <Text style={styles.summaryValue}>{formatDate(split.created_at)}</Text>
          </View>
        </View>

        {/* Participants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Participants</Text>
            <Text style={styles.sectionSubtitle}>
              {split.paid_count} of {split.participant_count} paid
            </Text>
          </View>

          {split.participants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              isCreator={isCreator}
              onMarkAsPaid={() => handleMarkAsPaid(participant)}
            />
          ))}
        </View>

        <View style={{ height: spacing.xxxl + 60 }} />
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        {/* Only creator can delete */}
        {isCreator && (
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Participant Card Component
function ParticipantCard({
  participant,
  isCreator,
  onMarkAsPaid,
}: {
  participant: any;
  isCreator: boolean;
  onMarkAsPaid: () => void;
}) {
  const isPaid = participant.status === 'paid';

  return (
    <View style={styles.participantCard}>
      <View style={styles.participantInfo}>
        {/* Avatar */}
        <View style={styles.participantAvatar}>
          {participant.user?.avatar_url ? (
            <Image source={{ uri: participant.user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {getInitials(participant.user?.full_name || 'U')}
              </Text>
            </View>
          )}
        </View>

        {/* Name and Amount */}
        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>{participant.user?.full_name || 'Unknown'}</Text>
          <Text style={styles.participantAmount}>${participant.amount_owed.toFixed(2)}</Text>
        </View>

        {/* Status or Button */}
        {isPaid ? (
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.paidBadgeText}>Paid</Text>
          </View>
        ) : (
          <>
            {isCreator && (
              <TouchableOpacity style={styles.markPaidButton} onPress={onMarkAsPaid} activeOpacity={0.7}>
                <Text style={styles.markPaidButtonText}>Mark Paid</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// Helper Functions
function getSplitMethodLabel(splitType: string): string {
  switch (splitType) {
    case 'equal':
      return 'Equal Split';
    case 'custom':
      return 'Custom Amounts';
    case 'percentage':
      return 'Percentage Split';
    case 'receipt':
      return 'Receipt Scan';
    default:
      return splitType;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  receiptImageContainer: {
    margin: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  receiptImage: {
    width: '100%',
    height: 200,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.small,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryTitle: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  settledBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  summaryDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  participantCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...typography.h3,
    color: colors.surface,
    fontWeight: '700',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  participantAmount: {
    ...typography.body,
    color: colors.textSecondary,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  paidBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  markPaidButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  markPaidButtonText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
});
