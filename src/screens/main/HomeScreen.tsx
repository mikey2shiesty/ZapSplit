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
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useSplits } from '../../hooks/useSplits';
import { HomeScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import GetStartedCard from '../../components/onboarding/GetStartedCard';
import RecentSplitCard from '../../components/splits/RecentSplitCard';
import { format } from 'date-fns';
import { getUnreadCount, registerForPushNotifications } from '../../services/notificationService';
import { getFriends, Friend } from '../../services/friendService';
import { createSplit, SplitWithParticipants } from '../../services/splitService';

/** Show "Request from [creator]" for non-creators viewing a "Request to ..." split */
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
  const { splits, loading, stats, refresh, hasRecentSplits, isNewUser } = useSplits();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestStep, setRequestStep] = useState<'select' | 'amount'>('select');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const { totalBalance, youOwe, owedToYou } = stats;

  // Register for push notifications on mount
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  // Load unread notification count when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getUnreadCount(user.id).then(setUnreadCount);
      }
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refresh();
    setRefreshing(false);
  };

  // Filter splits based on search query
  const filteredSplits = searchQuery.trim()
    ? splits.filter(split =>
        split.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        split.total_amount.toString().includes(searchQuery)
      )
    : [];

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSearchResults(text.trim().length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Request modal functions
  const openRequestModal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    setRequestStep('select');
    setSelectedFriend(null);
    setRequestAmount('');
    setRequestNote('');
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
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
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
        'Request Sent!',
        `${selectedFriend.full_name} has been notified to pay you $${amount.toFixed(2)}`
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
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      {/* Coinbase-style Top Navigation */}
      <View style={[styles.topNav, { backgroundColor: colors.surface, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowQuickActions(true);
          }}
        >
          <Ionicons name="grid-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="search" size={18} color={colors.gray400} />
          <TextInput
            placeholder="Search splits..."
            placeholderTextColor={colors.gray400}
            style={[styles.searchInput, { color: colors.gray900 }]}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Analytics')}
        >
          <Ionicons name="stats-chart-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          {unreadCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
              <Text style={[styles.badgeText, { color: colors.textInverse }]}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
          <Ionicons name="notifications-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>
      </View>

      {/* Search Results Overlay */}
      {showSearchResults && (
        <View style={styles.searchResultsContainer}>
          <Pressable
            style={styles.searchResultsBackdrop}
            onPress={() => setShowSearchResults(false)}
          />
          <View style={[styles.searchResultsContent, { backgroundColor: colors.surface }]}>
            {filteredSplits.length > 0 ? (
              <ScrollView style={styles.searchResultsList} keyboardShouldPersistTaps="handled">
                <Text style={[styles.searchResultsHeader, { color: colors.gray500 }]}>
                  Splits ({filteredSplits.length})
                </Text>
                {filteredSplits.slice(0, 10).map((split) => (
                  <TouchableOpacity
                    key={split.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      clearSearch();
                      navigation.navigate('SplitFlow', {
                        screen: 'SplitDetail',
                        params: { splitId: split.id },
                      } as any);
                    }}
                  >
                    <View style={[styles.searchResultIcon, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.searchResultInfo}>
                      <Text style={[styles.searchResultTitle, { color: colors.gray900 }]} numberOfLines={1}>
                        {getDisplayTitle(split, user?.id)}
                      </Text>
                      <Text style={[styles.searchResultSubtitle, { color: colors.gray500 }]}>
                        ${split.total_amount.toFixed(2)} • {split.participant_count} people
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noSearchResults}>
                <Ionicons name="search-outline" size={40} color={colors.gray300} />
                <Text style={[styles.noSearchResultsText, { color: colors.gray700 }]}>No splits found</Text>
                <Text style={[styles.noSearchResultsSubtext, { color: colors.gray500 }]}>
                  Try a different search term
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          {/* Main Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
            {loading && !refreshing ? (
              <View style={styles.balanceLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <Text style={[styles.balanceAmount, { color: colors.gray900 }]}>
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            )}

            <View style={[styles.oweRow, { borderTopColor: colors.gray200 }]}>
              <View style={styles.oweItem}>
                <View style={styles.oweHeader}>
                  <Ionicons name="trending-up" size={16} color={colors.error} />
                  <Text style={[styles.oweLabel, { color: colors.gray600 }]}>You owe</Text>
                </View>
                {loading && !refreshing ? (
                  <View style={[styles.oweAmountPlaceholder, { backgroundColor: colors.gray100 }]} />
                ) : (
                  <Text style={[styles.oweAmount, { color: colors.error }]}>
                    ${youOwe.toFixed(2)}
                  </Text>
                )}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.gray200 }]} />

              <View style={styles.oweItem}>
                <View style={styles.oweHeader}>
                  <Ionicons name="trending-down" size={16} color={colors.success} />
                  <Text style={[styles.oweLabel, { color: colors.gray600 }]}>Owed to you</Text>
                </View>
                {loading && !refreshing ? (
                  <View style={[styles.oweAmountPlaceholder, { backgroundColor: colors.gray100 }]} />
                ) : (
                  <Text style={[styles.oweAmount, { color: colors.success }]}>
                    ${owedToYou.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('SplitFlow');
              }}
            >
              <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>Split Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.gray100 }]}
              onPress={openRequestModal}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.gray900 }]}>Request</Text>
            </TouchableOpacity>
          </View>

          {/* Get Started Card - Only for new users */}
          {isNewUser && (
            <GetStartedCard
              onInviteFriends={async () => {
                try {
                  await Share.share({
                    message: Platform.OS === 'ios'
                      ? 'Split bills instantly with ZapSplit! Download it here: https://zapsplit.com.au'
                      : 'Split bills instantly with ZapSplit! Download it here: https://zapsplit.com.au',
                    url: 'https://zapsplit.com.au', // iOS only - shows as link preview
                    title: 'Join me on ZapSplit',
                  });
                } catch {}
              }}
              onScanReceipt={() => navigation.navigate('SplitFlow')}
            />
          )}

          {/* Recent Splits */}
          {hasRecentSplits && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Recent Splits</Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Splits');
                  }}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <View style={styles.splitsContainer}>
                  {splits.slice(0, 5).map((split) => (
                    <RecentSplitCard
                      key={split.id}
                      title={getDisplayTitle(split, user?.id)}
                      paidCount={split.paid_count}
                      totalCount={split.participant_count}
                      amount={split.total_amount}
                      totalPaid={split.total_paid || 0}
                      amountOwedByOthers={split.amount_owed_by_others}
                      date={format(new Date(split.created_at), 'MMM d')}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('SplitFlow', {
                          screen: 'SplitDetail',
                          params: { splitId: split.id },
                        } as any);
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Activity List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Activity</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : splits.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={colors.gray300} />
                <Text style={[styles.emptyStateTitle, { color: colors.gray700 }]}>No activity yet</Text>
                <Text style={[styles.emptyStateSubtitle, { color: colors.gray500 }]}>
                  Create your first split to get started
                </Text>
              </View>
            ) : (
              <View style={styles.activityList}>
                {splits.slice(0, 10).map((split) => {
                  const isCreator = split.creator_id === user?.id;
                  const userParticipant = split.participants.find(p => p.user_id === user?.id);

                  // For creator: show total collected (what others have paid)
                  // For participant: show what they owe
                  const displayAmount = isCreator
                    ? (split.total_paid || 0)
                    : (userParticipant?.amount_owed || 0);
                  const isPaid = userParticipant?.status === 'paid';
                  const isFullyCollected = isCreator && (split.amount_remaining || 0) === 0 && displayAmount > 0;

                  return (
                    <View key={split.id} style={[styles.activityRow, { backgroundColor: colors.surface }]}>
                      <View style={[styles.activityIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityTitle, { color: colors.gray900 }]}>{getDisplayTitle(split, user?.id)}</Text>
                        <Text style={[styles.activitySubtitle, { color: colors.gray600 }]}>
                          {format(new Date(split.created_at), 'MMM d, yyyy')} • {split.participant_count} people
                        </Text>
                      </View>
                      <View style={styles.activityRight}>
                        <Text style={[
                          styles.activityAmount,
                          { color: isCreator ? colors.success : colors.error }
                        ]}>
                          {isCreator ? '+' : '-'}${displayAmount.toFixed(2)}
                        </Text>
                        {(isPaid || isFullyCollected) && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Quick Actions Modal */}
      <Modal
        visible={showQuickActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickActions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowQuickActions(false)}
        >
          <Pressable style={[styles.quickActionsModal, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.gray900 }]}>Quick Actions</Text>
              <TouchableOpacity
                onPress={() => setShowQuickActions(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: colors.gray100 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowQuickActions(false);
                  navigation.navigate('SplitFlow', { screen: 'ScanReceipt' } as any);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="camera" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.gray800 }]}>Scan Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: colors.gray100 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowQuickActions(false);
                  navigation.navigate('SplitFlow');
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="add-circle" size={28} color={colors.success} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.gray800 }]}>New Split</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: colors.gray100 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowQuickActions(false);
                  navigation.navigate('AddFriend');
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '15' }]}>
                  <Ionicons name="person-add" size={28} color={colors.warning} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.gray800 }]}>Add Friend</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: colors.gray100 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowQuickActions(false);
                  navigation.navigate('CreateGroup');
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="people" size={28} color={colors.error} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.gray800 }]}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={closeRequestModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.requestModalContainer}
        >
          <Pressable
            style={[styles.requestModalBackdrop, { backgroundColor: colors.surface }]}
            onPress={closeRequestModal}
          />
          <View style={[styles.requestModalContent, { backgroundColor: colors.surface, paddingTop: insets.top + 10 }]}>
            <View style={[styles.requestModalHeader, { borderBottomColor: colors.gray100 }]}>
              <TouchableOpacity
                onPress={requestStep === 'amount' ? () => setRequestStep('select') : closeRequestModal}
                style={styles.requestBackButton}
              >
                <Ionicons
                  name={requestStep === 'amount' ? 'arrow-back' : 'close'}
                  size={24}
                  color={colors.gray700}
                />
              </TouchableOpacity>
              <Text style={[styles.requestModalTitle, { color: colors.gray900 }]}>
                {requestStep === 'select' ? 'Request Payment' : 'Enter Amount'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {requestStep === 'select' ? (
              <View style={styles.requestStepContent}>
                <Text style={[styles.requestStepLabel, { color: colors.gray600 }]}>Select who to request from</Text>

                {loadingFriends ? (
                  <View style={styles.requestLoadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.requestLoadingText, { color: colors.gray500 }]}>Loading friends...</Text>
                  </View>
                ) : friends.length === 0 ? (
                  <View style={styles.requestEmptyState}>
                    <Ionicons name="people-outline" size={48} color={colors.gray300} />
                    <Text style={[styles.requestEmptyTitle, { color: colors.gray700 }]}>No friends yet</Text>
                    <Text style={[styles.requestEmptySubtitle, { color: colors.gray500 }]}>
                      Add some friends to send payment requests
                    </Text>
                    <TouchableOpacity
                      style={[styles.requestAddFriendButton, { backgroundColor: colors.primary + '15' }]}
                      onPress={() => {
                        closeRequestModal();
                        navigation.navigate('AddFriend');
                      }}
                    >
                      <Ionicons name="person-add" size={20} color={colors.primary} />
                      <Text style={[styles.requestAddFriendText, { color: colors.primary }]}>Add Friends</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView style={styles.requestFriendsList} showsVerticalScrollIndicator={false}>
                    {friends.map((friend) => (
                      <TouchableOpacity
                        key={friend.id}
                        style={styles.requestFriendItem}
                        onPress={() => selectFriendForRequest(friend)}
                      >
                        <View style={[styles.requestFriendAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.requestFriendInitial, { color: colors.textInverse }]}>
                            {friend.full_name?.charAt(0).toUpperCase() || '?'}
                          </Text>
                        </View>
                        <View style={styles.requestFriendInfo}>
                          <Text style={[styles.requestFriendName, { color: colors.gray900 }]}>{friend.full_name}</Text>
                          <Text style={[styles.requestFriendEmail, { color: colors.gray500 }]}>{friend.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View style={styles.requestStepContent}>
                <View style={styles.requestSelectedFriend}>
                  <View style={[styles.requestFriendAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.requestFriendInitial, { color: colors.textInverse }]}>
                      {selectedFriend?.full_name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Text style={[styles.requestSelectedName, { color: colors.gray700 }]}>
                    Request from {selectedFriend?.full_name}
                  </Text>
                </View>

                <View style={styles.requestAmountContainer}>
                  <Text style={[styles.requestCurrency, { color: colors.gray400 }]}>$</Text>
                  <TextInput
                    style={[styles.requestAmountInput, { color: colors.gray900 }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.gray300}
                    keyboardType="decimal-pad"
                    value={requestAmount}
                    onChangeText={setRequestAmount}
                    autoFocus
                  />
                </View>

                <TextInput
                  style={[styles.requestNoteInput, { backgroundColor: colors.gray100, color: colors.gray900 }]}
                  placeholder="Add a note (optional)"
                  placeholderTextColor={colors.gray400}
                  value={requestNote}
                  onChangeText={setRequestNote}
                  multiline
                  maxLength={100}
                />

                <TouchableOpacity
                  style={[
                    styles.requestSendButton,
                    { backgroundColor: colors.primary },
                    (!requestAmount || sendingRequest) && { backgroundColor: colors.gray300 },
                  ]}
                  onPress={sendRequest}
                  disabled={!requestAmount || sendingRequest}
                >
                  {sendingRequest ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={[styles.requestSendButtonText, { color: colors.textInverse }]}>Send Request</Text>
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
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  menuButton: {
    padding: spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  iconButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl + spacing.xl,
  },
  balanceCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  balanceLoading: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  oweAmountPlaceholder: {
    height: 22,
    width: 60,
    borderRadius: 4,
    marginTop: 4,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  oweRow: {
    flexDirection: 'row',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  oweItem: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'center',
  },
  oweHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  oweLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  oweAmount: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  divider: {
    width: 1,
    marginHorizontal: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  splitsContainer: {
    gap: spacing.md,
  },
  activityList: {
    gap: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    gap: spacing.xs,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  activitySubtitle: {
    fontSize: 14,
  },
  activityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search Results
  searchResultsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  searchResultsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  searchResultsContent: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    maxHeight: 400,
    overflow: 'hidden',
  },
  searchResultsList: {
    padding: spacing.sm,
  },
  searchResultsHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  searchResultIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInfo: {
    flex: 1,
    gap: 2,
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchResultSubtitle: {
    fontSize: 13,
  },
  noSearchResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  noSearchResultsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noSearchResultsSubtext: {
    fontSize: 14,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  quickActionsModal: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
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
  modalCloseButton: {
    padding: spacing.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionItem: {
    width: '47%',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Request Modal
  requestModalContainer: {
    flex: 1,
  },
  requestModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  requestModalContent: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
  },
  requestModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  requestBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  requestStepContent: {
    flex: 1,
    padding: spacing.lg,
  },
  requestStepLabel: {
    fontSize: 15,
    marginBottom: spacing.md,
  },
  requestLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  requestLoadingText: {
    fontSize: 14,
  },
  requestEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  requestEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  requestEmptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  requestAddFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  requestAddFriendText: {
    fontSize: 15,
    fontWeight: '600',
  },
  requestFriendsList: {
    flex: 1,
  },
  requestFriendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  requestFriendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestFriendInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  requestFriendInfo: {
    flex: 1,
    gap: 2,
  },
  requestFriendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestFriendEmail: {
    fontSize: 13,
  },
  requestSelectedFriend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    justifyContent: 'center',
  },
  requestSelectedName: {
    fontSize: 16,
    fontWeight: '500',
  },
  requestAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  requestCurrency: {
    fontSize: 48,
    fontWeight: '300',
  },
  requestAmountInput: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 150,
    textAlign: 'center',
  },
  requestNoteInput: {
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    marginBottom: spacing.lg,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  requestSendButton: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestSendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
