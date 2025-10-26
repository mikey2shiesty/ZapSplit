import React, { useState } from 'react';
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
  UserItemSelections,
  calculateYourTotal,
  calculateYourItemShare,
  formatCurrency,
} from '../../utils/splitCalculations';

// Split options for the dropdown
const SPLIT_OPTIONS = [
  { value: 1, label: 'Just me' },
  { value: 2, label: 'Split between 2 people' },
  { value: 3, label: 'Split between 3 people' },
  { value: 4, label: 'Split between 4 people' },
  { value: 5, label: 'Split between 5 people' },
];

export default function ItemAssignmentScreen({ navigation, route }: ItemAssignmentScreenProps) {
  const { receipt } = route.params;

  // State: Item selections { itemId: { selected, yourQuantity?, splitWith? } }
  const [selections, setSelections] = useState<UserItemSelections>({});

  // Calculate your total
  const yourTotal = calculateYourTotal(
    receipt.items,
    selections,
    receipt.subtotal,
    receipt.tax,
    receipt.tip
  );

  /**
   * Toggle item selection
   */
  const toggleSelection = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setSelections((prev) => {
      const current = prev[itemId];

      if (current && current.selected) {
        // Deselect item
        return {
          ...prev,
          [itemId]: { selected: false, splitWith: 1 },
        };
      } else {
        // Select item with default split of 1
        return {
          ...prev,
          [itemId]: { selected: true, splitWith: 1 },
        };
      }
    });
  };

  /**
   * Update split quantity for an item (for single items)
   */
  const updateSplitQuantity = (itemId: string, splitWith: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setSelections((prev) => ({
      ...prev,
      [itemId]: {
        selected: true, // Auto-select when changing split
        splitWith,
        yourQuantity: undefined, // Clear quantity when setting split
      },
    }));
  };

  /**
   * Update your quantity for an item (for multiple items)
   */
  const updateYourQuantity = (itemId: string, yourQuantity: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setSelections((prev) => ({
      ...prev,
      [itemId]: {
        selected: true, // Auto-select when changing quantity
        yourQuantity,
        splitWith: undefined, // Clear split when setting quantity
      },
    }));
  };

  /**
   * Handle continue button press
   */
  const handleContinue = () => {
    // Check if any items selected
    const hasSelections = Object.values(selections).some((s) => s.selected);

    if (!hasSelections) {
      Alert.alert(
        'No Items Selected',
        'Please select at least one item that you ordered.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // TODO: Phase 8.4 - Save to database and continue to payment
    Alert.alert(
      'Your Total: ' + formatCurrency(yourTotal.total),
      'Phase 8.4 (Database + Payment) coming next!',
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
          <Text style={styles.headerTitle}>What did you order?</Text>
          <Text style={styles.headerSubtitle}>
            Check off your items • {receipt.items.length} total items
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Select what you ordered. If you shared an item, choose how many people split it.
          </Text>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          {receipt.items.map((item) => {
            const selection = selections[item.id] || { selected: false };
            const yourShare = selection.selected ? calculateYourItemShare(item, selection) : 0;

            return (
              <ItemCard
                key={item.id}
                item={item}
                selection={selection}
                yourShare={yourShare}
                onToggle={() => toggleSelection(item.id)}
                onChangeSplit={(splitWith) => updateSplitQuantity(item.id, splitWith)}
                onChangeQuantity={(qty) => updateYourQuantity(item.id, qty)}
              />
            );
          })}
        </View>

        {/* Your Total Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Total</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{formatCurrency(yourTotal.subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>{formatCurrency(yourTotal.tax)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tip</Text>
            <Text style={styles.summaryValue}>{formatCurrency(yourTotal.tip)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>You owe</Text>
            <Text style={styles.totalValue}>{formatCurrency(yourTotal.total)}</Text>
          </View>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            yourTotal.total === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={yourTotal.total === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            Continue to Payment • {formatCurrency(yourTotal.total)}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Item Card Component
interface ItemCardProps {
  item: ReceiptItem;
  selection: { selected: boolean; yourQuantity?: number; splitWith?: number };
  yourShare: number;
  onToggle: () => void;
  onChangeSplit: (splitWith: number) => void;
  onChangeQuantity: (quantity: number) => void;
}

function ItemCard({ item, selection, yourShare, onToggle, onChangeSplit, onChangeQuantity }: ItemCardProps) {
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

      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, selection.selected && styles.checkboxSelected]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.checkboxBox, selection.selected && styles.checkboxBoxSelected]}>
          {selection.selected && <Ionicons name="checkmark" size={18} color={colors.surface} />}
        </View>
        <Text style={[styles.checkboxLabel, selection.selected && styles.checkboxLabelSelected]}>
          I ordered this
        </Text>
      </TouchableOpacity>

      {/* Quantity/Split Selector (only show when selected) */}
      {selection.selected && (
        <View style={styles.splitContainer}>
          {item.quantity > 1 ? (
            /* Quantity Selector: For multiple items */
            <>
              <Text style={styles.splitLabel}>How many did you get?</Text>
              <View style={styles.splitOptions}>
                {Array.from({ length: item.quantity }, (_, i) => i + 1).map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={[
                      styles.splitOption,
                      selection.yourQuantity === qty && styles.splitOptionActive,
                    ]}
                    onPress={() => onChangeQuantity(qty)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.splitOptionText,
                        selection.yourQuantity === qty && styles.splitOptionTextActive,
                      ]}
                    >
                      {qty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            /* Split Selector: For single items */
            <>
              <Text style={styles.splitLabel}>Did you share this?</Text>
              <View style={styles.splitOptions}>
                {SPLIT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.splitOption,
                      selection.splitWith === option.value && styles.splitOptionActive,
                    ]}
                    onPress={() => onChangeSplit(option.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.splitOptionText,
                        selection.splitWith === option.value && styles.splitOptionTextActive,
                      ]}
                    >
                      {option.value === 1 ? 'Just me' : `${option.value}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {/* Your Share Display */}
      {selection.selected && (
        <View style={styles.shareInfo}>
          <Ionicons name="person-outline" size={14} color={colors.success} />
          <Text style={styles.shareText}>
            Your share: {formatCurrency(yourShare)}
            {item.quantity > 1 && selection.yourQuantity &&
              ` (${selection.yourQuantity} out of ${item.quantity})`}
            {item.quantity === 1 && selection.splitWith && selection.splitWith > 1 &&
              ` (split with ${selection.splitWith})`}
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
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  checkboxSelected: {
    backgroundColor: colors.primary + '08',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  checkboxLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  splitContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  splitLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  splitOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  splitOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.surface,
    minWidth: 50,
    alignItems: 'center',
  },
  splitOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  splitOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  splitOptionTextActive: {
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
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.h6,
    color: colors.text,
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
