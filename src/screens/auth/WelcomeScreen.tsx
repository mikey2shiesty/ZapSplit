import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';

interface WelcomeScreenProps {
  navigation: any;
}

// Friendly Fintech Welcome.
// Logo top, big bold display heading + soft subtitle, two pill CTAs at bottom.
export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={[styles.title, { color: colors.text }]}>
          Splits made simple.
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Scan receipts, split costs with friends, and get paid fast.
        </Text>
      </View>

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
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.softPill, { backgroundColor: colors.primaryLight }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Login');
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.softPillLabel, { color: colors.primary }]}>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.displayLarge,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
    marginBottom: spacing.md,
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
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPillLabel: {
    ...typography.button,
    fontSize: 17,
  },
  softPill: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softPillLabel: {
    ...typography.button,
    fontSize: 17,
  },
});
