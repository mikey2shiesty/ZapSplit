import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { useAuth } from '../../hooks/useAuth';
import { useSplits } from '../../hooks/useSplits';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import { SplitWithParticipants } from '../../services/splitService';
import Card from '../../components/common/Card';
import { SearchInput } from '../../components/common/Input';
import IconCircle from '../../components/common/IconCircle';
import MoneyText from '../../components/common/MoneyText';
import Skeleton from '../../components/common/Skeleton';

// Friendly Fintech Splits screen.
// Header → search → filter chips → summary stat → splits as rows in one card.

function getDisplayTitle(split: SplitWithParticipants, userId?: string): string {
  if (split.creator_id !== userId && split.title?.startsWith('Request to ')) {
    return `Request from ${split.creator?.full_name || 'someone'}`;
  }
  return split.title;
}

type FilterType = 'all' | 'open' | 'settled';

export default function SplitsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { splits, loading, refresh } = useSplits();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

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

  const isSettled = (split: SplitWithParticipants) => {
    const isCreator = split.creator_id === user?.id;
    const userParticipant = split.participants.find((p) => p.user_id === user?.id);
    if (isCreator) {
      return split.participants.every((p) => p.status === 'paid');
    }
    return userParticipant?.status === 'paid';
  };

  const getUserAmount = (split: SplitWithParticipants) => {
    const isCreator = split.creator_id === user?.id;
    const userParticipant = split.participants.find((p) => p.user_id === user?.id);
    if (isCreator) {
      return (
        split.amount_owed_by_others ||
        split.participants.reduce((sum, p) => sum + (p.amount_owed || 0), 0)
      );
    }
    return userParticipant?.amount_owed || 0;
  };

  const filtered = splits
    .filter((s) => {
      if (filter === 'all') return true;
      if (filter === 'open') return !isSettled(s);
      if (filter === 'settled') return isSettled(s);
      return true;
    })
    .filter((s) =>
      search.trim()
        ? s.title.toLowerCase().includes(search.toLowerCase())
        : true
    );

  const totalAmount = filtered.reduce((sum, s) => sum + getUserAmount(s), 0);

  const FILTERS: Array<{ key: FilterType; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'settled', label: 'Settled' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerSlot} />
        <Text style={[styles.title, { color: colors.text }]}>Splits</Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('SplitFlow');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
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
        {/* SEARCH */}
        <View style={styles.section}>
          <SearchInput
            placeholder="Search splits"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* FILTER CHIPS */}
        <View style={[styles.section, styles.filterRow]}>
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilter(key);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.primaryLight,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: active ? colors.textInverse : colors.primary },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SUMMARY STAT */}
        {filtered.length > 0 && (
          <View style={styles.section}>
            <Card>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                {filter === 'all'
                  ? 'Total outstanding'
                  : filter === 'open'
                  ? 'Open splits'
                  : 'Settled splits'}
              </Text>
              <View style={styles.summaryRow}>
                <MoneyText amount={totalAmount} size="large" tone="default" />
                <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.countLabel, { color: colors.primary }]}>
                    {filtered.length} {filtered.length === 1 ? 'split' : 'splits'}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* SPLITS LIST */}
        <View style={styles.section}>
          {loading && filtered.length === 0 ? (
            <Skeleton.List rows={5} />
          ) : filtered.length === 0 ? (
            <Card>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {filter === 'all'
                  ? 'No splits yet'
                  : filter === 'open'
                  ? 'Nothing open'
                  : 'Nothing settled'}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                {filter === 'all'
                  ? 'Create your first split to get started.'
                  : `You don't have any ${filter} splits.`}
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  style={[styles.primaryPill, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('SplitFlow');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
                    Create a split
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          ) : (
            <Card padding="sm">
              {filtered.map((split, i) => {
                const isCreator = split.creator_id === user?.id;
                const settled = isSettled(split);
                const amount = getUserAmount(split);
                const isLast = i === filtered.length - 1;

                return (
                  <TouchableOpacity
                    key={split.id}
                    style={[
                      styles.row,
                      !isLast && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate('SplitFlow', {
                        screen: 'SplitDetail',
                        params: { splitId: split.id },
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <IconCircle
                      name={settled ? 'checkmark' : isCreator ? 'arrow-down' : 'arrow-up'}
                      tone={settled ? 'success' : 'info'}
                    />
                    <View style={styles.rowMain}>
                      <Text
                        style={[styles.rowTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {getDisplayTitle(split, user?.id)}
                      </Text>
                      <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                        {format(new Date(split.created_at), 'MMM d')}
                        {' · '}
                        {split.participant_count}{' '}
                        {split.participant_count === 1 ? 'person' : 'people'}
                        {' · '}
                        {settled ? 'Paid' : 'Open'}
                      </Text>
                    </View>
                    <MoneyText
                      amount={amount}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerSlot: {
    width: 40,
    height: 40,
  },
  title: {
    ...typography.displayLarge,
    textAlign: 'center',
    flex: 1,
  },
  newButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  chipLabel: {
    ...typography.chip,
  },

  // Card label
  cardLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  countLabel: {
    ...typography.chip,
  },

  // Empty
  emptyTitle: {
    ...typography.displayMedium,
  },
  emptyBody: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  primaryPill: {
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  primaryPillLabel: {
    ...typography.button,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 6,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    minHeight: 76,
  },
  rowMain: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    ...typography.bodyLarge,
  },
  rowMeta: {
    ...typography.bodySmall,
  },
});
