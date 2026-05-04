import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography } from '../../constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  showBackButton?: boolean;
  variant?: 'default' | 'transparent';
  style?: ViewStyle;
}

// Friendly Fintech Header — title left, action right, soft icon button.
// Display.large title (32pt / 700), 22pt action icons in a 40pt soft-blue circle
// for primary back actions. Standard placement matches Coinbase / Public.
export default function Header({
  title,
  onBack,
  rightElement,
  showBackButton = true,
  variant = 'default',
  style,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const isTransparent = variant === 'transparent';

  return (
    <View
      style={[
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: isTransparent ? 'transparent' : colors.background,
        },
        style,
      ]}
    >
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
});
