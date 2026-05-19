import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography } from '../../constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  showBackButton?: boolean;
  variant?: 'default' | 'transparent' | 'glass';
  style?: ViewStyle;
}

// Friendly Fintech Header.
// `default`     → solid background using `colors.background`.
// `transparent` → no background fill (used when content sits on a hero canvas).
// `glass`       → iOS 26 Liquid Glass — BlurView background on iOS, solid on
//                 Android. Use this when the header floats over scrollable
//                 content and you want the canvas to peek through.
export default function Header({
  title,
  onBack,
  rightElement,
  showBackButton = true,
  variant = 'default',
  style,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const isTransparent = variant === 'transparent';
  const isGlass = variant === 'glass';

  return (
    <View
      style={[
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor:
            isTransparent || isGlass ? 'transparent' : colors.background,
        },
        style,
      ]}
    >
      {/* iOS 26 Liquid Glass background fills behind the safe-area inset. */}
      {isGlass && Platform.OS === 'ios' && (
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}
      {isGlass && Platform.OS === 'android' && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.background },
          ]}
        />
      )}

      <View style={styles.content}>
        {showBackButton && onBack ? (
          <TouchableOpacity
            style={[styles.backCircle, { backgroundColor: colors.primaryLight }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {rightElement ? (
          <View style={styles.rightContainer}>{rightElement}</View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Hairline divider on glass variant so the floating header
          has a visible edge against scrolling content. */}
      {isGlass && (
        <View
          style={[styles.hairline, { backgroundColor: colors.divider }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  title: {
    flex: 1,
    ...typography.displayMedium,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  rightContainer: {
    minWidth: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
});
