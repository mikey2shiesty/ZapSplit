import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius, fonts } from '../../constants/theme';

interface WelcomeScreenProps {
  navigation: any;
}

// Friendly Fintech Welcome — text-driven, dark canvas, saturated CTA.
// No app-icon thumbnail. Brand mark sits as a small saturated pill at top, the
// heading does the heavy lifting, supporting text holds the middle, two pill
// CTAs at the bottom (filled blue + outlined for contrast on dark).
export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}
    >
      {/* HERO CONTENT — heading first, brand mark sits next to the headline
          (small, saturated, transparent canvas). The big "Splits made simple."
          IS the brand presence — the icon just signs it off. */}

      {/* HEADING — real ZapSplit logo (transparent PNG) anchors the hero block. */}
      <View style={styles.heroBlock}>
        <Image
          source={require('../../assets/images/brand-icon.png')}
          style={styles.brandIcon}
          resizeMode="contain"
        />
        <Text style={[styles.kicker, { color: colors.primary }]}>
          Built for friends.
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Splits{'\n'}made simple.
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Scan receipts, split costs with friends, and get paid fast.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.buttonStack}>
        <TouchableOpacity
          style={[styles.primaryPill, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('Signup');
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
            Get started
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.outlinePill,
            { borderColor: colors.border, backgroundColor: 'transparent' },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Login');
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.outlinePillLabel, { color: colors.text }]}>
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  brandIcon: {
    width: 64,
    height: 72,
    marginBottom: spacing.lg,
  },

  heroBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: spacing.xl,
  },
  kicker: {
    ...typography.bodyLarge,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '700',
    letterSpacing: -1.4,
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.bodyLarge,
    fontWeight: '500',
    paddingRight: spacing.lg,
  },

  buttonStack: {
    gap: spacing.sm,
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.pill,
  },
  primaryPillLabel: {
    ...typography.button,
    fontSize: 17,
    fontWeight: '700',
  },
  outlinePill: {
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinePillLabel: {
    ...typography.button,
    fontSize: 17,
    fontWeight: '600',
  },
});
