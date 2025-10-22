import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { CustomAmountsScreenProps } from '../../types/navigation';
import { colors } from '../../constants/theme';

export default function CustomAmountsScreen({ navigation, route }: CustomAmountsScreenProps) {
  const { amount, title, selectedFriends } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>Custom Amounts</Text>
        <Text style={styles.subtitle}>
          Enter amount for each person
        </Text>
        <Text style={styles.info}>
          Total: ${amount.toFixed(2)}
        </Text>
        <Text style={styles.placeholder}>
          Phase 4: Add participant list with editable amount fields
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  info: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 32,
  },
  placeholder: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
