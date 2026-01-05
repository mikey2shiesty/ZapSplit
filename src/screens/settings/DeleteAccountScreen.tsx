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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/theme';

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Card */}
        <View style={styles.warningCard}>
          <View style={styles.warningIconContainer}>
            <Ionicons name="warning" size={40} color={colors.error} />
          </View>
          <Text style={styles.warningTitle}>This action is permanent</Text>
          <Text style={styles.warningText}>
            Deleting your account will permanently remove all your data from ZapSplit.
            This cannot be undone.
          </Text>
        </View>

        {/* What gets deleted */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What will be deleted:</Text>

          <View style={styles.deleteItem}>
            <Ionicons name="person-outline" size={20} color={colors.error} />
            <Text style={styles.deleteItemText}>Your profile and account information</Text>
          </View>

          <View style={styles.deleteItem}>
            <Ionicons name="receipt-outline" size={20} color={colors.error} />
            <Text style={styles.deleteItemText}>All splits you've created or participated in</Text>
          </View>

          <View style={styles.deleteItem}>
            <Ionicons name="card-outline" size={20} color={colors.error} />
            <Text style={styles.deleteItemText}>Your payment history</Text>
          </View>

          <View style={styles.deleteItem}>
            <Ionicons name="people-outline" size={20} color={colors.error} />
            <Text style={styles.deleteItemText}>Your friends list and group memberships</Text>
          </View>

          <View style={styles.deleteItem}>
            <Ionicons name="notifications-outline" size={20} color={colors.error} />
            <Text style={styles.deleteItemText}>All notifications and preferences</Text>
          </View>
        </View>

        {/* Important notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Important notes:</Text>
          <Text style={styles.notesText}>
            {'\u2022'} Outstanding payments may still be processed through Stripe{'\n'}
            {'\u2022'} Your Stripe Connect account (if linked) will remain active unless you deactivate it separately{'\n'}
            {'\u2022'} We may retain anonymized transaction data for legal compliance{'\n'}
            {'\u2022'} Deletion is processed within 30 days
          </Text>
        </View>

        {/* Confirmation input */}
        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>
            Type <Text style={styles.confirmKeyword}>"delete my account"</Text> to confirm:
          </Text>
          <TextInput
            style={styles.confirmInput}
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
          <Text style={styles.cancelButtonText}>Cancel and go back</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningCard: {
    backgroundColor: colors.errorLight,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 15,
    color: colors.gray700,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 16,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  deleteItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray700,
  },
  notesSection: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    color: colors.gray600,
    lineHeight: 20,
  },
  confirmSection: {
    marginBottom: 24,
  },
  confirmLabel: {
    fontSize: 15,
    color: colors.gray700,
    marginBottom: 12,
  },
  confirmKeyword: {
    fontWeight: '700',
    color: colors.error,
  },
  confirmInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.gray900,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
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
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    color: colors.gray500,
  },
  bottomSpacer: {
    height: 40,
  },
});
