import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import { colors } from '../../constants/theme';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain an uppercase letter';
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain a lowercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain a number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Update password through Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert(
        'Password Changed',
        'Your password has been updated successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);

      // Handle specific error messages
      if (error.message?.includes('same as')) {
        setErrors({ newPassword: 'New password must be different from current password' });
      } else {
        Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return { label: '', color: colors.gray300, width: '0%' };

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++;

    if (strength <= 2) return { label: 'Weak', color: colors.error, width: '33%' };
    if (strength <= 4) return { label: 'Medium', color: colors.warning, width: '66%' };
    return { label: 'Strong', color: colors.success, width: '100%' };
  };

  const passwordStrength = getPasswordStrength();

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
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Choose a strong password that you don't use for other accounts. It should be at least 8 characters with a mix of letters, numbers, and symbols.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.currentPassword && styles.inputError]}
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    if (errors.currentPassword) {
                      setErrors({ ...errors, currentPassword: '' });
                    }
                  }}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.gray500}
                  />
                </TouchableOpacity>
              </View>
              {errors.currentPassword && (
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.newPassword && styles.inputError]}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: '' });
                    }
                  }}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.gray500}
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}

              {/* Password Strength Indicator */}
              {newPassword && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        { width: passwordStrength.width as any, backgroundColor: passwordStrength.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.gray500}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
              {confirmPassword && newPassword === confirmPassword && !errors.confirmPassword && (
                <View style={styles.matchIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.matchText}>Passwords match</Text>
                </View>
              )}
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsTitle}>Password Requirements</Text>
            <View style={styles.requirementsList}>
              <RequirementItem met={newPassword.length >= 8} text="At least 8 characters" />
              <RequirementItem met={/[A-Z]/.test(newPassword)} text="One uppercase letter" />
              <RequirementItem met={/[a-z]/.test(newPassword)} text="One lowercase letter" />
              <RequirementItem met={/[0-9]/.test(newPassword)} text="One number" />
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            <Button
              variant="primary"
              onPress={handleChangePassword}
              loading={saving}
              disabled={!currentPassword || !newPassword || !confirmPassword || saving}
              fullWidth
            >
              Change Password
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Requirement Item Component
function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.requirementItem}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={met ? colors.success : colors.gray400}
      />
      <Text style={[styles.requirementText, met && styles.requirementMet]}>
        {text}
      </Text>
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
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.gray900,
  },
  passwordInput: {
    paddingRight: 50,
  },
  inputError: {
    borderColor: colors.error,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  matchText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  requirementsSection: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 14,
    color: colors.gray500,
  },
  requirementMet: {
    color: colors.gray700,
  },
  saveSection: {
    marginBottom: 40,
  },
});
