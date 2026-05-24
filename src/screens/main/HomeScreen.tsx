import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { useAuth } from '../../hooks/useAuth';
import { useSplits } from '../../hooks/useSplits';
import { HomeScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius, shadows } from '../../constants/theme';
import { getUnreadCount, registerForPushNotifications } from '../../services/notificationService';
import { getFriends, Friend } from '../../services/friendService';
import { createSplit, SplitWithParticipants } from '../../services/splitService';
import Card from '../../components/common/Card';
import { SearchInput } from '../../components/common/Input';
import IconCircle from '../../components/common/IconCircle';
import MoneyText from '../../components/common/MoneyText';
import Skeleton from '../../components/common/Skeleton';

// ZapSplit 2026 — Friendly Fintech Home.
// Reference: Coinbase × Public × Uber. Pill search at top, hero balance card,
// quick-actions row, activity card with rows + soft-tinted icon circles.

function getDisplayTitle(split: SplitWithParticipants, userId?: string): string {
  if (split.creator_id !== userId && split.title?.startsWith('Request to ')) {
    return `Request from ${split.creator?.full_name || 'someone'}`;
  }
  return split.title;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { splits, loading, stats, refresh, isNewUser } = useSplits();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Request modal state — same logic, re-skinned Friendly Fintech.
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestStep, setRequestStep] = useState<'select' | 'amount'>('select');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const { youOwe, owedToYou } = stats;
  const netBalance = owedToYou - youOwe;

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getUnreadCount(user.id).then(setUnreadCount);
      }
      refresh();
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refresh();
    setRefreshing(false);
  };

  const filtered = searchQuery.trim()
    ? splits.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : splits;
  const recent = filtered.slice(0, 8);

  const openRequestModal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRequestModal(true);
    setRequestStep('select');
    setSelectedFriend(null);
    setRequestAmount('');
    setRequestNote('');

    if (user?.id) {
      setLoadingFriends(true);
      try {
        const friendsData = await getFriends(user.id);
        setFriends(friendsData);
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setLoadingFriends(false);
      }
    }
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
  };

  const selectFriendForRequest = (friend: Friend) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFriend(friend);
    setRequestStep('amount');
  };

  const sendRequest = async () => {
    if (!selectedFriend || !requestAmount || !user) return;

    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount');
      return;
    }

    setSendingRequest(true);
    try {
      await createSplit({
        title: requestNote || `Request to ${selectedFriend.full_name || 'Friend'}`,
        description: requestNote || undefined,
        total_amount: amount,
        currency: 'AUD',
        split_method: 'custom',
        participants: [
          { user_id: user.id, amount_owed: 0 },
          { user_id: selectedFriend.id, amount_owed: amount },
        ],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeRequestModal();
      Alert.alert(
        'Request sent',
        `${selectedFriend.full_name} has been notified to pay you A$${amount.toFixed(2)}.`
      );
      refresh();
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TOP BAR — pill search + chart + bell */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <SearchInput
            placeholder="Search splits"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => navigation.navigate('Analytics')}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="stats-chart" size={22} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="notifications" size={22} color={colors.text} />
          {unreadCount > 0 && (
            <View style={[styles.bellDot, { backgroundColor: colors.error }]} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* HERO BALANCE CARD */}
        <View style={styles.section}>
          {loading && !refreshing && recent.length === 0 ? (
            <Skeleton.Hero />
          ) : (
            <Card>
              <View style={styles.heroLabelRow}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                  Net balance
                </Text>
                {netBalance !== 0 && (
                  <View
                    style={[
                      styles.heroPill,
                      {
                        backgroundColor:
                          netBalance > 0 ? colors.successLight : colors.errorLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={netBalance > 0 ? 'trending-up' : 'trending-down'}
                      size={12}
                      color={netBalance > 0 ? colors.success : colors.error}
                    />
                    <Text
                      style={[
                        styles.heroPillLabel,
                        {
                          color: netBalance > 0 ? colors.success : colors.error,
                        },
                      ]}
                    >
                      {netBalance > 0 ? 'Up' : 'Down'}
                    </Text>
                  </View>
                )}
              </View>
              <MoneyText
                amount={netBalance}
                size="hero"
                tone="default"
                showSign={false}
                style={{ marginTop: 4 }}
              />

              <View style={[styles.owedRow, { borderTopColor: colors.border }]}>
                <View style={styles.owedCell}>
                  <Text style={[styles.owedLabel, { color: colors.textSecondary }]}>
                    Owed to you
                  </Text>
                  <MoneyText amount={owedToYou} size="row" tone="positive" />
                </View>
                <View style={[styles.owedDivider, { backgroundColor: colors.border }]} />
                <View style={styles.owedCell}>
                  <Text style={[styles.owedLabel, { color: colors.textSecondary }]}>
                    You owe
                  </Text>
                  <MoneyText amount={youOwe} size="row" tone="negative" />
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* GET STARTED CARD — only for new users */}
        {isNewUser && (
          <View style={styles.section}>
            <Card variant="tinted">
              <Text style={[styles.tintedKicker, { color: colors.primary }]}>
                Get started
              </Text>
              <Text style={[styles.tintedTitle, { color: colors.text }]}>
                Split your first bill in seconds.
              </Text>
              <TouchableOpacity
                style={[styles.tintedCta, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('SplitFlow')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tintedCtaLabel, { color: colors.textInverse }]}>
                  Create a split
                </Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* QUICK ACTIONS — two pills side-by-side */}
        <View style={[styles.section, styles.ctaRow]}>
          <TouchableOpacity
            style={[styles.primaryPill, { flex: 1, backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('SplitFlow');
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
              Split a bill
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.softPill, { flex: 1, backgroundColor: colors.primaryLight }]}
            onPress={openRequestModal}
            activeOpacity={0.85}
          >
            <Text style={[styles.softPillLabel, { color: colors.primary }]}>
              Request
            </Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVITY CARD — rows with icon circles + amounts */}
        <View style={styles.section}>
          <View style={styles.activityHeader}>
            <Text style={[styles.activityTitle, { color: colors.text }]}>
              Activity
            </Text>
            {recent.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Splits')}
                hitSlop={8}
              >
                <Text style={[styles.viewAll, { color: colors.primary }]}>
                  View all
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && recent.length === 0 ? (
            <Skeleton.List rows={4} />
          ) : recent.length === 0 ? (
            <Card>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No activity yet.
              </Text>
              <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                {isNewUser
                  ? 'Your first split is one tap away.'
                  : 'Splits you create will appear here.'}
              </Text>
            </Card>
          ) : (
            <Card padding="sm">
              {recent.map((split, i) => {
                const isCreator = split.creator_id === user?.id;
                const userParticipant = split.participants.find(
                  (p) => p.user_id === user?.id
                );
                const displayAmount = isCreator
                  ? split.total_amount || 0
                  : userParticipant?.amount_owed || 0;
                const isPaid = userParticipant?.status === 'paid';
                const isFullyCollected =
                  isCreator && (split.amount_remaining || 0) === 0 && displayAmount > 0;
                const settled = isPaid || isFullyCollected;
                const isLast = i === recent.length - 1;

                return (
                  <TouchableOpacity
                    key={split.id}
                    style={[
                      styles.activityRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate('SplitFlow', {
                        screen: 'SplitDetail',
                        params: { splitId: split.id },
                      } as any);
                    }}
                    activeOpacity={0.7}
                  >
                    <IconCircle
                      name={settled ? 'checkmark' : 'receipt'}
                      tone={settled ? 'success' : 'info'}
                    />
                    <View style={styles.activityMain}>
                      <Text
                        style={[styles.activityRowTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {getDisplayTitle(split, user?.id)}
                      </Text>
                      <Text style={[styles.activityRowMeta, { color: colors.textSecondary }]}>
                        {format(new Date(split.created_at), 'MMM d')}
                        {' · '}
                        {split.participant_count}{' '}
                        {split.participant_count === 1 ? 'person' : 'people'}
                        {settled && ' · Paid'}
                      </Text>
                    </View>
                    <MoneyText
                      amount={displayAmount}
                      size="row"
                      tone={isCreator ? 'positive' : 'negative'}
                      showSign
                    />
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textTertiary}
                      style={{ marginLeft: spacing.sm }}
                    />
                  </TouchableOpacity>
                );
              })}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* REQUEST MODAL — Friendly Fintech sheet */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={closeRequestModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
            onPress={closeRequestModal}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.background,
                paddingTop: insets.top + spacing.sm,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={
                  requestStep === 'amount'
                    ? () => setRequestStep('select')
                    : closeRequestModal
                }
                style={[styles.modalIconButton, { backgroundColor: colors.primaryLight }]}
                hitSlop={8}
              >
                <Ionicons
                  name={requestStep === 'amount' ? 'chevron-back' : 'close'}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {requestStep === 'select' ? 'Request payment' : 'Enter amount'}
              </Text>
              <View style={styles.modalIconButton} />
            </View>

            {requestStep === 'select' ? (
              <View style={styles.modalContent}>
                {loadingFriends ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
                ) : friends.length === 0 ? (
                  <Card>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                      No friends yet.
                    </Text>
                    <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                      Add friends to send payment requests.
                    </Text>
                    <TouchableOpacity
                      style={[styles.primaryPill, { backgroundColor: colors.primary, marginTop: spacing.md }]}
                      onPress={() => {
                        closeRequestModal();
                        navigation.navigate('AddFriend');
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
                        Add friends
                      </Text>
                    </TouchableOpacity>
                  </Card>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Card padding="sm">
                      {friends.map((friend, i) => {
                        const isLast = i === friends.length - 1;
                        const friendInitial = (friend.full_name?.charAt(0) || '?').toUpperCase();
                        return (
                          <TouchableOpacity
                            key={friend.id}
                            style={[
                              styles.activityRow,
                              !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                            ]}
                            onPress={() => selectFriendForRequest(friend)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.friendAvatar,
                                { backgroundColor: colors.primary },
                              ]}
                            >
                              <Text style={[styles.friendInitial, { color: colors.textInverse }]}>
                                {friendInitial}
                              </Text>
                            </View>
                            <View style={styles.activityMain}>
                              <Text
                                style={[styles.activityRowTitle, { color: colors.text }]}
                                numberOfLines={1}
                              >
                                {friend.full_name}
                              </Text>
                              <Text
                                style={[styles.activityRowMeta, { color: colors.textSecondary }]}
                                numberOfLines={1}
                              >
                                {friend.email}
                              </Text>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={colors.textTertiary}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </Card>
                  </ScrollView>
                )}
              </View>
            ) : (
              <View style={styles.modalContent}>
                <Card>
                  <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                    Request from
                  </Text>
                  <Text style={[styles.requestSelectedName, { color: colors.text }]}>
                    {selectedFriend?.full_name}
                  </Text>

                  <View style={styles.requestAmountRow}>
                    <Text style={[styles.requestCurrency, { color: colors.textSecondary }]}>
                      A$
                    </Text>
                    <TextInput
                      style={[styles.requestAmountInput, { color: colors.text }]}
                      placeholder="0.00"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="decimal-pad"
                      value={requestAmount}
                      onChangeText={setRequestAmount}
                      autoFocus
                    />
                  </View>

                  <Text
                    style={[
                      styles.cardLabel,
                      { color: colors.textSecondary, marginTop: spacing.lg },
                    ]}
                  >
                    Note (optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.requestNoteInput,
                      {
                        color: colors.text,
                        backgroundColor: colors.gray100,
                      },
                    ]}
                    placeholder="Coffee, dinner, rent…"
                    placeholderTextColor={colors.textTertiary}
                    value={requestNote}
                    onChangeText={setRequestNote}
                    maxLength={100}
                  />
                </Card>

                <TouchableOpacity
                  style={[
                    styles.primaryPill,
                    {
                      backgroundColor: colors.primary,
                      opacity: !requestAmount || sendingRequest ? 0.4 : 1,
                      marginTop: spacing.lg,
                    },
                  ]}
                  onPress={sendRequest}
                  disabled={!requestAmount || sendingRequest}
                  activeOpacity={0.85}
                >
                  {sendingRequest ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
                      Send request
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  bellButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  // Hero balance card
  cardLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 4,
  },
  heroPillLabel: {
    ...typography.chip,
    fontSize: 11,
  },
  owedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  owedCell: {
    flex: 1,
    gap: 2,
  },
  owedDivider: {
    width: 1,
    height: 32,
    marginHorizontal: spacing.md,
  },
  owedLabel: {
    ...typography.bodySmall,
    fontWeight: '500',
  },

  // Tinted "Get started" card
  tintedKicker: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  tintedTitle: {
    ...typography.displayMedium,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  tintedCta: {
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  tintedCtaLabel: {
    ...typography.button,
  },

  // CTA row
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryPill: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPillLabel: {
    ...typography.button,
  },
  softPill: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softPillLabel: {
    ...typography.button,
  },

  // Activity card
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  activityTitle: {
    ...typography.displayLarge,
    fontSize: 22,
    lineHeight: 28,
  },
  viewAll: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 6,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    minHeight: 76,
  },
  activityMain: {
    flex: 1,
    gap: 4,
  },
  activityRowTitle: {
    ...typography.bodyLarge,
  },
  activityRowMeta: {
    ...typography.bodySmall,
  },

  // Empty state
  emptyTitle: {
    ...typography.displayMedium,
  },
  emptyBody: {
    ...typography.body,
    marginTop: spacing.xs,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    flex: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  modalIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.displayMedium,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendInitial: {
    ...typography.body,
    fontWeight: '700',
  },
  requestSelectedName: {
    ...typography.displayMedium,
    marginTop: 4,
  },
  requestAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
  },
  requestCurrency: {
    ...typography.displayMedium,
    marginRight: spacing.xs,
    marginBottom: 6,
  },
  requestAmountInput: {
    flex: 1,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
    letterSpacing: -0.8,
    padding: 0,
  },
  requestNoteInput: {
    ...typography.bodyLarge,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
});
