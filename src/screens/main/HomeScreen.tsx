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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useSplits } from '../../hooks/useSplits';
import { HomeScreenProps } from '../../types/navigation';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import GetStartedCard from '../../components/onboarding/GetStartedCard';
import RecentSplitCard from '../../components/splits/RecentSplitCard';
import ActivityItem from '../../components/activity/ActivityItem';
import { format } from 'date-fns';
import { getUnreadCount, registerForPushNotifications } from '../../services/notificationService';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuth();
  const { splits, loading, stats, refresh, hasRecentSplits, isNewUser } = useSplits();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1W');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { totalBalance, youOwe, owedToYou, recentActivityCount } = stats;

  const periods = ['1D', '1W', '1M', 'All'];

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

  return (
    <View style={styles.container}>
      {/* Coinbase-style Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowQuickActions(true);
          }}
        >
          <Ionicons name="grid-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.gray400} />
          <TextInput
            placeholder="Search splits..."
            placeholderTextColor={colors.gray400}
            style={styles.searchInput}
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
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
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
          <View style={styles.searchResultsContent}>
            {filteredSplits.length > 0 ? (
              <ScrollView style={styles.searchResultsList} keyboardShouldPersistTaps="handled">
                <Text style={styles.searchResultsHeader}>
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
                      });
                    }}
                  >
                    <View style={styles.searchResultIcon}>
                      <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultTitle} numberOfLines={1}>
                        {split.title}
                      </Text>
                      <Text style={styles.searchResultSubtitle}>
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
                <Text style={styles.noSearchResultsText}>No splits found</Text>
                <Text style={styles.noSearchResultsSubtext}>
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
          {/* Main Balance Card - Coinbase Style */}
          <View>
            <View style={styles.balanceCard}>
              {/* Huge Balance Number */}
              <Text style={styles.balanceAmount}>
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>

              {/* Owe/Owed Row */}
              <View style={styles.oweRow}>
                <View style={styles.oweItem}>
                  <View style={styles.oweHeader}>
                    <Ionicons name="trending-up" size={16} color={colors.error} />
                    <Text style={styles.oweLabel}>You owe</Text>
                  </View>
                  <Text style={[styles.oweAmount, { color: colors.error }]}>
                    ${youOwe.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.oweItem}>
                  <View style={styles.oweHeader}>
                    <Ionicons name="trending-down" size={16} color={colors.success} />
                    <Text style={styles.oweLabel}>Owed to you</Text>
                  </View>
                  <Text style={[styles.oweAmount, { color: colors.success }]}>
                    ${owedToYou.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Primary Action Buttons - Coinbase Style */}
          <View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('SplitFlow');
                }}
              >
                <Text style={styles.primaryButtonText}>Split Bill</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.secondaryButtonText}>Request</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Get Started Card - Only for new users */}
          {isNewUser && (
            <View>
              <GetStartedCard
                onInviteFriends={() => console.log('Invite friends')}
                onScanReceipt={() => console.log('Scan receipt')}
              />
            </View>
          )}

          {/* Recent Splits - Only when user has splits */}
          {hasRecentSplits && (
            <View>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Splits</Text>
                  <TouchableOpacity>
                    <Text style={styles.viewAllText}>View all</Text>
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
                        title={split.title}
                        paidCount={split.paid_count}
                        totalCount={split.participant_count}
                        amount={split.total_amount}
                        date={format(new Date(split.created_at), 'MMM d')}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          navigation.navigate('SplitFlow', {
                            screen: 'SplitDetail',
                            params: { splitId: split.id },
                          });
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Activity List */}
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity</Text>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : splits.length === 0 ? (
                /* Empty State */
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={64} color={colors.gray300} />
                  <Text style={styles.emptyStateTitle}>No activity yet</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Create your first split to get started
                  </Text>
                </View>
              ) : (
                /* Activity List */
                <View style={styles.activityList}>
                  {splits.slice(0, 10).map((split) => {
                    const userParticipant = split.participants.find(p => p.user_id === user?.id);
                    const amountOwed = userParticipant ? userParticipant.amount_owed : 0;
                    const isPaid = userParticipant?.status === 'paid';

                    return (
                      <View key={split.id} style={styles.activityRow}>
                        <View style={[styles.activityIcon, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activityTitle}>{split.title}</Text>
                          <Text style={styles.activitySubtitle}>
                            {format(new Date(split.created_at), 'MMM d, yyyy')} • {split.participant_count} people
                          </Text>
                        </View>
                        <View style={styles.activityRight}>
                          <Text style={[
                            styles.activityAmount,
                            { color: split.creator_id === user?.id ? colors.success : colors.error }
                          ]}>
                            {split.creator_id === user?.id ? '+' : '-'}${amountOwed.toFixed(2)}
                          </Text>
                          {isPaid && (
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
          <Pressable style={styles.quickActionsModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Actions</Text>
              <TouchableOpacity
                onPress={() => setShowQuickActions(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowQuickActions(false);
                  navigation.navigate('SplitFlow', { screen: 'ScanReceipt' });
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="camera" size={28} color={colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Scan Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowQuickActions(false);
                  navigation.navigate('SplitFlow');
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="add-circle" size={28} color={colors.success} />
                </View>
                <Text style={styles.quickActionLabel}>New Split</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowQuickActions(false);
                  navigation.navigate('AddFriend');
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '15' }]}>
                  <Ionicons name="person-add" size={28} color={colors.warning} />
                </View>
                <Text style={styles.quickActionLabel}>Add Friend</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowQuickActions(false);
                  navigation.navigate('CreateGroup');
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="people" size={28} color={colors.error} />
                </View>
                <Text style={styles.quickActionLabel}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  menuButton: {
    padding: spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.gray900,
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
    backgroundColor: colors.error,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: colors.textInverse,
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.gray900,
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  chartContainer: {
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  periodButtonActive: {
    backgroundColor: colors.gray100,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray500,
  },
  periodTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  oweRow: {
    flexDirection: 'row',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  oweItem: {
    flex: 1,
    gap: spacing.xs,
  },
  oweHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  oweLabel: {
    fontSize: 13,
    color: colors.gray600,
    fontWeight: '500',
  },
  oweAmount: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  divider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.gray900,
    fontSize: 16,
    fontWeight: '600',
  },
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.low,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  splitItem: {
    gap: spacing.md,
  },
  splitInfo: {
    gap: spacing.xs,
  },
  splitName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  splitDate: {
    fontSize: 14,
    color: colors.gray600,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
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
    color: colors.gray900,
  },
  splitsContainer: {
    gap: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  activityContent: {
    flex: 1,
    gap: spacing.xs,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  activitySubtitle: {
    fontSize: 14,
    color: colors.gray600,
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
    color: colors.gray700,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityList: {
    gap: spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quick Actions Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  quickActionsModal: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
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
    color: colors.gray900,
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
    backgroundColor: colors.gray50,
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
    color: colors.gray800,
    textAlign: 'center',
  },
  // Search Results Styles
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
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  searchResultsList: {
    padding: spacing.sm,
  },
  searchResultsHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray500,
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
    backgroundColor: colors.primary + '15',
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
    color: colors.gray900,
  },
  searchResultSubtitle: {
    fontSize: 13,
    color: colors.gray500,
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
    color: colors.gray700,
  },
  noSearchResultsSubtext: {
    fontSize: 14,
    color: colors.gray500,
  },
});
