import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { parseReceiptWithAI } from '../../services/receiptService';
import { ParsedReceipt, ReceiptItem } from '../../types/receipt';
import { ReviewReceiptScreenProps } from '../../types/navigation';
import AIConsentModal, { hasAIConsent } from '../../components/modals/AIConsentModal';

export default function ReviewReceiptScreen({ navigation, route }: ReviewReceiptScreenProps) {
  const { imageUri } = route.params;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Check consent and parse receipt on mount
  useEffect(() => {
    checkConsentAndParse();
  }, []);

  const checkConsentAndParse = async () => {
    const hasConsent = await hasAIConsent();
    setConsentChecked(true);

    if (hasConsent) {
      parseReceipt();
    } else {
      setLoading(false);
      setShowConsentModal(true);
    }
  };

  const handleConsentAccept = () => {
    setShowConsentModal(false);
    setLoading(true);
    parseReceipt();
  };

  const handleConsentDecline = () => {
    setShowConsentModal(false);
    navigation.goBack();
  };

  const parseReceipt = async () => {
    try {
      setLoading(true);
      setError(null);

      const parsedReceipt = await parseReceiptWithAI(imageUri);
      setReceipt(parsedReceipt);

      // Show success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Failed to parse receipt:', err);
      setError(err.message || 'Failed to parse receipt');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingItemId(itemId);
  };

  const handleSaveItem = (itemId: string, name: string, price: string) => {
    if (!receipt) return;

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    const updatedItems = receipt.items.map((item) =>
      item.id === itemId ? { ...item, name, price: priceNum } : item
    );

    // Recalculate subtotal
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    setReceipt({
      ...receipt,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newSubtotal + receipt.tax + receipt.tip,
    });

    setEditingItemId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!receipt) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedItems = receipt.items.filter((item) => item.id !== itemId);

            if (updatedItems.length === 0) {
              Alert.alert('Error', 'Receipt must have at least one item');
              return;
            }

            const newSubtotal = updatedItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );

            setReceipt({
              ...receipt,
              items: updatedItems,
              subtotal: newSubtotal,
              total: newSubtotal + receipt.tax + receipt.tip,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleAddItem = () => {
    if (!receipt) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create new item with unique ID
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}`,
      name: 'New Item',
      price: 0,
      quantity: 1,
    };

    setReceipt({
      ...receipt,
      items: [...receipt.items, newItem],
    });

    // Auto-edit the new item
    setEditingItemId(newItem.id);
  };

  const handleContinue = () => {
    if (!receipt) return;

    // Validate receipt has items
    if (receipt.items.length === 0) {
      Alert.alert('No Items', 'Please add at least one item to continue');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate to friend selection first
    navigation.navigate('SelectFriendsForReceipt', {
      receipt: receipt,
      imageUri: imageUri,
    });
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AIConsentModal
          visible={showConsentModal}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing receipt with AI...</Text>
          <Text style={styles.loadingSubtext}>
            This may take a few seconds
          </Text>
        </View>
      </View>
    );
  }

  // Show consent modal if not yet checked
  if (showConsentModal) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AIConsentModal
          visible={showConsentModal}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      </View>
    );
  }

  // Error state
  if (error || !receipt) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Parse Receipt</Text>
          <Text style={styles.errorMessage}>
            {error || 'Could not extract items from the receipt image'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={parseReceipt}>
            <Ionicons name="refresh-outline" size={20} color={colors.surface} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Review Receipt</Text>
            <Text style={styles.headerSubtitle}>
              {receipt.merchant || 'Unknown Restaurant'}
            </Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {(receipt.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              Review the extracted items. Tap to edit or delete.
            </Text>
          </View>

          {/* Items List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
                <Ionicons name="add-circle" size={20} color={colors.primary} />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {receipt.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                isEditing={editingItemId === item.id}
                onEdit={() => handleEditItem(item.id)}
                onSave={handleSaveItem}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${receipt.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>${receipt.tax.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tip</Text>
              <Text style={styles.totalValue}>${receipt.tip.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>${receipt.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Looks Good - Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Item Row Component
interface ItemRowProps {
  item: ReceiptItem;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (id: string, name: string, price: string) => void;
  onDelete: () => void;
}

function ItemRow({ item, isEditing, onEdit, onSave, onDelete }: ItemRowProps) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toFixed(2));

  useEffect(() => {
    setName(item.name);
    setPrice(item.price.toFixed(2));
  }, [item]);

  if (isEditing) {
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemEditRow}>
          <TextInput
            style={styles.itemNameInput}
            value={name}
            onChangeText={setName}
            placeholder="Item name"
            autoFocus
          />
          <TextInput
            style={styles.itemPriceInput}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => onSave(item.id, name, price)}
            style={styles.saveButton}
          >
            <Ionicons name="checkmark" size={18} color={colors.surface} />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      <View style={styles.itemInfo}>
        {item.quantity > 1 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{item.quantity}x</Text>
          </View>
        )}
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
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
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.h4,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    ...typography.button,
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
  confidenceBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  confidenceText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    ...shadows.low,
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
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  itemPrice: {
    ...typography.h6,
    color: colors.text,
    flex: 1,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  itemEditRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemNameInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemPriceInput: {
    width: 100,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'right',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  saveButtonText: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '600',
  },
  totalsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.medium,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  totalValue: {
    ...typography.h6,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
  continueButtonText: {
    ...typography.button,
    color: colors.surface,
    fontSize: 18,
  },
});
