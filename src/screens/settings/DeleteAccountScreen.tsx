import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const isDeleteEnabled = confirmText.toLowerCase() === 'delete my account';

  const handleDeleteAccount = async () => {
    if (!isDeleteEnabled) return;

    Alert.alert(
      'Final Confirmation',
      'This action cannot be undone. Are you absolutely sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: performDeletion,
        },
      ]
    );
  };

  const performDeletion = async () => {
    setLoading(true);

    try {
      // Call the delete account edge function
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user?.id },
      });

      if (error) {
        throw error;
      }

      // Sign out the user
      await signOut();

      // Show success message
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted. We\'re sorry to see you go.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Deletion Failed',
        error.message || 'Failed to delete your account. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.gray50 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <Header title="Delete Account" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Warning Card */}
        <View style={[styles.warningCard, { backgroundColor: colors.errorLight }]}>
          <View style={[styles.warningIconContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="warning" size={40} color={colors.error} />
          </View>
          <Text style={[styles.warningTitle, { color: colors.error }]}>This action is permanent</Text>
          <Text style={[styles.warningText, { color: colors.gray700 }]}>
            Deleting your account will permanently remove all your data from ZapSplit.
            This cannot be undone.
          </Text>
        </View>

        {/* What gets deleted */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>What will be deleted:</Text>

          <View style={[styles.deleteItem, { borderBottomColor: colors.gray100 }]}>
            <Ionicons name="person-outline" size={20} color={colors.error} />
            <Text style={[styles.deleteItemText, { color: colors.gray700 }]}>Your profile and account information</Text>
          </View>

          <View style={[styles.deleteItem, { borderBottomColor: colors.gray100 }]}>
            <Ionicons name="receipt-outline" size={20} color={colors.error} />
            <Text style={[styles.deleteItemText, { color: colors.gray700 }]}>All splits you've created or participated in</Text>
          </View>

          <View style={[styles.deleteItem, { borderBottomColor: colors.gray100 }]}>
            <Ionicons name="card-outline" size={20} color={colors.error} />
            <Text style={[styles.deleteItemText, { color: colors.gray700 }]}>Your payment history</Text>
          </View>

          <View style={[styles.deleteItem, { borderBottomColor: colors.gray100 }]}>
            <Ionicons name="people-outline" size={20} color={colors.error} />
            <Text style={[styles.deleteItemText, { color: colors.gray700 }]}>Your friends list and group memberships</Text>
          </View>

          <View style={[styles.deleteItem, { borderBottomColor: colors.gray100 }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.error} />
            <Text style={[styles.deleteItemText, { color: colors.gray700 }]}>All notifications and preferences</Text>
          </View>
        </View>

        {/* Important notes */}
        <View style={[styles.notesSection, { backgroundColor: colors.gray100 }]}>
          <Text style={[styles.notesTitle, { color: colors.gray700 }]}>Important notes:</Text>
          <Text style={[styles.notesText, { color: colors.gray600 }]}>
            {'\u2022'} Outstanding payments may still be processed through Stripe{'\n'}
            {'\u2022'} Your Stripe Connect account (if linked) will remain active unless you deactivate it separately{'\n'}
            {'\u2022'} We may retain anonymized transaction data for legal compliance{'\n'}
            {'\u2022'} Deletion is processed within 30 days
          </Text>
        </View>

        {/* Confirmation input */}
        <View style={styles.confirmSection}>
          <Text style={[styles.confirmLabel, { color: colors.gray700 }]}>
            Type <Text style={[styles.confirmKeyword, { color: colors.error }]}>"delete my account"</Text> to confirm:
          </Text>
          <TextInput
            style={[styles.confirmInput, { backgroundColor: colors.surface, borderColor: colors.gray200, color: colors.gray900 }]}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="delete my account"
            placeholderTextColor={colors.gray400}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: colors.error },
            !isDeleteEnabled && styles.deleteButtonDisabled,
          ]}
          onPress={handleDeleteAccount}
          disabled={!isDeleteEnabled || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel link */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.gray500 }]}>Cancel and go back</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    borderRadius: radius.md,
    padding: 20,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  deleteItemText: {
    flex: 1,
    fontSize: 15,
  },
  notesSection: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 20,
  },
  confirmSection: {
    marginBottom: spacing.lg,
  },
  confirmLabel: {
    fontSize: 15,
    marginBottom: spacing.sm + 4,
  },
  confirmKeyword: {
    fontWeight: '700',
  },
  confirmInput: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
  },
  cancelButtonText: {
    fontSize: 15,
  },
  bottomSpacer: {
    height: 40,
  },
});
