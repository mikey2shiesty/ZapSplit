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
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <Header title="Change Password" onBack={() => navigation.goBack()} />

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
          <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.gray700 }]}>
              Choose a strong password that you don't use for other accounts. It should be at least 8 characters with a mix of letters, numbers, and symbols.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.gray700 }]}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: colors.surface, borderColor: colors.gray200, color: colors.gray900 },
                    errors.currentPassword && { borderColor: colors.error }
                  ]}
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
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.currentPassword}</Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.gray700 }]}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: colors.surface, borderColor: colors.gray200, color: colors.gray900 },
                    errors.newPassword && { borderColor: colors.error }
                  ]}
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
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.newPassword}</Text>
              )}

              {/* Password Strength Indicator */}
              {newPassword && (
                <View style={styles.strengthContainer}>
                  <View style={[styles.strengthBar, { backgroundColor: colors.gray200 }]}>
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
              <Text style={[styles.inputLabel, { color: colors.gray700 }]}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: colors.surface, borderColor: colors.gray200, color: colors.gray900 },
                    errors.confirmPassword && { borderColor: colors.error }
                  ]}
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
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</Text>
              )}
              {confirmPassword && newPassword === confirmPassword && !errors.confirmPassword && (
                <View style={styles.matchIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.matchText, { color: colors.success }]}>Passwords match</Text>
                </View>
              )}
            </View>
          </View>

          {/* Password Requirements */}
          <View style={[styles.requirementsSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.requirementsTitle, { color: colors.gray700 }]}>Password Requirements</Text>
            <View style={styles.requirementsList}>
              <RequirementItem met={newPassword.length >= 8} text="At least 8 characters" colors={colors} />
              <RequirementItem met={/[A-Z]/.test(newPassword)} text="One uppercase letter" colors={colors} />
              <RequirementItem met={/[a-z]/.test(newPassword)} text="One lowercase letter" colors={colors} />
              <RequirementItem met={/[0-9]/.test(newPassword)} text="One number" colors={colors} />
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
function RequirementItem({ met, text, colors }: { met: boolean; text: string; colors: any }) {
  return (
    <View style={styles.requirementItem}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={met ? colors.success : colors.gray400}
      />
      <Text style={[styles.requirementText, { color: met ? colors.gray700 : colors.gray500 }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm + 4,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm + 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
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
    fontWeight: '500',
  },
  requirementsSection: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm + 4,
  },
  requirementsList: {
    gap: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 14,
  },
  saveSection: {
    marginBottom: 40,
  },
});
