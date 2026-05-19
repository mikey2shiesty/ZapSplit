import React, { useRef } from 'react';
import {
  Pressable,
  Animated,
  PressableProps,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// PressableScale — animates scale + opacity on press for premium tactile feel.
// Wraps any pressable target. By default it uses light haptic feedback;
// override with `haptic={false}` or pass a custom impact style via `hapticStyle`.
//
// Use this for any tappable card, row, or pill that wants a polished pressed
// state without each call site re-implementing the animation.

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  opacityTo?: number;
  /** Set false to skip haptics on press. */
  haptic?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  /** Set false to disable the animation entirely. */
  animate?: boolean;
}

export default function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  opacityTo = 0.85,
  haptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  animate = true,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: GestureResponderEvent) => {
    if (animate && !disabled) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: scaleTo,
          useNativeDriver: true,
          speed: 60,
          bounciness: 0,
        }),
        Animated.timing(opacity, {
          toValue: opacityTo,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    if (animate && !disabled) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
          bounciness: 4,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPressOut?.(e);
  };

  const handlePress = (e: GestureResponderEvent) => {
    if (haptic && !disabled) {
      Haptics.impactAsync(hapticStyle);
    }
    onPress?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
