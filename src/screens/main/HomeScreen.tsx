import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography, radius, shadows } from '../../constants/theme';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { VictoryChart, VictoryArea } from 'victory-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [owedToYou, setOwedToYou] = useState(0);

  // Mock chart data
  const balanceData = [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 4, y: 0 },
    { x: 5, y: 0 },
    { x: 6, y: 0 },
    { x: 7, y: 0 },
  ];

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Michael';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Premium Mesh Gradient Header */}
      <LinearGradient
        colors={['#6BB4FF', '#4DA8FF', '#3B9EFF', '#2B8FE8']}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Subtle pattern overlay */}
        <View style={styles.patternOverlay} />

        <View style={styles.headerContent}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}!
            </Text>
            <Ionicons name="partly-sunny" size={24} color={colors.textInverse} />
          </View>
          <Text style={styles.subtitle}>Here's your bill splitting summary</Text>
        </View>
      </LinearGradient>

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
          {/* Premium Frosted Glass Balance Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <GlassCard intensity={30} style={styles.balanceCard}>
              <View style={styles.balanceCardContent}>
                {/* Mini chart background */}
                <View style={styles.chartBackground}>
                  <VictoryChart
                    height={180}
                    width={350}
                    padding={{ top: 20, bottom: 20, left: 0, right: 0 }}
                  >
                    <VictoryArea
                      data={balanceData}
                      style={{
                        data: {
                          fill: 'rgba(59, 158, 255, 0.1)',
                          stroke: 'rgba(59, 158, 255, 0.3)',
                          strokeWidth: 1.5,
                        },
                      }}
                      interpolation="natural"
                    />
                  </VictoryChart>
                </View>

                <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
                <AnimatedCounter
                  value={balance}
                  style={styles.balanceAmount}
                  prefix="$"
                  decimals={2}
                />

                <View style={styles.balanceRow}>
                  <View style={styles.balanceItem}>
                    <View style={styles.balanceItemHeader}>
                      <Ionicons name="arrow-up-circle" size={16} color={colors.error} />
                      <Text style={styles.balanceItemLabel}>YOU OWE</Text>
                    </View>
                    <AnimatedCounter
                      value={youOwe}
                      style={[styles.balanceItemValue, { color: colors.error }]}
                      prefix="$"
                      decimals={2}
                    />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.balanceItem}>
                    <View style={styles.balanceItemHeader}>
                      <Ionicons name="arrow-down-circle" size={16} color={colors.success} />
                      <Text style={styles.balanceItemLabel}>OWED TO YOU</Text>
                    </View>
                    <AnimatedCounter
                      value={owedToYou}
                      style={[styles.balanceItemValue, { color: colors.success }]}
                      prefix="$"
                      decimals={2}
                    />
                  </View>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Create Split Button */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={() => {}}
              icon={<Ionicons name="add-circle" size={24} color={colors.textInverse} />}
            >
              Create New Split
            </Button>
          </Animated.View>

          {/* Professional Quick Stats */}
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.statsRow}>
            <GlassCard intensity={25} style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="documents" size={32} color={colors.primary} />
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Active Splits</Text>
              </View>
            </GlassCard>

            <GlassCard intensity={25} style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="people" size={32} color={colors.primary} />
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
            </GlassCard>

            <GlassCard intensity={25} style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="trending-up" size={32} color={colors.primary} />
                <Text style={styles.statValue}>$0</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Recent Activity Section */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            {/* Ghost Cards - Preview of what transactions will look like */}
            <GlassCard intensity={20} style={styles.ghostCard}>
              <View style={styles.ghostTransaction}>
                <View style={styles.ghostAvatar} />
                <View style={styles.ghostContent}>
                  <View style={styles.ghostLine} style={{ width: '60%' }} />
                  <View style={styles.ghostLine} style={{ width: '40%', height: 12 }} />
                </View>
                <View style={styles.ghostAmount} />
              </View>
            </GlassCard>

            <GlassCard intensity={20} style={styles.ghostCard}>
              <View style={styles.ghostTransaction}>
                <View style={styles.ghostAvatar} />
                <View style={styles.ghostContent}>
                  <View style={styles.ghostLine} style={{ width: '50%' }} />
                  <View style={styles.ghostLine} style={{ width: '35%', height: 12 }} />
                </View>
                <View style={styles.ghostAmount} />
              </View>
            </GlassCard>

            {/* Empty State Message */}
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={56} color={colors.primary} opacity={0.3} />
              <Text style={styles.emptyStateTitle}>Your activity will appear here</Text>
              <Text style={styles.emptyStateText}>
                Create your first split to start tracking expenses
              </Text>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <GlassCard intensity={25} onPress={() => {}} style={styles.quickAction}>
                <View style={styles.quickActionContent}>
                  <Ionicons name="camera" size={32} color={colors.primary} />
                  <Text style={styles.quickActionText}>Scan Receipt</Text>
                </View>
              </GlassCard>

              <GlassCard intensity={25} onPress={() => {}} style={styles.quickAction}>
                <View style={styles.quickActionContent}>
                  <Ionicons name="person-add" size={32} color={colors.primary} />
                  <Text style={styles.quickActionText}>Add Friends</Text>
                </View>
              </GlassCard>
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
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    paddingHorizontal: spacing.lg,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  headerContent: {
    gap: spacing.xs,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textInverse,
    opacity: 0.95,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl + spacing.xl,
  },
  balanceCard: {
    ...shadows.high,
  },
  balanceCardContent: {
    padding: spacing.xl,
    position: 'relative',
  },
  chartBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -2,
    marginBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  balanceItem: {
    flex: 1,
    gap: spacing.sm,
  },
  balanceItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  balanceItemValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    width: 2,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  ghostCard: {
    marginBottom: spacing.sm,
  },
  ghostTransaction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  ghostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  ghostContent: {
    flex: 1,
    gap: spacing.xs,
  },
  ghostLine: {
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: radius.sm,
  },
  ghostAmount: {
    width: 70,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: radius.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
  },
  quickActionContent: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
