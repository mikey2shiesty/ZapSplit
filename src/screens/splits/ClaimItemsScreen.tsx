import React, { useState, useEffect, useMemo } from 'react';
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
import * as Haptics from 'expo-haptics';
import { ClaimItemsScreenProps } from '../../types/navigation';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabase';
import { getSplitItems, SplitItem } from '../../services/itemService';
import { getSplitById, SplitWithParticipants } from '../../services/splitService';

interface ItemClaim {
  id: string;
  item_index: number;
  item_name: string;
  item_amount: number;
  claimed_by_email: string;
  claimed_by_name: string;
  claimed_by_user_id: string | null;
  share_count: number;
  quantity_claimed?: number;
}

export default function ClaimItemsScreen({ navigation, route }: ClaimItemsScreenProps) {
  const { splitId: initialSplitId, paymentLinkCode } = route.params;
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [splitId, setSplitId] = useState<string | null>(initialSplitId || null);
  const [split, setSplit] = useState<SplitWithParticipants | null>(null);
  const [items, setItems] = useState<SplitItem[]>([]);
  const [claims, setClaims] = useState<ItemClaim[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [sharedItems, setSharedItems] = useState<Map<number, number>>(new Map());
  const [selectedQuantities, setSelectedQuantities] = useState<Map<number, number>>(new Map()); // Track qty claimed per item
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; full_name: string } | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [initialSplitId, paymentLinkCode]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', user.id)
          .single();
        if (profile) {
          setCurrentUser(profile);
        }
      }

      // Resolve splitId from payment link code if needed
      let resolvedSplitId: string | null = initialSplitId || null;
      if (!resolvedSplitId && paymentLinkCode) {
        const { data: paymentLink, error: linkError } = await supabase
          .from('payment_links')
          .select('split_id')
          .eq('short_code', paymentLinkCode)
          .eq('is_active', true)
          .single();

        if (linkError || !paymentLink) {
          Alert.alert('Error', 'Invalid or expired payment link');
          navigation.goBack();
          return;
        }
        resolvedSplitId = paymentLink.split_id;
        setSplitId(resolvedSplitId);
      }

      if (!resolvedSplitId) {
        Alert.alert('Error', 'No split ID provided');
        navigation.goBack();
        return;
      }

      // Load split details
      const splitData = await getSplitById(resolvedSplitId);
      setSplit(splitData);

      // Check if current user is the creator
      if (user && splitData) {
        setIsCreator(user.id === splitData.creator_id);
      }

      // Load items
      const itemsData = await getSplitItems(resolvedSplitId);
      setItems(itemsData);

      // Load existing claims
      const { data: claimsData } = await supabase
        .from('item_claims')
        .select('*')
        .eq('split_id', resolvedSplitId);

      if (claimsData) {
        setClaims(claimsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Something went wrong', 'Couldn\'t load the split. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Service fee: must match the create-payment-intent edge function and
  // stripeService.calculateFees -> fee = (1.05 + 0.0175 * amount) / 0.9825,
  // which covers Stripe processing (1.75% + $0.30) and nets ~$0.75/transaction.
  const calculateServiceFee = (amount: number) =>
    amount > 0 ? (1.05 + 0.0175 * amount) / 0.9825 : 0;

  // Calculate totals
  const { itemsTotal, serviceFee, total } = useMemo(() => {
    if (!split || items.length === 0) {
      return { itemsTotal: 0, serviceFee: 0, total: 0 };
    }

    const selectedItemsTotal = Array.from(selectedItems).reduce((sum, index) => {
      const item = items[index];
      if (!item) return sum;
      const shareCount = sharedItems.get(index) || 1;
      // Get selected quantity (default to full quantity if not specified)
      const selectedQty = selectedQuantities.get(index) || item.quantity;
      const unitPrice = item.total_price / item.quantity;
      const itemTotal = unitPrice * selectedQty;
      return sum + (itemTotal / shareCount);
    }, 0);

    // Service fee (only for non-creators and if items selected)
    const calcServiceFee = (!isCreator && selectedItemsTotal > 0)
      ? calculateServiceFee(selectedItemsTotal)
      : 0;

    const calcTotal = selectedItemsTotal + calcServiceFee;

    return {
      itemsTotal: Math.round(selectedItemsTotal * 100) / 100,
      serviceFee: Math.round(calcServiceFee * 100) / 100,
      total: Math.round(calcTotal * 100) / 100,
    };
  }, [split, items, selectedItems, sharedItems, selectedQuantities, isCreator]);

  // Get claims by item index
  const claimsByItemIndex = useMemo(() => {
    const map = new Map<number, ItemClaim[]>();
    claims.forEach(claim => {
      const existing = map.get(claim.item_index) || [];
      existing.push(claim);
      map.set(claim.item_index, existing);
    });
    return map;
  }, [claims]);

  // Check if an item is claimed by current user
  const isClaimedByMe = (index: number) => {
    const itemClaims = claimsByItemIndex.get(index) || [];
    return itemClaims.some(c => c.claimed_by_user_id === currentUser?.id);
  };

  // Calculate what user has already claimed (items only - service fee was added at payment)
  const alreadyClaimedTotal = useMemo(() => {
    if (!currentUser || !split || items.length === 0) return 0;

    let claimedItemsTotal = 0;
    claims.forEach(claim => {
      if (claim.claimed_by_user_id === currentUser.id) {
        claimedItemsTotal += claim.item_amount / (claim.share_count || 1);
      }
    });

    return Math.round(claimedItemsTotal * 100) / 100;
  }, [currentUser, split, items, claims]);

  // Count items already claimed by current user
  const myClaimedCount = useMemo(() => {
    if (!currentUser) return 0;
    return claims.filter(c => c.claimed_by_user_id === currentUser.id).length;
  }, [currentUser, claims]);

  // Handle item toggle
  const handleToggleItem = (index: number) => {
    // Don't allow selecting items already claimed by current user
    if (isClaimedByMe(index)) {
      Alert.alert('Already Claimed', 'You have already claimed this item');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        setSharedItems(prevShared => {
          const nextShared = new Map(prevShared);
          nextShared.delete(index);
          return nextShared;
        });
        setSelectedQuantities(prevQty => {
          const nextQty = new Map(prevQty);
          nextQty.delete(index);
          return nextQty;
        });
      } else {
        next.add(index);
        // Set default quantity to 1 for items with remaining qty
        const item = items[index];
        if (item) {
          const itemClaims = claimsByItemIndex.get(index) || [];
          const totalQtyClaimed = itemClaims.reduce((sum, c) => sum + (c.quantity_claimed || 1), 0);
          const qtyRemaining = Math.max(0, item.quantity - totalQtyClaimed);
          if (qtyRemaining > 0) {
            setSelectedQuantities(prevQty => {
              const nextQty = new Map(prevQty);
              nextQty.set(index, 1); // Default to claiming 1
              return nextQty;
            });
          }
        }
      }
      return next;
    });
  };

  // Handle quantity change for multi-quantity items
  const handleQuantityChange = (index: number, delta: number) => {
    const item = items[index];
    if (!item) return;

    // Calculate remaining quantity available
    const itemClaims = claimsByItemIndex.get(index) || [];
    const totalQtyClaimed = itemClaims.reduce((sum, c) => sum + (c.quantity_claimed || 1), 0);
    const qtyRemaining = Math.max(0, item.quantity - totalQtyClaimed);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuantities(prev => {
      const next = new Map(prev);
      const currentQty = prev.get(index) || 1;
      const newQty = Math.max(1, Math.min(qtyRemaining, currentQty + delta));
      next.set(index, newQty);
      return next;
    });
  };

  // Handle share toggle
  const handleToggleShared = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSharedItems(prev => {
      const next = new Map(prev);
      if (next.has(index)) {
        const current = next.get(index)!;
        if (current >= 4) {
          next.delete(index);
        } else {
          next.set(index, current + 1);
        }
      } else {
        next.set(index, 2);
      }
      return next;
    });
  };

  // Save claims and proceed to payment
  const handleContinue = async () => {
    if (selectedItems.size === 0 || !currentUser || !splitId) return;

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Prepare claims data
      const claimsData = Array.from(selectedItems).map(index => {
        const item = items[index];
        const selectedQty = selectedQuantities.get(index) || item.quantity;
        const unitPrice = item.total_price / item.quantity;
        const claimedAmount = unitPrice * selectedQty;
        return {
          split_id: splitId,
          item_index: index,
          item_name: item.name,
          item_amount: claimedAmount, // Only the amount for selected quantity
          claimed_by_email: currentUser.email,
          claimed_by_name: currentUser.full_name,
          claimed_by_user_id: currentUser.id,
          share_count: sharedItems.get(index) || 1,
          quantity_claimed: selectedQty, // Track how many were claimed
        };
      });

      // Save claims to database (use upsert to handle re-claiming)
      const { error } = await supabase
        .from('item_claims')
        .upsert(claimsData, {
          onConflict: 'split_id,item_index,claimed_by_user_id',
          ignoreDuplicates: false,
        });

      if (error) {
        throw error;
      }

      // Update participant's amount owed based on their claimed items
      const { error: updateError } = await supabase
        .from('split_participants')
        .update({ amount_owed: total })
        .eq('split_id', splitId)
        .eq('user_id', currentUser.id);

      if (updateError) {
        console.warn('Could not update participant amount:', updateError);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Creator just saves and goes back, others go to payment
      if (isCreator) {
        navigation.goBack();
      } else if (split && splitId) {
        navigation.navigate('PayScreen', {
          splitId: splitId,
          participantId: '', // Will be found in PayScreen
          recipientId: split.creator_id,
          amount: total,
        });
      }
    } catch (error: any) {
      console.error('Error saving claims:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to save your selections');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading items...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Claim Your Items</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
            Select the items you ordered
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Split Info Badge */}
        <View style={[styles.splitBadge, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.splitBadgeLeft}>
            <Ionicons name="receipt-outline" size={24} color={themeColors.primary} />
            <View style={styles.splitBadgeInfo}>
              <Text style={[styles.splitBadgeName, { color: themeColors.text }]}>{split?.title || 'Split'}</Text>
              <Text style={[styles.splitBadgeItems, { color: themeColors.textSecondary }]}>{items.length} items</Text>
            </View>
          </View>
          <Text style={[styles.splitBadgeAmount, { color: themeColors.primary }]}>
            ${split?.total_amount.toFixed(2)}
          </Text>
        </View>

        {/* Items List */}
        <View style={styles.itemsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            {selectedItems.size} of {items.length} items selected
          </Text>

          {items.map((item, index) => {
            const isSelected = selectedItems.has(index);
            const isShared = sharedItems.has(index);
            const shareCount = sharedItems.get(index) || 1;
            const itemClaims = claimsByItemIndex.get(index) || [];
            const alreadyClaimedByMe = isClaimedByMe(index);
            const hasMultipleQty = item.quantity > 1;
            const unitPrice = item.total_price / item.quantity;

            // Calculate total quantity already claimed by everyone
            const totalQtyClaimed = itemClaims.reduce((sum, c) => sum + (c.quantity_claimed || 1), 0);
            const qtyRemaining = Math.max(0, item.quantity - totalQtyClaimed);
            const isFullyClaimed = qtyRemaining === 0;

            // Selected quantity should default to remaining (not full quantity)
            const selectedQty = selectedQuantities.get(index) || Math.min(qtyRemaining, 1);
            // When item is fully claimed (or not selectable), show its actual price; otherwise the selectable portion
            const displayPrice = isFullyClaimed
              ? item.total_price
              : isShared
              ? (unitPrice * selectedQty) / shareCount
              : unitPrice * selectedQty;

            // Can select if: not fully claimed AND (not claimed by me OR has remaining qty)
            const canSelect = !isFullyClaimed && !alreadyClaimedByMe;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: themeColors.surface, borderColor: 'transparent' },
                  isSelected && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '15' },
                  (isFullyClaimed || alreadyClaimedByMe) && { opacity: 0.6 },
                ]}
                onPress={() => canSelect && handleToggleItem(index)}
                activeOpacity={0.7}
                disabled={!canSelect}
              >
                {/* Checkbox */}
                <View style={[
                  styles.checkbox,
                  { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                  isSelected && { borderColor: themeColors.primary, backgroundColor: themeColors.primary },
                  (isFullyClaimed || alreadyClaimedByMe) && { borderColor: themeColors.success, backgroundColor: themeColors.success },
                ]}>
                  {(isSelected || isFullyClaimed || alreadyClaimedByMe) && (
                    <Ionicons name={isFullyClaimed ? "lock-closed" : "checkmark"} size={16} color="#FFFFFF" />
                  )}
                </View>

                {/* Item Details */}
                <View style={styles.itemDetails}>
                  <Text style={[
                    styles.itemName,
                    { color: themeColors.text },
                    isSelected && { color: themeColors.primary },
                    alreadyClaimedByMe && { color: themeColors.textSecondary },
                  ]}>
                    {item.name}
                  </Text>
                  {hasMultipleQty && !isSelected && (
                    <Text style={[styles.itemQuantity, { color: themeColors.textSecondary }]}>x{item.quantity} (${unitPrice.toFixed(2)} each)</Text>
                  )}

                  {/* Quantity Selector - show when selected and has remaining qty > 1 */}
                  {isSelected && qtyRemaining > 1 && !alreadyClaimedByMe && (
                    <View style={styles.quantitySelector}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(index, -1);
                        }}
                        disabled={selectedQty <= 1}
                      >
                        <Ionicons
                          name="remove"
                          size={18}
                          color={selectedQty <= 1 ? colors.border : colors.primary}
                        />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{selectedQty} of {qtyRemaining} available</Text>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(index, 1);
                        }}
                        disabled={selectedQty >= qtyRemaining}
                      >
                        <Ionicons
                          name="add"
                          size={18}
                          color={selectedQty >= qtyRemaining ? colors.border : colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Show who claimed this item */}
                  {itemClaims.length > 0 && (
                    <View style={styles.claimersRow}>
                      <Ionicons name="people" size={12} color={colors.success} />
                      <Text style={styles.claimersText}>
                        {alreadyClaimedByMe
                          ? `You claimed${hasMultipleQty ? ` (${totalQtyClaimed}/${item.quantity})` : ''}`
                          : hasMultipleQty
                          ? `${totalQtyClaimed} of ${item.quantity} claimed`
                          : itemClaims.length === 1
                          ? `${itemClaims[0].claimed_by_name} claimed`
                          : `${itemClaims.length} people claimed`}
                      </Text>
                    </View>
                  )}
                  {/* Show remaining quantity available */}
                  {qtyRemaining > 0 && !alreadyClaimedByMe && itemClaims.length > 0 && (
                    <Text style={[styles.itemQuantity, { color: colors.primary }]}>
                      {qtyRemaining} still available (${(unitPrice * qtyRemaining).toFixed(2)})
                    </Text>
                  )}
                </View>

                {/* Price */}
                <View style={styles.itemPriceContainer}>
                  <Text style={[
                    styles.itemPrice,
                    { color: themeColors.text },
                    isSelected && { color: themeColors.primary },
                  ]}>
                    ${displayPrice.toFixed(2)}
                  </Text>
                  {isShared && (
                    <Text style={styles.splitIndicator}>
                      ÷{shareCount} split
                    </Text>
                  )}
                </View>

                {/* Share Button - only show when selected */}
                {isSelected && !alreadyClaimedByMe && (
                  <TouchableOpacity
                    style={[
                      styles.shareButton,
                      isShared && styles.shareButtonActive,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleShared(index);
                    }}
                  >
                    <Ionicons
                      name="people"
                      size={16}
                      color={isShared ? colors.surface : colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Payment Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        {/* Show already claimed total */}
        {myClaimedCount > 0 && selectedItems.size === 0 && (
          <View style={[styles.alreadyClaimedCard, { backgroundColor: themeColors.success + '20', borderColor: themeColors.success + '40' }]}>
            <View style={styles.alreadyClaimedHeader}>
              <Ionicons name="checkmark-circle" size={24} color={themeColors.success} />
              <Text style={[styles.alreadyClaimedTitle, { color: themeColors.success }]}>Already Claimed</Text>
            </View>
            <Text style={[styles.alreadyClaimedText, { color: themeColors.text }]}>
              You've claimed {myClaimedCount} item{myClaimedCount > 1 ? 's' : ''} totaling ${alreadyClaimedTotal.toFixed(2)}
            </Text>
          </View>
        )}

        {selectedItems.size > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: themeColors.background }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>Items</Text>
              <Text style={[styles.summaryValue, { color: themeColors.text }]}>${itemsTotal.toFixed(2)}</Text>
            </View>
            {serviceFee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>Service Fee</Text>
                <Text style={[styles.summaryValue, { color: themeColors.text }]}>${serviceFee.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: themeColors.text }]}>Your Total</Text>
              <Text style={[styles.totalValue, { color: themeColors.primary }]}>${total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {selectedItems.size > 0 ? (
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: themeColors.primary },
              saving && { backgroundColor: themeColors.border },
            ]}
            onPress={handleContinue}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={[styles.continueButtonText, { color: '#FFFFFF' }]}>
                  {isCreator ? 'Save My Items' : `Continue to Pay $${total.toFixed(2)}`}
                </Text>
                <Ionicons name={isCreator ? "checkmark" : "arrow-forward"} size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        ) : myClaimedCount > 0 ? (
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: themeColors.surface, borderColor: themeColors.primary }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.doneButtonText, { color: themeColors.primary }]}>Done</Text>
            <Ionicons name="checkmark" size={20} color={themeColors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.continueButton, { backgroundColor: themeColors.border }]}>
            <Text style={[styles.continueButtonText, { color: themeColors.textSecondary }]}>
              Select items to continue
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  splitBadge: {
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
  splitBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  splitBadgeInfo: {
    gap: spacing.xxs,
  },
  splitBadgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  splitBadgeItems: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  splitBadgeAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  itemsSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.md,
  },
  itemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  itemCardDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxDisabled: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemNameSelected: {
    color: colors.primary,
  },
  itemNameDisabled: {
    color: colors.textSecondary,
  },
  itemQuantity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  claimersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  claimersText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  itemPriceSelected: {
    color: colors.primary,
  },
  splitIndicator: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
    marginTop: 2,
  },
  shareButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  shareButtonActive: {
    backgroundColor: colors.success,
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
    letterSpacing: 0.5,
  },
  alreadyClaimedCard: {
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  alreadyClaimedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  alreadyClaimedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  alreadyClaimedText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 32,
  },
  doneButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    minWidth: 50,
    textAlign: 'center',
  },
});
