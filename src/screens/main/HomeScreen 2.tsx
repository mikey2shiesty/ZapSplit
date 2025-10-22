import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography, gradients, radius, shadows } from '../../constants/theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        <View style={styles.balanceCardWrapper}>
          <LinearGradient
            colors={['#6BB4FF', '#3B9EFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.balanceCardGradient}
          >
            <View style={styles.balanceCardInner}>
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
              <Text style={styles.balanceAmount}>$0.00</Text>

              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceItemLabel}>YOU OWE</Text>
                  <Text style={[styles.balanceItemValue, { color: colors.error }]}>
                    $0.00
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceItemLabel}>OWED TO YOU</Text>
                  <Text style={[styles.balanceItemValue, { color: colors.success }]}>
                    $0.00
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <Button
          variant="primary"
          size="large"
          fullWidth
          onPress={() => {}}
        >
          Create New Split
        </Button>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card variant="elevated" style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💸</Text>
            <Text style={styles.emptyStateTitle}>No splits yet</Text>
            <Text style={styles.emptyStateText}>
              Start splitting bills with friends{'\n'}and keep track of expenses!
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
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
        </View>
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
