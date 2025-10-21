import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, typography, shadows } from '../../constants/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  showBorder?: boolean;
  status?: 'online' | 'offline' | 'away';
  style?: ViewStyle;
}

export default function Avatar({
  uri,
  name,
  size = 'md',
  showBorder = false,
  status,
  style,
}: AvatarProps) {
  const sizeConfig = {
    xs: { dimension: 24, fontSize: 10 },
    sm: { dimension: 32, fontSize: 12 },
    md: { dimension: 40, fontSize: 14 },
    lg: { dimension: 56, fontSize: 18 },
    xl: { dimension: 80, fontSize: 24 },
  };

  const config = sizeConfig[size];

  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const statusColor = {
    online: colors.success,
    offline: colors.gray400,
    away: colors.warning,
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: config.dimension,
            height: config.dimension,
            borderRadius: config.dimension / 2,
          },
          showBorder && styles.bordered,
          showBorder && shadows.low,
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: config.dimension / 2,
            }}
          />
        ) : (
          <View
            style={[
              styles.fallback,
              {
                width: '100%',
                height: '100%',
                borderRadius: config.dimension / 2,
              },
            ]}
          >
            <Text style={[styles.initials, { fontSize: config.fontSize }]}>
              {getInitials(name)}
            </Text>
          </View>
        )}
      </View>

      {status && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: config.dimension * 0.25,
              height: config.dimension * 0.25,
              borderRadius: config.dimension * 0.125,
              backgroundColor: statusColor[status],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: 2,
    borderColor: colors.surface,
  },
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
