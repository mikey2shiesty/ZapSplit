import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography, gradients, radius, shadows } from '../../constants/theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function HomeScreen() {
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={gradients.primaryVertical}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.greeting}>Hello, {firstName}! 👋</Text>
        <Text style={styles.subtitle}>Welcome back to ZapSplit</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Card variant="elevated" padding="lg" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>$0.00</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>You Owe</Text>
              <Text style={[styles.balanceItemValue, { color: colors.error }]}>
                $0.00
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Owed to You</Text>
              <Text style={[styles.balanceItemValue, { color: colors.success }]}>
                $0.00
              </Text>
            </View>
          </View>
        </Card>

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
          <Card style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No splits yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first split to get started!
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Card variant="outlined" onPress={() => {}} style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>📸</Text>
              <Text style={styles.quickActionText}>Scan Receipt</Text>
            </Card>
            <Card variant="outlined" onPress={() => {}} style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>👥</Text>
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
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    ...typography.h1,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.9,
  },
  content: {
    padding: spacing.lg,
    marginTop: -spacing.lg,
    gap: spacing.lg,
  },
  balanceCard: {
    ...shadows.medium,
  },
  balanceLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.numberLarge,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    gap: spacing.xs,
  },
  balanceItemLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  balanceItemValue: {
    ...typography.h4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickActionIcon: {
    fontSize: 32,
  },
  quickActionText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
});
