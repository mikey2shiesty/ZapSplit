import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable, ColorValue } from 'react-native';
import { shadows, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  gradient?: [ColorValue, ColorValue, ...ColorValue[]];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
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
  const { colors } = useTheme();
  const paddingValue = spacing[padding];

  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    { padding: paddingValue, backgroundColor: colors.surface },
    variant === 'elevated' && [styles.elevated, shadows.medium],
    variant === 'outlined' && [styles.outlined, { borderColor: colors.border }],
    style,
  ];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const content = gradient ? (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, { padding: 0 }]}
    >
      <View style={{ padding: paddingValue }}>{children}</View>
    </LinearGradient>
  ) : (
    <View style={cardStyle}>{children}</View>
  );

  if (onPress) {
    return (
      <Pressable onPress={handlePress}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  elevated: {},
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});
