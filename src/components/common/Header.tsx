import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { shadows } from '../../constants/theme';

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
  const { colors } = useTheme();

  const isTransparent = variant === 'transparent';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: isTransparent ? 'transparent' : colors.surface,
          borderBottomColor: isTransparent ? 'transparent' : colors.gray200,
          borderBottomWidth: isTransparent ? 0 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Left - Back Button */}
        {showBackButton && onBack ? (
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: isTransparent ? colors.surface : colors.gray50,
              },
            ]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray900} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        {/* Center - Title */}
        <Text style={[styles.title, { color: colors.gray900 }]} numberOfLines={1}>
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
  container: {},
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
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.low,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
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
