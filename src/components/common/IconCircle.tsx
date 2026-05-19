import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

// IconCircle — soft-tinted circle wrapping an icon. The Coinbase pattern that
// leads every activity row, every settings row, every action shortcut.
// Default tone is `info` (soft-blue + accent glyph). Status tones map to
// the soft-tinted status palette.

type IconCircleSize = 'sm' | 'md' | 'lg';
type IconCircleTone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface IconCircleProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: IconCircleSize;
  tone?: IconCircleTone;
  style?: StyleProp<ViewStyle>;
}

const DIM: Record<IconCircleSize, { box: number; icon: number }> = {
  sm: { box: 32, icon: 16 },
  md: { box: 36, icon: 18 },
  lg: { box: 44, icon: 22 },
};

export default function IconCircle({
  name,
  size = 'md',
  tone = 'info',
  style,
}: IconCircleProps) {
  const { colors } = useTheme();

  const toneMap: Record<IconCircleTone, { fill: string; ink: string }> = {
    info: { fill: colors.primaryLight, ink: colors.primary },
    success: { fill: colors.successLight, ink: colors.success },
    warning: { fill: colors.warningLight, ink: colors.warning },
    error: { fill: colors.errorLight, ink: colors.error },
    neutral: { fill: colors.gray100, ink: colors.textSecondary },
  };

  const dim = DIM[size];
  const config = toneMap[tone];

  return (
    <View
      style={[
        styles.box,
        {
          width: dim.box,
          height: dim.box,
          borderRadius: dim.box / 2,
          backgroundColor: config.fill,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={dim.icon} color={config.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
