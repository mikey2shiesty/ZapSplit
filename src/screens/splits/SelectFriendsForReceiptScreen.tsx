import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SelectFriendsForReceiptScreenProps } from '../../types/navigation';
import { spacing, radius, typography } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { FriendSelector } from '../../components/splits';
import { useFriends } from '../../hooks/useFriends';
import { supabase } from '../../services/supabase';
import { createReceiptSplit, getOrCreatePaymentLink } from '../../services/splitService';
import { uploadReceiptToStorage } from '../../services/receiptService';

interface ExternalPerson {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export default function SelectFriendsForReceiptScreen({
  navigation,
  route
}: SelectFriendsForReceiptScreenProps) {
  const { receipt, imageUri } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Load real friends from Supabase
  const { friends, loading, error } = useFriends();

  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [externalPeople, setExternalPeople] = useState<ExternalPerson[]>([]);
  const [showAddExternal, setShowAddExternal] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [externalPhone, setExternalPhone] = useState('');

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAddExternalPerson = () => {
    if (!externalName.trim()) return;
    const newPerson: ExternalPerson = {
      id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: externalName.trim(),
      email: externalEmail.trim() || undefined,
      phone: externalPhone.trim() || undefined,
    };
    setExternalPeople(prev => [...prev, newPerson]);
    setExternalName('');
    setExternalEmail('');
    setExternalPhone('');
    setShowAddExternal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleRemoveExternal = (id: string) => {
    setExternalPeople(prev => prev.filter(p => p.id !== id));
  };

  // Create split and generate payment link (skip item assignment)
  const handleContinue = async () => {
    if (selectedFriendIds.length === 0) return;

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');

      // 1. Upload receipt image to storage
      const receiptImageUrl = await uploadReceiptToStorage(imageUri, currentUser.id);

      // 2. Build participants data - friends will claim items later, so amount_owed starts at 0
      const participantsData = [
        ...selectedFriendIds.map(friendId => ({
          user_id: friendId,
          amount_owed: 0,
        })),
        ...externalPeople.map(person => ({
          amount_owed: 0,
          external_name: person.name,
          external_email: person.email,
          external_phone: person.phone,
        })),
      ];

      // 3. Create the split record (without item assignments)
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
      // Note: createReceiptSplit already creates items internally

      // 4. Generate payment link for sharing
      const paymentLink = await getOrCreatePaymentLink(split.id, currentUser.id);

      // Success!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to success screen
      navigation.navigate('SplitSuccess', {
        splitId: split.id,
        amount: receipt.total,
        participantCount: selectedFriendIds.length + externalPeople.length,
        splitMethod: 'receipt',
        participantAmounts: [],
        paymentLink: paymentLink?.url,
      });
    } catch (error: any) {
      console.error('Error creating split:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create split. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    // Solo receipt tracking - create split just for yourself
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');

      const receiptImageUrl = await uploadReceiptToStorage(imageUri, currentUser.id);

      const splitData = {
        title: receipt.merchant || 'Receipt Split',
        description: receipt.date ? `Receipt from ${receipt.date}` : undefined,
        total_amount: receipt.total,
        currency: 'USD',
        split_method: 'receipt' as const,
        participants: [], // No other participants
        image_url: receiptImageUrl,
        receipt_data: {
          subtotal: receipt.subtotal,
          tax: receipt.tax,
          tip: receipt.tip,
        },
      };

      const split = await createReceiptSplit(splitData, receipt.items, []);
      // Note: createReceiptSplit already creates items internally, no need to call createSplitItems again

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.navigate('SplitSuccess', {
        splitId: split.id,
        amount: receipt.total,
        participantCount: 1,
        splitMethod: 'receipt',
        participantAmounts: [],
      });
    } catch (error: any) {
      console.error('Error creating split:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to create split.', [{ text: 'OK' }]);
    } finally {
      setSaving(false);
    }
  };

  const totalSelected = selectedFriendIds.length + externalPeople.length;
  const isValid = totalSelected > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Who's Splitting?</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Select friends to split this receipt with
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Receipt Badge */}
        <View style={[styles.receiptBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.receiptBadgeLeft}>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            <View style={styles.receiptBadgeInfo}>
              <Text style={[styles.receiptBadgeMerchant, { color: colors.text }]}>
                {receipt.merchant || 'Receipt'}
              </Text>
              <Text style={[styles.receiptBadgeItems, { color: colors.textSecondary }]}>
                {receipt.items.length} items
              </Text>
            </View>
          </View>
          <Text style={[styles.receiptBadgeAmount, { color: colors.primary }]}>
            ${receipt.total.toFixed(2)}
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading friends...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <Text style={[styles.errorHint, { color: colors.textSecondary }]}>
              Try adding friends from your profile first
            </Text>
          </View>
        )}

        {/* Friend Selector - Only show when friends exist */}
        {!loading && !error && friends.length > 0 && (
          <View style={styles.friendSelectorContainer}>
            <FriendSelector
              friends={friends}
              selectedFriendIds={selectedFriendIds}
              onToggleFriend={handleToggleFriend}
            />
          </View>
        )}

        {/* Empty State - Only show when no friends and no external people */}
        {!loading && !error && friends.length === 0 && externalPeople.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No friends yet</Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Add friends or tap below to add someone without the app
            </Text>
          </View>
        )}

        {/* External People List */}
        {externalPeople.length > 0 && (
          <View style={styles.externalSection}>
            <Text style={[styles.externalSectionTitle, { color: colors.textSecondary }]}>
              People without the app
            </Text>
            {externalPeople.map(person => (
              <View key={person.id} style={[styles.externalPersonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.externalAvatar, { backgroundColor: colors.warningLight }]}>
                  <Ionicons name="link" size={18} color={colors.warning} />
                </View>
                <View style={styles.externalPersonInfo}>
                  <Text style={[styles.externalPersonName, { color: colors.text }]}>{person.name}</Text>
                  {person.email && (
                    <Text style={[styles.externalPersonDetail, { color: colors.textSecondary }]}>{person.email}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleRemoveExternal(person.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add External Person Button */}
        {!loading && (
          <TouchableOpacity
            style={[styles.addExternalButton, { borderColor: colors.primary }]}
            onPress={() => setShowAddExternal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            <Text style={[styles.addExternalButtonText, { color: colors.primary }]}>
              Add someone without the app
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add External Person Modal */}
      <Modal visible={showAddExternal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Person</Text>
              <TouchableOpacity onPress={() => { setShowAddExternal(false); setExternalName(''); setExternalEmail(''); setExternalPhone(''); }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Name *</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.gray100, color: colors.text, borderColor: colors.border }]}
              placeholder="Their name"
              placeholderTextColor={colors.textTertiary}
              value={externalName}
              onChangeText={setExternalName}
              autoFocus
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Email (optional)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.gray100, color: colors.text, borderColor: colors.border }]}
              placeholder="Their email"
              placeholderTextColor={colors.textTertiary}
              value={externalEmail}
              onChangeText={setExternalEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Phone (optional)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.gray100, color: colors.text, borderColor: colors.border }]}
              placeholder="Their phone number"
              placeholderTextColor={colors.textTertiary}
              value={externalPhone}
              onChangeText={setExternalPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.modalAddButton, { backgroundColor: externalName.trim() ? colors.primary : colors.gray200 }]}
              onPress={handleAddExternalPerson}
              disabled={!externalName.trim()}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalAddButtonText, { color: externalName.trim() ? colors.surface : colors.textTertiary }]}>
                Add Person
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Footer Buttons */}
      <View style={[styles.buttonContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {totalSelected > 0 && !saving && (
          <Text style={[styles.selectedCount, { color: colors.primary }]}>
            {totalSelected} {totalSelected === 1 ? 'person' : 'people'} selected
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: isValid && !saving ? colors.primary : colors.gray200 }
          ]}
          onPress={handleContinue}
          disabled={!isValid || saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Text style={[styles.continueButtonText, { color: isValid ? colors.surface : colors.textTertiary }]}>
                Create & Share Split
              </Text>
              <Ionicons
                name="share-outline"
                size={20}
                color={isValid ? colors.surface : colors.textTertiary}
              />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={saving}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
            Skip - Just track my items
          </Text>
        </TouchableOpacity>
      </View>
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
    padding: spacing.lg,
  },
  receiptBadge: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  receiptBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  receiptBadgeInfo: {
    gap: spacing.xxs,
  },
  receiptBadgeMerchant: {
    fontSize: 16,
    fontWeight: '600',
  },
  receiptBadgeItems: {
    fontSize: 13,
  },
  receiptBadgeAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  friendSelectorContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  continueButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  externalSection: {
    marginTop: spacing.md,
  },
  externalSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  externalPersonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  externalAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  externalPersonInfo: {
    flex: 1,
  },
  externalPersonName: {
    fontSize: 15,
    fontWeight: '600',
  },
  externalPersonDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  addExternalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  addExternalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  modalInput: {
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  modalAddButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
