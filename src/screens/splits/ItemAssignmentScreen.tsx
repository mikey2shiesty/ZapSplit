import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { ItemAssignmentScreenProps } from '../../types/navigation';
import { ReceiptItem } from '../../types/receipt';
import {
  ItemAssignments,
  TaxTipMethod,
  calculateFinalTotals,
  areAllItemsAssigned,
  getUnassignedItems,
  calculateIndividualAmount,
  getPersonBreakdown,
  formatCurrency,
} from '../../utils/splitCalculations';

export default function ItemAssignmentScreen({ navigation, route }: ItemAssignmentScreenProps) {
  const { receipt, selectedFriends } = route.params;

  // State: Item assignments { itemId: [userId1, userId2, ...] }
  const [assignments, setAssignments] = useState<ItemAssignments>({});

  // State: Tax/Tip distribution method
  const [taxTipMethod, setTaxTipMethod] = useState<TaxTipMethod>('proportional');

  // Get user IDs
  const userIds = selectedFriends.map((f) => f.id);

  // Calculate final totals for each person
  const finalTotals = calculateFinalTotals(
    receipt.items,
    assignments,
    receipt.tax,
    receipt.tip,
    userIds,
    taxTipMethod
  );

  // Check if all items are assigned
  const allItemsAssigned = areAllItemsAssigned(receipt.items, assignments);
  const unassignedItems = getUnassignedItems(receipt.items, assignments);

  /**
   * Toggle assignment of a friend to an item
   */
  const toggleAssignment = (itemId: string, userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setAssignments((prev) => {
      const currentAssignments = prev[itemId] || [];
      const isAssigned = currentAssignments.includes(userId);

      if (isAssigned) {
        // Remove user from item
        return {
          ...prev,
          [itemId]: currentAssignments.filter((id) => id !== userId),
        };
      } else {
        // Add user to item
        return {
          ...prev,
          [itemId]: [...currentAssignments, userId],
        };
      }
    });
  };

  /**
   * Handle continue button press
   */
  const handleContinue = () => {
    if (!allItemsAssigned) {
      Alert.alert(
        'Unassigned Items',
        `${unassignedItems.length} item(s) haven't been assigned to anyone. Please assign all items before continuing.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // TODO: Phase 8.4 - Save to database and continue to payment
    Alert.alert(
      'Item Assignment Complete!',
      'Phase 8.4 (Database Integration) coming next!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Who ordered what?</Text>
          <Text style={styles.headerSubtitle}>
            {receipt.items.length} items • {selectedFriends.length} people
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Check off who ordered each item. Shared items will be split automatically!
          </Text>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          {receipt.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              friends={selectedFriends}
              assignments={assignments[item.id] || []}
              onToggle={(userId) => toggleAssignment(item.id, userId)}
            />
          ))}
        </View>

        {/* Tax & Tip Distribution */}
        {(receipt.tax > 0 || receipt.tip > 0) && (
          <View style={styles.taxTipCard}>
            <Text style={styles.taxTipTitle}>Tax & Tip Distribution</Text>
            <View style={styles.taxTipAmounts}>
              <View style={styles.taxTipRow}>
                <Text style={styles.taxTipLabel}>Tax:</Text>
                <Text style={styles.taxTipValue}>{formatCurrency(receipt.tax)}</Text>
              </View>
              <View style={styles.taxTipRow}>
                <Text style={styles.taxTipLabel}>Tip:</Text>
                <Text style={styles.taxTipValue}>{formatCurrency(receipt.tip)}</Text>
              </View>
            </View>

            <View style={styles.methodOptions}>
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  taxTipMethod === 'proportional' && styles.methodOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setTaxTipMethod('proportional');
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radio,
                    taxTipMethod === 'proportional' && styles.radioActive,
                  ]}
                >
                  {taxTipMethod === 'proportional' && (
                    <View style={styles.radioDot} />
                  )}
                </View>
                <View style={styles.methodText}>
                  <Text style={styles.methodLabel}>Proportional</Text>
                  <Text style={styles.methodDescription}>
                    Based on what each person ordered
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodOption,
                  taxTipMethod === 'equal' && styles.methodOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setTaxTipMethod('equal');
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.radio, taxTipMethod === 'equal' && styles.radioActive]}
                >
                  {taxTipMethod === 'equal' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.methodText}>
                  <Text style={styles.methodLabel}>Split Equally</Text>
                  <Text style={styles.methodDescription}>
                    Same amount for everyone
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Totals Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          {selectedFriends.map((friend) => {
            const breakdown = getPersonBreakdown(
              friend.id,
              receipt.items,
              assignments,
              receipt.tax,
              receipt.tip,
              userIds,
              taxTipMethod
            );

            return (
              <View key={friend.id} style={styles.personRow}>
                <View style={styles.personInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {friend.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.personDetails}>
                    <Text style={styles.personName}>{friend.name}</Text>
                    <Text style={styles.personBreakdown}>
                      Items: {formatCurrency(breakdown.subtotal)} • Tax:{' '}
                      {formatCurrency(breakdown.tax)} • Tip:{' '}
                      {formatCurrency(breakdown.tip)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.personTotal}>{formatCurrency(breakdown.total)}</Text>
              </View>
            );
          })}

          <View style={styles.divider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(receipt.total)}
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {!allItemsAssigned && (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={styles.warningText}>
              {unassignedItems.length} item(s) need to be assigned
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !allItemsAssigned && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!allItemsAssigned}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Item Card Component
interface ItemCardProps {
  item: ReceiptItem;
  friends: Array<{ id: string; name: string }>;
  assignments: string[];
  onToggle: (userId: string) => void;
}

function ItemCard({ item, friends, assignments, onToggle }: ItemCardProps) {
  const numberOfPeople = assignments.length;
  const amountPerPerson =
    numberOfPeople > 0
      ? calculateIndividualAmount(item.price, item.quantity, numberOfPeople)
      : 0;

  return (
    <View style={styles.itemCard}>
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

      <View style={styles.checkboxContainer}>
        {friends.map((friend) => {
          const isSelected = assignments.includes(friend.id);

          return (
            <TouchableOpacity
              key={friend.id}
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              onPress={() => onToggle(friend.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkboxBox,
                  isSelected && styles.checkboxBoxSelected,
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={colors.surface} />
                )}
              </View>
              <Text
                style={[
                  styles.checkboxLabel,
                  isSelected && styles.checkboxLabelSelected,
                ]}
              >
                {friend.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {numberOfPeople > 0 && (
        <View style={styles.splitInfo}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.splitText}>
            {numberOfPeople === 1
              ? `${friends.find((f) => f.id === assignments[0])?.name} pays ${formatCurrency(amountPerPerson)}`
              : `Split ${numberOfPeople} ways → ${formatCurrency(amountPerPerson)} each`}
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
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  checkboxLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.xs,
  },
  splitText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  taxTipCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.low,
  },
  taxTipTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  taxTipAmounts: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  taxTipRow: {
    flex: 1,
  },
  taxTipLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  taxTipValue: {
    ...typography.h5,
    color: colors.text,
  },
  methodOptions: {
    gap: spacing.sm,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  methodOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  methodText: {
    flex: 1,
  },
  methodLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  methodDescription: {
    ...typography.caption,
    color: colors.textSecondary,
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
  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h6,
    color: colors.primary,
    fontWeight: '700',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  personBreakdown: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  personTotal: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '700',
  },
  grandTotalValue: {
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
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
    fontSize: 18,
  },
});
