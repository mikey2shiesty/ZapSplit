import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { spacing, radius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

// Skeleton — shimmering placeholder bars/blocks shaped like the content they're
// replacing. Used during initial load instead of a spinner. The shimmer is a
// subtle opacity pulse on the soft-blue tint surface — enough to feel alive
// without being distracting.

function useShimmer() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return opacity;
}

interface BarProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

function Bar({ width = '100%', height = 14, radius: r = 6, style }: BarProps) {
  const { colors } = useTheme();
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: r,
          backgroundColor: colors.gray100,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface CircleProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

function Circle({ size = 36, style }: CircleProps) {
  const { colors } = useTheme();
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.gray100,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Hero balance card skeleton (label + 44pt amount + owed/owe row)
function Hero() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Bar width={96} height={12} radius={6} />
      <Bar width="55%" height={36} radius={8} style={{ marginTop: 12 }} />
      <View
        style={[
          styles.heroRow,
          { borderTopColor: colors.border },
        ]}
      >
        <View style={styles.heroCell}>
          <Bar width={70} height={10} radius={5} />
          <Bar width={88} height={18} radius={6} style={{ marginTop: 6 }} />
        </View>
        <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
        <View style={styles.heroCell}>
          <Bar width={60} height={10} radius={5} />
          <Bar width={84} height={18} radius={6} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

// Activity row skeleton (icon circle + 2 stacked bars + amount)
interface RowProps {
  isLast?: boolean;
}
function Row({ isLast }: RowProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Circle size={36} />
      <View style={styles.rowMain}>
        <Bar width="60%" height={14} radius={6} />
        <Bar width="40%" height={11} radius={5} style={{ marginTop: 6 }} />
      </View>
      <Bar width={64} height={16} radius={6} />
    </View>
  );
}

// Activity card skeleton: card containing N rows
interface ListProps {
  rows?: number;
}
function List({ rows = 4 }: ListProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, padding: spacing.sm },
      ]}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Row key={i} isLast={i === rows - 1} />
      ))}
    </View>
  );
}

const Skeleton = { Bar, Circle, Hero, Row, List };
export default Skeleton;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  heroCell: {
    flex: 1,
    gap: 2,
  },
  heroDivider: {
    width: 1,
    height: 32,
    marginHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    minHeight: 76,
  },
  rowMain: {
    flex: 1,
  },
});
