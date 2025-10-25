import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: TextStyle;
  duration?: number;
  useSpring?: boolean;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  style,
  duration = 800,
  useSpring: shouldUseSpring = false,
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    if (shouldUseSpring) {
      animatedValue.value = withSpring(value, {
        damping: 15,
        stiffness: 90,
      });
    } else {
      animatedValue.value = withTiming(value, {
        duration,
      });
    }
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const formattedValue = animatedValue.value.toFixed(decimals);
    return {
      text: `${prefix}${formattedValue}${suffix}`,
    } as any;
  });

  return (
    <AnimatedText
      style={style}
      animatedProps={animatedProps}
    />
  );
}
