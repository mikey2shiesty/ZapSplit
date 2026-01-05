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
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius, typography, shadows } from '../../constants/theme';
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
  const { colors } = useTheme();

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

    // Calculate item subtotals (using line total = price × quantity)
    receipt.items.forEach(item => {
      const assignedTo = assignments[item.id] || [];
      if (assignedTo.length > 0) {
        const lineTotal = item.price * item.quantity;
        const sharePerPerson = lineTotal / assignedTo.length;
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

      // Build participant amounts for display (include everyone)
      const participantAmounts = participants
        .filter(p => participantTotals[p.id]?.total > 0)
        .map(p => ({
          name: p.full_name,
          amount: participantTotals[p.id].total,
        }));

      navigation.navigate('SplitSuccess', {
        splitId: split.id,
        amount: receipt.total,
        participantCount: participants.filter(p => participantTotals[p.id]?.total > 0).length,
        splitMethod: 'receipt',
        participantAmounts,
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.gray900 }]}>Assign Items</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Tap items to assign to each person
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Participants Summary */}
        <View style={[styles.participantsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Splitting with</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participantsList}>
            {participants.map((participant) => (
              <TouchableOpacity
                key={participant.id}
                style={[styles.participantChip, { backgroundColor: colors.gray50 }]}
                onPress={() => assignAllToParticipant(participant.id)}
              >
                <Avatar
                  name={participant.full_name}
                  uri={participant.avatar_url ?? undefined}
                  size="sm"
                />
                <View style={styles.participantChipInfo}>
                  <Text style={[styles.participantChipName, { color: colors.gray900 }]} numberOfLines={1}>
                    {participant.full_name}
                  </Text>
                  <Text style={[styles.participantChipTotal, { color: colors.primary }]}>
                    {formatCurrency(participantTotals[participant.id]?.total || 0)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.infoLight }]}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.info }]}>
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
              colors={colors}
            />
          ))}
        </View>

        {/* Summary by Person */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryTitle, { color: colors.gray900 }]}>Summary</Text>
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
                  <Text style={[styles.summaryPersonName, { color: colors.gray900 }]}>{participant.full_name}</Text>
                </View>
                <Text style={[styles.summaryPersonTotal, { color: colors.gray900 }]}>
                  {formatCurrency(totals.total)}
                </Text>
              </View>
            );
          })}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.gray900 }]}>Receipt Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(receipt.total)}</Text>
          </View>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            (!hasAssignments || saving) && [styles.continueButtonDisabled, { backgroundColor: colors.gray400 }],
          ]}
          onPress={handleContinue}
          disabled={!hasAssignments || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <>
              <ActivityIndicator size="small" color={colors.surface} />
              <Text style={[styles.continueButtonText, { marginLeft: spacing.sm, color: colors.surface }]}>
                Creating split...
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.continueButtonText, { color: colors.surface }]}>
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
  colors: any;
}

function ItemCard({ item, participants, assignedTo, onToggleAssignment, colors }: ItemCardProps) {
  const lineTotal = item.price * item.quantity;
  const sharePerPerson = assignedTo.length > 0 ? lineTotal / assignedTo.length : 0;

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.surface }]}>
      {/* Item Header */}
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          {item.quantity > 1 && (
            <View style={[styles.quantityBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.quantityText, { color: colors.primary }]}>{item.quantity}x</Text>
            </View>
          )}
          <Text style={[styles.itemName, { color: colors.gray900 }]}>{item.name}</Text>
        </View>
        {item.quantity > 1 ? (
          <View style={styles.priceContainer}>
            <Text style={[styles.unitPrice, { color: colors.textSecondary }]}>{formatCurrency(item.price)} ea</Text>
            <Text style={[styles.itemPrice, { color: colors.gray900 }]}>{formatCurrency(lineTotal)}</Text>
          </View>
        ) : (
          <Text style={[styles.itemPrice, { color: colors.gray900 }]}>{formatCurrency(item.price)}</Text>
        )}
      </View>

      {/* Participant Assignment Chips */}
      <View style={[styles.assignmentContainer, { borderTopColor: colors.gray200 }]}>
        <Text style={[styles.assignmentLabel, { color: colors.textSecondary }]}>Who ordered this?</Text>
        <View style={styles.assignmentChips}>
          {participants.map((participant) => {
            const isAssigned = assignedTo.includes(participant.id);
            return (
              <TouchableOpacity
                key={participant.id}
                style={[
                  styles.assignmentChip,
                  { borderColor: colors.gray300, backgroundColor: colors.surface },
                  isAssigned && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
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
                    { color: colors.textSecondary },
                    isAssigned && { color: colors.primary, fontWeight: '700' },
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
        <View style={[styles.shareInfo, { borderTopColor: colors.gray200 }]}>
          <Ionicons name="calculator-outline" size={14} color={colors.success} />
          <Text style={[styles.shareText, { color: colors.success }]}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
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
  },
  headerSubtitle: {
    ...typography.bodySmall,
    marginTop: spacing.xxs,
  },
  content: {
    flex: 1,
  },
  participantsCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.low,
  },
  sectionTitle: {
    ...typography.h6,
    marginBottom: spacing.sm,
  },
  participantsList: {
    flexDirection: 'row',
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
    maxWidth: 80,
  },
  participantChipTotal: {
    ...typography.caption,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
  },
  itemCard: {
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
  },
  quantityText: {
    ...typography.caption,
    fontWeight: '600',
  },
  itemName: {
    ...typography.h6,
    flex: 1,
  },
  itemPrice: {
    ...typography.h6,
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  unitPrice: {
    ...typography.caption,
    marginBottom: 2,
  },
  assignmentContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  assignmentLabel: {
    ...typography.caption,
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
    gap: spacing.xs,
  },
  assignmentChipText: {
    ...typography.caption,
    fontWeight: '600',
    maxWidth: 60,
  },
  shareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  shareText: {
    ...typography.caption,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  summaryCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.medium,
  },
  summaryTitle: {
    ...typography.h5,
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
  },
  summaryPersonTotal: {
    ...typography.h6,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.h5,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.h4,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    ...shadows.medium,
  },
  continueButtonDisabled: {
    ...shadows.none,
  },
  continueButtonText: {
    ...typography.button,
    fontSize: 16,
  },
});
