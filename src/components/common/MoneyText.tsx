import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { fonts } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

// MoneyText — every dollar amount in the app routes through here.
// Friendly Fintech: bold sans display (NOT mono), AUD-formatted, tone colours.
// Sizes match the typography scale: hero (44/700), large (28/700), row (17/700),
// caption (13/600).

type MoneySize = 'hero' | 'large' | 'row' | 'caption';
type MoneyTone = 'default' | 'positive' | 'negative' | 'muted' | 'inverse';

interface MoneyTextProps {
  amount: number;
  currency?: string;
  size?: MoneySize;
  tone?: MoneyTone;
  showSign?: boolean;
  style?: StyleProp<TextStyle>;
}

const SIZE_MAP: Record<MoneySize, TextStyle> = {
  hero: { fontSize: 44, lineHeight: 50, fontWeight: '700', letterSpacing: -0.8 },
  large: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  row: { fontSize: 17, lineHeight: 22, fontWeight: '700', letterSpacing: -0.1 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0 },
};

export default function MoneyText({
  amount,
  currency = 'AUD',
  size = 'row',
  tone = 'default',
  showSign = false,
  style,
}: MoneyTextProps) {
  const { colors } = useTheme();

  const toneColor: Record<MoneyTone, string> = {
    default: colors.text,
    positive: colors.success,
    negative: colors.error,
    muted: colors.textSecondary,
    inverse: colors.textInverse,
  };

  const formatted = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = showSign && amount !== 0
    ? amount > 0 ? '+' : '−'
    : amount < 0 ? '−' : '';
  const display = `${sign}${formatted}`;

  return (
    <Text
      style={[
        { fontFamily: fonts.sans, color: toneColor[tone] },
        SIZE_MAP[size],
        style,
      ]}
    >
      {display}
    </Text>
  );
}
