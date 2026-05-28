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
import * as Haptics from 'expo-haptics';

import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<string | null>(null);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!currentPassword) e.currentPassword = 'Current password is required';
    if (!newPassword) e.newPassword = 'New password is required';
    else if (newPassword.length < 8) e.newPassword = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(newPassword)) e.newPassword = 'Password must contain an uppercase letter';
    else if (!/[a-z]/.test(newPassword)) e.newPassword = 'Password must contain a lowercase letter';
    else if (!/[0-9]/.test(newPassword)) e.newPassword = 'Password must contain a number';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (currentPassword && newPassword && currentPassword === newPassword)
      e.newPassword = 'New password must be different';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Password changed', 'Your password has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const inputBorder = (field: string, hasError: boolean) =>
    hasError ? colors.error : focused === field ? colors.primary : colors.border;
  const inputWidth = (field: string, hasError: boolean) =>
    hasError || focused === field ? 2 : 1;

  type ReqProps = { ok: boolean; label: string };
  const Req = ({ ok, label }: ReqProps) => (
    <View style={styles.reqRow}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={ok ? colors.success : colors.textTertiary}
      />
      <Text style={[styles.reqLabel, { color: ok ? colors.success : colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );

  const renderField = (
    field: string,
    value: string,
    setValue: (v: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    placeholder: string,
  ) => (
    <View
      style={[
        styles.passwordRow,
        {
          backgroundColor: colors.surface,
          borderColor: inputBorder(field, !!errors[field]),
          borderWidth: inputWidth(field, !!errors[field]),
        },
      ]}
    >
      <TextInput
        style={[styles.passwordInput, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={(t) => {
          setValue(t);
          if (errors[field]) setErrors({ ...errors, [field]: '' });
        }}
        onFocus={() => setFocused(field)}
        onBlur={() => setFocused(null)}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
      />
      <TouchableOpacity
        onPress={() => setShow(!show)}
        style={styles.eyeButton}
        hitSlop={8}
      >
        <Ionicons name={show ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Change password" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Card variant="tinted">
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Choose a strong password you don't use elsewhere. At least 8 characters
                  with letters, numbers, and symbols.
                </Text>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Current password
              </Text>
              {renderField(
                'currentPassword',
                currentPassword,
                setCurrentPassword,
                showCurrent,
                setShowCurrent,
                'Current password',
              )}
              {errors.currentPassword && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.currentPassword}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>New password</Text>
              {renderField(
                'newPassword',
                newPassword,
                setNewPassword,
                showNew,
                setShowNew,
                'New password',
              )}
              {errors.newPassword && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.newPassword}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Confirm new password
              </Text>
              {renderField(
                'confirmPassword',
                confirmPassword,
                setConfirmPassword,
                showConfirm,
                setShowConfirm,
                'Confirm new password',
              )}
              {errors.confirmPassword && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>
          </View>

          {/* REQUIREMENTS */}
          {newPassword.length > 0 && (
            <View style={styles.section}>
              <Card>
                <Text style={[styles.cardLabel, { color: colors.text }]}>Requirements</Text>
                <View style={styles.reqList}>
                  <Req ok={newPassword.length >= 8} label="At least 8 characters" />
                  <Req ok={/[A-Z]/.test(newPassword)} label="One uppercase letter" />
                  <Req ok={/[a-z]/.test(newPassword)} label="One lowercase letter" />
                  <Req ok={/[0-9]/.test(newPassword)} label="One number" />
                </View>
              </Card>
            </View>
          )}

          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.primaryPill,
                {
                  backgroundColor: colors.primary,
                  opacity:
                    !currentPassword || !newPassword || !confirmPassword || saving ? 0.4 : 1,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleChange();
              }}
              disabled={!currentPassword || !newPassword || !confirmPassword || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
                  Change password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...typography.body,
  },

  field: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    paddingLeft: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.bodyLarge,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  errorText: {
    ...typography.bodySmall,
    fontSize: 12,
    paddingLeft: 4,
  },

  cardLabel: {
    ...typography.bodyLarge,
    marginBottom: spacing.sm,
  },
  reqList: {
    gap: spacing.sm,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reqLabel: {
    ...typography.body,
  },

  primaryPill: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPillLabel: {
    ...typography.button,
    fontSize: 17,
  },
});
