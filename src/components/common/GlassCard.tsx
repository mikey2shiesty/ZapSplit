import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

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
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const content = (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[
        styles.glassCard,
        borderGlow && styles.borderGlow,
        shadows.medium,
        style,
      ]}
    >
      <View style={styles.innerBorder} />
      <View style={styles.content}>{children}</View>
    </BlurView>
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
