import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useSplits } from '../../hooks/useSplits';
import { colors, spacing, radius } from '../../constants/theme';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';

type FilterType = 'all' | 'pending' | 'paid';

export default function SplitsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { splits, loading, refresh } = useSplits();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refresh();
    setRefreshing(false);
  };

  // Filter splits based on status
  const filteredSplits = splits.filter((split) => {
    if (filter === 'all') return true;

    const isCreator = split.creator_id === user?.id;
    const userParticipant = split.participants.find(p => p.user_id === user?.id);

    if (filter === 'pending') {
      if (isCreator) {
        // Show creator's splits that have unpaid participants
        return split.participants.some(p => p.status === 'pending');
      } else if (userParticipant) {
        // Show splits where user hasn't paid
        return userParticipant.status === 'pending';
      }
      return false;
    }

    if (filter === 'paid') {
      if (isCreator) {
        // Show creator's splits where all participants paid
        return split.participants.every(p => p.status === 'paid');
      } else if (userParticipant) {
        // Show splits where user has paid
        return userParticipant.status === 'paid';
      }
      return false;
    }

    return true;
  });

  const getStatusColor = (split: any) => {
    const userParticipant = split.participants.find((p: any) => p.user_id === user?.id);
    if (split.creator_id === user?.id) return colors.success;
    if (userParticipant?.status === 'paid') return colors.success;
    return colors.warning;
  };

  const getStatusText = (split: any) => {
    const userParticipant = split.participants.find((p: any) => p.user_id === user?.id);
    if (split.creator_id === user?.id) return 'You created';
    if (userParticipant?.status === 'paid') return 'Paid';
    return 'Pending';
  };

  const getUserAmount = (split: any) => {
    const userParticipant = split.participants.find((p: any) => p.user_id === user?.id);
    return userParticipant?.amount_owed || 0;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Your Splits</Text>
        <TouchableOpacity
          style={styles.newSplitButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('SplitFlow');
          }}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'paid'] as FilterType[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterTab,
              filter === filterType && styles.filterTabActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(filterType);
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterType && styles.filterTabTextActive,
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Splits List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredSplits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No splits yet' : `No ${filter} splits`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all'
                ? 'Create your first split to get started'
                : `You don't have any ${filter} splits`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('SplitFlow');
                }}
              >
                <Ionicons name="add-circle" size={20} color={colors.textInverse} />
                <Text style={styles.createButtonText}>Create Split</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.splitsList}>
            {filteredSplits.map((split) => (
              <TouchableOpacity
                key={split.id}
                style={styles.splitCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('SplitFlow', {
                    screen: 'SplitDetail',
                    params: { splitId: split.id },
                  });
                }}
              >
                <View style={styles.splitCardLeft}>
                  <View style={[styles.splitIcon, { backgroundColor: getStatusColor(split) + '20' }]}>
                    <Ionicons
                      name={split.creator_id === user?.id ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={24}
                      color={getStatusColor(split)}
                    />
                  </View>
                  <View style={styles.splitInfo}>
                    <Text style={styles.splitTitle} numberOfLines={1}>
                      {split.title}
                    </Text>
                    <Text style={styles.splitMeta}>
                      {format(new Date(split.created_at), 'MMM d, yyyy')} • {split.participant_count} people
                    </Text>
                  </View>
                </View>
                <View style={styles.splitCardRight}>
                  <Text style={[styles.splitAmount, { color: getStatusColor(split) }]}>
                    {split.creator_id === user?.id ? '+' : '-'}${getUserAmount(split).toFixed(2)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(split) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(split) }]}>
                      {getStatusText(split)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Summary Card */}
        {filteredSplits.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Splits</Text>
              <Text style={styles.summaryValue}>{filteredSplits.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>
                ${filteredSplits.reduce((sum, s) => sum + getUserAmount(s), 0).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray900,
  },
  placeholder: {
    width: 44,
  },
  newSplitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.gray100,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
  },
  filterTabTextActive: {
    color: colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray700,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.gray500,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textInverse,
  },
  splitsList: {
    gap: spacing.md,
  },
  splitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  splitCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  splitIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitInfo: {
    flex: 1,
    gap: 4,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  splitMeta: {
    fontSize: 13,
    color: colors.gray500,
  },
  splitCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  splitAmount: {
    fontSize: 17,
    fontWeight: '700',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray600,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
  },
  bottomSpacer: {
    height: 100,
  },
});
