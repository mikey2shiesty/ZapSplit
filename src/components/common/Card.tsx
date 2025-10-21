import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors, shadows, radius, spacing } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  gradient?: string[];
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export default function Card({
  children,
  variant = 'default',
  gradient,
  onPress,
  style,
  padding = 'md',
}: CardProps) {
  const paddingValue = spacing[padding];

  const cardStyle = [
    styles.base,
    { padding: paddingValue },
    variant === 'elevated' && [styles.elevated, shadows.medium],
    variant === 'outlined' && styles.outlined,
    style,
  ];

  const content = gradient ? (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[cardStyle, { padding: 0 }]}
    >
      <View style={{ padding: paddingValue }}>{children}</View>
    </LinearGradient>
  ) : (
    <View style={cardStyle}>{children}</View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: colors.surface,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
});
