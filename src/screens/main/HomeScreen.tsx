import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1W');
  const [totalBalance] = useState(0);
  const [youOwe] = useState(0);
  const [owedToYou] = useState(0);

  // Empty state - no data yet
  const balanceData: number[] = [];

  const periods = ['1D', '1W', '1M', 'All'];

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Coinbase-style Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="grid-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.gray400} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.gray400}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="gift-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
          <Ionicons name="notifications-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>
      </View>

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
          <Animated.View entering={FadeInDown.delay(100).springify()}>
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
          </Animated.View>

          {/* Primary Action Buttons - Coinbase Style */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          </Animated.View>

          {/* Activity List - Empty State */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity</Text>

              {/* Empty State */}
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={colors.gray300} />
                <Text style={styles.emptyStateTitle}>No activity yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Create your first split to get started
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
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
});
