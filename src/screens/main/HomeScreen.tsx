import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography, gradients, radius, shadows } from '../../constants/theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import Sparkline from '../../components/common/Sparkline';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [owedToYou, setOwedToYou] = useState(0);

  // Mock sparkline data (7 days of trend)
  const youOweData = [12, 18, 15, 22, 18, 12, 0];
  const owedToYouData = [5, 8, 12, 15, 18, 20, 0];

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
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
      {/* Premium Multi-Layer Gradient Header */}
      <LinearGradient
        colors={['#6BB4FF', '#3B9EFF', '#2B7FD9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.greeting}>{getGreeting()}, {firstName}! 👋</Text>
        <Text style={styles.subtitle}>Here's your bill splitting summary</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Premium Balance Card with Gradient Border Effect */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.balanceCardWrapper}
        >
          <LinearGradient
            colors={['#6BB4FF', '#3B9EFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.balanceCardGradient}
          >
            <View style={styles.balanceCardInner}>
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
              <AnimatedCounter
                value={balance}
                style={styles.balanceAmount}
                prefix="$"
              />

              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <View style={styles.balanceItemHeader}>
                    <Text style={styles.balanceItemLabel}>YOU OWE</Text>
                    <Sparkline
                      data={youOweData}
                      width={60}
                      height={20}
                      lineColor={colors.error}
                      gradientColors={[`${colors.error}33`, `${colors.error}00`]}
                      strokeWidth={1.5}
                    />
                  </View>
                  <AnimatedCounter
                    value={youOwe}
                    style={[styles.balanceItemValue, { color: colors.error }]}
                    prefix="$"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.balanceItem}>
                  <View style={styles.balanceItemHeader}>
                    <Text style={styles.balanceItemLabel}>OWED TO YOU</Text>
                    <Sparkline
                      data={owedToYouData}
                      width={60}
                      height={20}
                      lineColor={colors.success}
                      gradientColors={[`${colors.success}33`, `${colors.success}00`]}
                      strokeWidth={1.5}
                    />
                  </View>
                  <AnimatedCounter
                    value={owedToYou}
                    style={[styles.balanceItemValue, { color: colors.success }]}
                    prefix="$"
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={() => {}}
          >
            Create New Split
          </Button>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Card variant="elevated" gradient={['#F0F8FF', '#FFFFFF']} style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Active Splits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>$0</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card variant="elevated" style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎉</Text>
            <Text style={styles.emptyStateTitle}>Ready to split your first bill?</Text>
            <Text style={styles.emptyStateText}>
              Tap the button above to create a split,{'\n'}or scan a receipt to get started!
            </Text>
            <View style={styles.emptyStateTip}>
              <Text style={styles.emptyStateTipIcon}>💡</Text>
              <Text style={styles.emptyStateTipText}>
                Tip: Split bills with friends and track who owes what
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Card variant="elevated" onPress={() => {}} style={styles.quickAction}>
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>📸</Text>
              </View>
              <Text style={styles.quickActionText}>Scan Receipt</Text>
            </Card>
            <Card variant="elevated" onPress={() => {}} style={styles.quickAction}>
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>👥</Text>
              </View>
              <Text style={styles.quickActionText}>Add Friends</Text>
            </Card>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl + spacing.md,
    paddingBottom: spacing.xxl + spacing.md,
  },
  greeting: {
    ...typography.h1,
    fontSize: 34,
    color: colors.textInverse,
    marginBottom: spacing.xs,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.95,
    fontSize: 16,
  },
  content: {
    padding: spacing.lg,
    marginTop: -spacing.xxl,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  // Premium Balance Card with Gradient Border
  balanceCardWrapper: {
    ...shadows.high,
  },
  balanceCardGradient: {
    borderRadius: radius.lg,
    padding: 3, // Gradient border thickness
  },
  balanceCardInner: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg - 3,
    padding: spacing.xl,
  },
  balanceLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 1.2,
  },
  balanceAmount: {
    ...typography.numberLarge,
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: -1.5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    gap: spacing.sm,
  },
  balanceItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  balanceItemLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  balanceItemValue: {
    ...typography.h4,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  divider: {
    width: 2,
    height: 50,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.lg,
    borderRadius: 1,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    ...typography.h5,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  emptyStateTipIcon: {
    fontSize: 20,
  },
  emptyStateTipText: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  statsCard: {
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 28,
  },
  quickActionText: {
    ...typography.bodySmall,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});
