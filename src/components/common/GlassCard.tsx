import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, shadows } from '../../constants/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  onPress?: () => void;
  style?: ViewStyle;
  borderGlow?: boolean;
}

export default function GlassCard({
  children,
  intensity = 20,
  tint = 'light',
  onPress,
  style,
  borderGlow = true,
}: GlassCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };

  const content = (
    <AnimatedBlurView
      intensity={intensity}
      tint={tint}
      style={[
        styles.glassCard,
        borderGlow && styles.borderGlow,
        shadows.medium,
        style,
        onPress && animatedStyle,
      ]}
    >
      <View style={styles.innerBorder} />
      <View style={styles.content}>{children}</View>
    </AnimatedBlurView>
  );

  if (onPress) {
    return (
      <Animated.View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
        onResponderRelease={handlePressOut}
      >
        {content}
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  borderGlow: {
    borderWidth: 1,
    borderColor: 'rgba(59, 158, 255, 0.2)',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    // Padding handled by children
  },
});
