import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

// Placeholder component until we build auth screens
export default function AppNavigator() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ZapSplit</Text>
      <Text style={styles.subtext}>Navigation Setup Complete ✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.text,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
