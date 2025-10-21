import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface GetStartedCardProps {
  onInviteFriends?: () => void;
  onScanReceipt?: () => void;
}

export default function GetStartedCard({
  onInviteFriends,
  onScanReceipt,
}: GetStartedCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Get Started</Text>
        <Text style={styles.subtitle}>Complete these steps to make the most of ZapSplit</Text>
      </View>

      {/* Step 1: Invite Friends */}
      <TouchableOpacity
        style={styles.step}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onInviteFriends?.();
        }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={24} color={colors.primary} />
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Invite your first friend</Text>
          <Text style={styles.stepDescription}>
            Start splitting bills with friends and family
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
      </TouchableOpacity>

      {/* Step 2: Scan Receipt */}
      <TouchableOpacity
        style={styles.step}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onScanReceipt?.();
        }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="camera" size={24} color={colors.primary} />
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Scan your first receipt</Text>
          <Text style={styles.stepDescription}>
            Automatically split bills by scanning receipts
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    gap: spacing.xs,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 18,
  },
});
