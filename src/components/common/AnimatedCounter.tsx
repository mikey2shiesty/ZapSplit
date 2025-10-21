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
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function AnimatedCounter({
  value,
  style,
  prefix = '',
  suffix = '',
  decimals = 2,
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withSpring(value, {
      damping: 15,
      stiffness: 100,
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const displayValue = animatedValue.value.toFixed(decimals);
    return {
      text: `${prefix}${displayValue}${suffix}`,
    } as any;
  });

  return (
    <AnimatedText
      style={style}
      animatedProps={animatedProps}
    />
  );
}
