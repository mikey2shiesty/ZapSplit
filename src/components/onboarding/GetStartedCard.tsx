import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

interface GetStartedCardProps {
  onInviteFriends?: () => void;
  onScanReceipt?: () => void;
}

export default function GetStartedCard({
  onInviteFriends,
  onScanReceipt,
}: GetStartedCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.gray900 }]}>Get Started</Text>
        <Text style={[styles.subtitle, { color: colors.gray600 }]}>Complete these steps to make the most of ZapSplit</Text>
      </View>

      {/* Step 1: Invite Friends */}
      <TouchableOpacity
        style={styles.step}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onInviteFriends?.();
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="share-social" size={24} color={colors.primary} />
        </View>
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.gray900 }]}>Invite your first friend</Text>
          <Text style={[styles.stepDescription, { color: colors.gray600 }]}>
            Share ZapSplit with friends and family
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
        <View style={[styles.iconContainer, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="camera" size={24} color={colors.primary} />
        </View>
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.gray900 }]}>Scan your first receipt</Text>
          <Text style={[styles.stepDescription, { color: colors.gray600 }]}>
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
  },
  subtitle: {
    fontSize: 14,
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
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});
