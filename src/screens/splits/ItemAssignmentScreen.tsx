import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { ItemAssignmentScreenProps } from '../../types/navigation';
import { ReceiptItem } from '../../types/receipt';
import { formatCurrency } from '../../utils/splitCalculations';
import { createReceiptSplit } from '../../services/splitService';
import { createSplitItems, createUserItemAssignments } from '../../services/itemService';
import { uploadReceiptToStorage } from '../../services/receiptService';
import { supabase } from '../../services/supabase';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/common/Avatar';

interface FriendData {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

interface ItemAssignments {
  [itemId: string]: string[]; // itemId -> array of user IDs who ordered this item
}

export default function ItemAssignmentScreen({ navigation, route }: ItemAssignmentScreenProps) {
  const { receipt, imageUri, selectedFriends } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { allFriends } = useFriends();

  const [assignments, setAssignments] = useState<ItemAssignments>({});
  const [saving, setSaving] = useState(false);
  const [participants, setParticipants] = useState<FriendData[]>([]);

  // Build participants list (current user + selected friends)
  useEffect(() => {
    const friendsData = selectedFriends
      .map(id => allFriends.find(f => f.id === id))
      .filter((f): f is NonNullable<typeof f> => f !== undefined)
      .map(f => ({
        id: f.id,
        full_name: f.full_name || 'Unknown',
        email: f.email,
        avatar_url: f.avatar_url,
      }));

    // Add current user at the beginning
    const currentUser: FriendData = {
      id: user?.id || 'current-user',
      full_name: 'You',
      email: user?.email || '',
      avatar_url: undefined,
    };

    setParticipants([currentUser, ...friendsData]);
  }, [allFriends, selectedFriends, user]);

  // Calculate totals for each participant
  const calculateParticipantTotals = () => {
    const totals: { [userId: string]: { subtotal: number; tax: number; tip: number; total: number } } = {};

    // Initialize totals for all participants
    participants.forEach(p => {
      totals[p.id] = { subtotal: 0, tax: 0, tip: 0, total: 0 };
    });

    // Calculate item subtotals
    receipt.items.forEach(item => {
      const assignedTo = assignments[item.id] || [];
      if (assignedTo.length > 0) {
        const sharePerPerson = item.price / assignedTo.length;
        assignedTo.forEach(userId => {
          if (totals[userId]) {
            totals[userId].subtotal += sharePerPerson;
          }
        });
      }
    });

    // Calculate tax and tip proportionally
    const totalAssignedSubtotal = Object.values(totals).reduce((sum, t) => sum + t.subtotal, 0);

    if (totalAssignedSubtotal > 0) {
      participants.forEach(p => {
        const proportion = totals[p.id].subtotal / totalAssignedSubtotal;
        totals[p.id].tax = receipt.tax * proportion;
        totals[p.id].tip = receipt.tip * proportion;
        totals[p.id].total = totals[p.id].subtotal + totals[p.id].tax + totals[p.id].tip;
      });
    }

    return totals;
  };

  const participantTotals = calculateParticipantTotals();

  // Toggle assignment of an item to a participant
  const toggleAssignment = (itemId: string, userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setAssignments(prev => {
      const current = prev[itemId] || [];
      if (current.includes(userId)) {
        // Remove user from item
        return {
          ...prev,
          [itemId]: current.filter(id => id !== userId),
        };
      } else {
        // Add user to item
        return {
          ...prev,
          [itemId]: [...current, userId],
        };
      }
    });
  };

  // Quick assign: select all items for a participant
  const assignAllToParticipant = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setAssignments(prev => {
      const newAssignments = { ...prev };
      receipt.items.forEach(item => {
        const current = newAssignments[item.id] || [];
        if (!current.includes(userId)) {
          newAssignments[item.id] = [...current, userId];
        }
      });
      return newAssignments;
    });
  };

  // Check if any items are assigned
  const hasAssignments = Object.values(assignments).some(arr => arr.length > 0);

  // Handle continue
  const handleContinue = async () => {
    if (!hasAssignments) {
      Alert.alert(
        'No Items Assigned',
        'Please assign at least one item to someone.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSaving(true);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');

      // 1. Upload receipt image to storage
      const receiptImageUrl = await uploadReceiptToStorage(imageUri, currentUser.id);

      // 2. Build participants data for the split
      const participantsData = participants
        .filter(p => participantTotals[p.id]?.total > 0)
        .map(p => ({
          user_id: p.id,
          amount_owed: participantTotals[p.id].total,
        }));

      // 3. Create the split record
      const splitData = {
        title: receipt.merchant || 'Receipt Split',
        description: receipt.date ? `Receipt from ${receipt.date}` : undefined,
        total_amount: receipt.total,
        currency: 'USD',
        split_method: 'receipt' as const,
        participants: participantsData,
        image_url: receiptImageUrl,
        receipt_data: {
          subtotal: receipt.subtotal,
          tax: receipt.tax,
          tip: receipt.tip,
        },
      };

      const split = await createReceiptSplit(splitData, receipt.items, []);

      // 4. Create split items in database
      const splitItems = await createSplitItems(split.id, receipt.items);

      // 5. Create item assignments for each participant
      // Convert assignments to the format expected by createUserItemAssignments
      for (const participant of participants) {
        const userSelections: { [itemId: string]: { selected: boolean; splitWith?: number } } = {};

        receipt.items.forEach(item => {
          const assignedTo = assignments[item.id] || [];
          if (assignedTo.includes(participant.id)) {
            userSelections[item.id] = {
              selected: true,
              splitWith: assignedTo.length,
            };
          }
        });

        if (Object.keys(userSelections).length > 0) {
          await createUserItemAssignments(participant.id, splitItems, receipt.items, userSelections);
        }
      }

      // Success! Navigate to success screen
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.navigate('SplitSuccess', {
        splitId: split.id,
        amount: receipt.total,
        participantCount: participants.filter(p => participantTotals[p.id]?.total > 0).length,
        splitMethod: 'receipt',
      });
    } catch (error: any) {
      console.error('Error saving split:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Error',
        error.message || 'Failed to save split. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Assign Items</Text>
          <Text style={styles.headerSubtitle}>
            Tap items to assign to each person
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Participants Summary */}
        <View style={styles.participantsCard}>
          <Text style={styles.sectionTitle}>Splitting with</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participantsList}>
            {participants.map((participant) => (
              <TouchableOpacity
                key={participant.id}
                style={styles.participantChip}
                onPress={() => assignAllToParticipant(participant.id)}
              >
                <Avatar
                  name={participant.full_name}
                  uri={participant.avatar_url ?? undefined}
                  size="sm"
                />
                <View style={styles.participantChipInfo}>
                  <Text style={styles.participantChipName} numberOfLines={1}>
                    {participant.full_name}
                  </Text>
                  <Text style={styles.participantChipTotal}>
                    {formatCurrency(participantTotals[participant.id]?.total || 0)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Tap on person chips below each item to assign who ordered it. Shared items split the cost.
          </Text>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          {receipt.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              participants={participants}
              assignedTo={assignments[item.id] || []}
              onToggleAssignment={(userId) => toggleAssignment(item.id, userId)}
            />
          ))}
        </View>

        {/* Summary by Person */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          {participants.map((participant) => {
            const totals = participantTotals[participant.id];
            if (!totals || totals.total === 0) return null;

            return (
              <View key={participant.id} style={styles.summaryRow}>
                <View style={styles.summaryPerson}>
                  <Avatar
                    name={participant.full_name}
                    uri={participant.avatar_url ?? undefined}
                    size="xs"
                  />
                  <Text style={styles.summaryPersonName}>{participant.full_name}</Text>
                </View>
                <Text style={styles.summaryPersonTotal}>
                  {formatCurrency(totals.total)}
                </Text>
              </View>
            );
          })}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Receipt Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(receipt.total)}</Text>
          </View>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!hasAssignments || saving) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!hasAssignments || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <>
              <ActivityIndicator size="small" color={colors.surface} />
              <Text style={[styles.continueButtonText, { marginLeft: spacing.sm }]}>
                Creating split...
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.continueButtonText}>
                Create Split
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Item Card Component
interface ItemCardProps {
  item: ReceiptItem;
  participants: FriendData[];
  assignedTo: string[];
  onToggleAssignment: (userId: string) => void;
}

function ItemCard({ item, participants, assignedTo, onToggleAssignment }: ItemCardProps) {
  const sharePerPerson = assignedTo.length > 0 ? item.price / assignedTo.length : 0;

  return (
    <View style={styles.itemCard}>
      {/* Item Header */}
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          {item.quantity > 1 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{item.quantity}x</Text>
            </View>
          )}
          <Text style={styles.itemName}>{item.name}</Text>
        </View>
        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
      </View>

      {/* Participant Assignment Chips */}
      <View style={styles.assignmentContainer}>
        <Text style={styles.assignmentLabel}>Who ordered this?</Text>
        <View style={styles.assignmentChips}>
          {participants.map((participant) => {
            const isAssigned = assignedTo.includes(participant.id);
            return (
              <TouchableOpacity
                key={participant.id}
                style={[
                  styles.assignmentChip,
                  isAssigned && styles.assignmentChipActive,
                ]}
                onPress={() => onToggleAssignment(participant.id)}
                activeOpacity={0.7}
              >
                <Avatar
                  name={participant.full_name}
                  uri={participant.avatar_url ?? undefined}
                  size="xs"
                />
                <Text
                  style={[
                    styles.assignmentChipText,
                    isAssigned && styles.assignmentChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {participant.full_name === 'You' ? 'Me' : participant.full_name.split(' ')[0]}
                </Text>
                {isAssigned && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Share Info */}
      {assignedTo.length > 0 && (
        <View style={styles.shareInfo}>
          <Ionicons name="calculator-outline" size={14} color={colors.success} />
          <Text style={styles.shareText}>
            {formatCurrency(sharePerPerson)} each
            {assignedTo.length > 1 && ` (split ${assignedTo.length} ways)`}
          </Text>
        </View>
      )}
    </View>
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
  },
  participantsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.low,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  participantsList: {
    flexDirection: 'row',
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  participantChipInfo: {
    gap: 2,
  },
  participantChipName: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    maxWidth: 80,
  },
  participantChipTotal: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.info,
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
  },
  itemCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.low,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
  },
  quantityText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  itemName: {
    ...typography.h6,
    color: colors.text,
    flex: 1,
  },
  itemPrice: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '700',
  },
  assignmentContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  assignmentLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  assignmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  assignmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  assignmentChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  assignmentChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    maxWidth: 60,
  },
  assignmentChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  shareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.xs,
  },
  shareText: {
    ...typography.caption,
    color: colors.success,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.medium,
  },
  summaryTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryPersonName: {
    ...typography.body,
    color: colors.text,
  },
  summaryPersonTotal: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    ...shadows.medium,
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray400,
    ...shadows.none,
  },
  continueButtonText: {
    ...typography.button,
    color: colors.surface,
    fontSize: 16,
  },
});
