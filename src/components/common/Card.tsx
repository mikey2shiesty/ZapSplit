import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows, radius, spacing } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Animated.View);

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
  const scale = useSharedValue(1);

  const cardStyle = [
    styles.base,
    { padding: paddingValue },
    variant === 'elevated' && [styles.elevated, shadows.medium],
    variant === 'outlined' && styles.outlined,
    style,
  ];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

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
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
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
});
