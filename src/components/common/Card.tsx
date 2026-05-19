import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing, shadows, layout } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

// Friendly Fintech Card — the structural container of the app.
// 16pt corners, 1px hairline border, subtle card shadow, white surface on canvas.
// Every information cluster lives in one of these.

type Variant = 'default' | 'tinted' | 'outlined' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: Variant;
  /** @deprecated gradients are not part of the Friendly Fintech language */
  gradient?: unknown;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof spacing | 'card';
}

export default function Card({
  children,
  variant = 'default',
  onPress,
  style,
  padding = 'card',
}: CardProps) {
  const { colors } = useTheme();

  // 'card' resolves to the asymmetric default (20 vertical, 16 horizontal).
  const isCardPad = padding === 'card';
  const padV = isCardPad ? layout.cardPaddingV : spacing[padding as keyof typeof spacing];
  const padH = isCardPad ? layout.cardPaddingH : spacing[padding as keyof typeof spacing];

  const fill =
    variant === 'tinted' ? colors.primaryLight : colors.surface;

  const cardStyle: StyleProp<ViewStyle> = [
    {
      paddingVertical: padV,
      paddingHorizontal: padH,
      backgroundColor: fill,
      borderRadius: radius.lg,
      borderWidth: variant === 'tinted' ? 0 : 1,
      borderColor: colors.border,
    },
    variant !== 'tinted' && shadows.card,
    style,
  ];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
