import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, spacing } from '../../constants/theme';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  gradient?: string[];
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  borderWidth?: number;
  glow?: 'green' | 'blue' | 'purple' | 'none';
}

export default function GlassmorphicCard({
  children,
  intensity = 80,
  tint = 'dark',
  gradient,
  onPress,
  style,
  padding = 'lg',
  borderWidth = 1,
  glow = 'none',
}: GlassmorphicCardProps) {
  const paddingValue = spacing[padding];

  const glowShadow = glow !== 'none' ? shadows[`glow${glow.charAt(0).toUpperCase()}${glow.slice(1)}` as keyof typeof shadows] : shadows.none;

  const cardStyle: ViewStyle = {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth,
    borderColor: colors.border,
    ...glowShadow,
    ...style,
  };

  const content = (
    <View style={{ padding: paddingValue }}>
      {children}
    </View>
  );

  if (gradient) {
    return onPress ? (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          {content}
        </LinearGradient>
      </Pressable>
    ) : (
      <View style={cardStyle}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          {content}
        </LinearGradient>
      </View>
    );
  }

  return onPress ? (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        cardStyle,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <BlurView intensity={intensity} tint={tint} style={styles.blur}>
        <View style={styles.glassOverlay}>
          {content}
        </View>
      </BlurView>
    </Pressable>
  ) : (
    <View style={cardStyle}>
      <BlurView intensity={intensity} tint={tint} style={styles.blur}>
        <View style={styles.glassOverlay}>
          {content}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    flex: 1,
  },
  glassOverlay: {
    flex: 1,
    backgroundColor: colors.surfaceGlass,
  },
});
