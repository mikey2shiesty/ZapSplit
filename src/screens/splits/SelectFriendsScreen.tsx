import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SelectFriendsScreenProps } from '../../types/navigation';
import { spacing, radius, typography } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { FriendSelector } from '../../components/splits';
import { useFriends } from '../../hooks/useFriends';

interface ExternalPerson {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export default function SelectFriendsScreen({ navigation, route }: SelectFriendsScreenProps) {
  const { amount, title, description } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Load real friends from Supabase
  const { friends, loading, error } = useFriends();

  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
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

  const handleContinue = () => {
    if (selectedFriendIds.length === 0 && externalPeople.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    navigation.navigate('SplitMethod', {
      amount,
      title,
      description,
      selectedFriends: selectedFriendIds,
      externalPeople: externalPeople.map(p => ({ name: p.name, email: p.email, phone: p.phone })),
    });
  };

  const totalSelected = selectedFriendIds.length + externalPeople.length;
  const isValid = totalSelected > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.gray900 }]}>Select Friends</Text>
          <Text style={[styles.pageSubtitle, { color: colors.gray500 }]}>
            Who are you splitting with?
          </Text>
        </View>

        {/* Split Details Badge */}
        <View style={[styles.splitBadge, { backgroundColor: colors.infoLight }]}>
          <Text style={[styles.splitBadgeTitle, { color: colors.gray900 }]}>{title}</Text>
          <Text style={[styles.splitBadgeAmount, { color: colors.primary }]}>
            ${amount.toFixed(2)}
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.gray500 }]}>Loading friends...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <Text style={[styles.errorHint, { color: colors.gray500 }]}>
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
            <Text style={[styles.emptyText, { color: colors.gray900 }]}>No friends yet</Text>
            <Text style={[styles.emptyHint, { color: colors.gray500 }]}>
              Add friends or tap below to add someone without the app
            </Text>
          </View>
        )}

        {/* External People List */}
        {externalPeople.length > 0 && (
          <View style={styles.externalSection}>
            <Text style={[styles.externalSectionTitle, { color: colors.gray500 }]}>
              People without the app
            </Text>
            {externalPeople.map(person => (
              <View key={person.id} style={[styles.externalPersonCard, { backgroundColor: colors.surface, borderColor: colors.gray200 }]}>
                <View style={[styles.externalAvatar, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="link" size={18} color="#F57C00" />
                </View>
                <View style={styles.externalPersonInfo}>
                  <Text style={[styles.externalPersonName, { color: colors.gray900 }]}>{person.name}</Text>
                  {person.email && (
                    <Text style={[styles.externalPersonDetail, { color: colors.gray500 }]}>{person.email}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleRemoveExternal(person.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={22} color={colors.gray400} />
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
              <Text style={[styles.modalTitle, { color: colors.gray900 }]}>Add Person</Text>
              <TouchableOpacity onPress={() => { setShowAddExternal(false); setExternalName(''); setExternalEmail(''); setExternalPhone(''); }}>
                <Ionicons name="close" size={24} color={colors.gray500} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.gray500 }]}>Name *</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.gray50, color: colors.gray900, borderColor: colors.gray200 }]}
              placeholder="Their name"
              placeholderTextColor={colors.gray400}
              value={externalName}
              onChangeText={setExternalName}
              autoFocus
            />

            <Text style={[styles.modalLabel, { color: colors.gray500 }]}>Email (optional)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.gray50, color: colors.gray900, borderColor: colors.gray200 }]}
              placeholder="Their email"
              placeholderTextColor={colors.gray400}
              value={externalEmail}
              onChangeText={setExternalEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.modalLabel, { color: colors.gray500 }]}>Phone (optional)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.gray50, color: colors.gray900, borderColor: colors.gray200 }]}
              placeholder="Their phone number"
              placeholderTextColor={colors.gray400}
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
              <Text style={[styles.modalAddButtonText, { color: externalName.trim() ? colors.surface : colors.gray400 }]}>
                Add Person
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Continue Button - Fixed at Bottom */}
      <View style={[styles.buttonContainer, { backgroundColor: colors.gray50, borderTopColor: colors.gray200 }]}>
        {totalSelected > 0 && (
          <Text style={[styles.selectedCount, { color: colors.primary }]}>
            {totalSelected} {totalSelected === 1 ? 'person' : 'people'} selected
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            !isValid && { backgroundColor: colors.gray200 }
          ]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.continueButtonText,
            { color: colors.surface },
            !isValid && { color: colors.gray400 }
          ]}>
            Continue
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  pageTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  splitBadge: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitBadgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  splitBadgeAmount: {
    fontSize: 18,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
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
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
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
