import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreateSplitScreenProps } from '../../types/navigation';
import { colors } from '../../constants/theme';

export default function CreateSplitScreen({ navigation }: CreateSplitScreenProps) {
  const handleClose = () => {
    // Go back to dismiss the modal
    navigation.getParent()?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Close Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Split</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color={colors.gray700} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create Split</Text>
        <Text style={styles.subtitle}>Enter split amount and details</Text>
        <Text style={styles.placeholder}>
          Phase 4: Add amount input, title field, and continue button
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
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
    color: colors.gray,
    marginBottom: 32,
  },
  placeholder: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
