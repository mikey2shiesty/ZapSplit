import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  showBackButton?: boolean;
  variant?: 'default' | 'transparent';
  style?: ViewStyle;
}

export default function Header({
  title,
  onBack,
  rightElement,
  showBackButton = true,
  variant = 'default',
  style,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  const isTransparent = variant === 'transparent';

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8 },
        isTransparent && styles.transparent,
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Left - Back Button */}
        {showBackButton && onBack ? (
          <TouchableOpacity
            style={[styles.backButton, isTransparent && styles.backButtonTransparent]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray900} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        {/* Center - Title */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Right - Custom Element or Placeholder */}
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
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.low,
  },
  backButtonTransparent: {
    backgroundColor: colors.surface,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  rightContainer: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
});
