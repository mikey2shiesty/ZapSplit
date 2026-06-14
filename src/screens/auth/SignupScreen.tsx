import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { spacing, typography, radius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

interface SignupScreenProps {
  navigation: any;
}

// Friendly Fintech Signup. Same language as Login: bold display heading,
// boxed inputs, filled pill primary, pill social buttons.
export default function SignupScreen({ navigation }: SignupScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { signUp, signInWithApple, isAppleSignInAvailable, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirm?: string;
    form?: string;
  }>({});

  const shake = useRef(new Animated.Value(0)).current;
  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const validateForm = () => {
    const next: typeof errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fullName.trim()) next.fullName = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!emailRegex.test(email)) next.email = 'Enter a valid email address';
    if (password.length < 8) next.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(password)) next.password = 'Add an uppercase letter';
    else if (!/[0-9]/.test(password)) next.password = 'Add a number';
    else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) next.password = 'Add a special character';
    if (password !== confirmPassword) next.confirm = 'Passwords don\'t match';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      triggerShake();
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await signUp(email, password, fullName);
    } catch (error: any) {
      setErrors({ form: error.message || 'Something went wrong, try again.' });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', error.message || 'Apple Sign In error');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED' && error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', error.message || 'Google Sign In error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputBorder = (field: string, hasError?: boolean) =>
    hasError ? colors.error : focusedField === field ? colors.primary : colors.border;
  const inputWidth = (field: string, hasError?: boolean) =>
    hasError || focusedField === field ? 2 : 1;

  // Reqs row helper
  type ReqProps = { ok: boolean; label: string };
  const Req = ({ ok, label }: ReqProps) => (
    <View style={styles.reqRow}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={ok ? colors.success : colors.textTertiary}
      />
      <Text style={[styles.reqLabel, { color: ok ? colors.success : colors.textTertiary }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primaryLight }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            hitSlop={12}
            activeOpacity={0.6}
          >
            <Text style={[styles.topLink, { color: colors.primary }]} numberOfLines={1}>Log in</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.kicker, { color: colors.primary }]}>Sign up</Text>
        <Text style={[styles.title, { color: colors.text }]}>Create your account.</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Start splitting bills with friends.
        </Text>

        <Animated.View style={[styles.form, { transform: [{ translateX: shake }] }]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: inputBorder('name', !!errors.fullName),
                  borderWidth: inputWidth('name', !!errors.fullName),
                  color: colors.text,
                },
              ]}
              placeholder="John Doe"
              placeholderTextColor={colors.textTertiary}
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errors.fullName) setErrors({ ...errors, fullName: undefined });
              }}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {errors.fullName && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.fullName}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: inputBorder('email', !!errors.email),
                  borderWidth: inputWidth('email', !!errors.email),
                  color: colors.text,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            {errors.email && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View
              style={[
                styles.passwordRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: inputBorder('password', !!errors.password),
                  borderWidth: inputWidth('password', !!errors.password),
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Create a password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
            )}
            {password.length > 0 && !errors.password && (
              <View style={styles.reqs}>
                <Req ok={password.length >= 8} label="At least 8 characters" />
                <Req ok={/[A-Z]/.test(password)} label="One uppercase letter" />
                <Req ok={/[0-9]/.test(password)} label="One number" />
                <Req
                  ok={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)}
                  label="One special character"
                />
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: inputBorder('confirm', !!errors.confirm),
                  borderWidth: inputWidth('confirm', !!errors.confirm),
                  color: colors.text,
                },
              ]}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textTertiary}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (errors.confirm) setErrors({ ...errors, confirm: undefined });
              }}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />
            {errors.confirm && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirm}</Text>
            )}
          </View>

          {/* Form-level error */}
          {errors.form && (
            <View style={[styles.formError, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.formErrorText, { color: colors.error }]}>{errors.form}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.primaryPill,
              { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSignup();
            }}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
                  Create account
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerLabel, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          {isAppleSignInAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                isDark
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={9999}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          <TouchableOpacity
            style={[
              styles.socialPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: googleLoading ? 0.6 : 1,
              },
            ]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color={colors.text} />
                <Text style={[styles.socialPillLabel, { color: colors.text }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    width: 40,
    height: 44,
  },
  topLink: {
    ...typography.bodyLarge,
    fontWeight: '700',
  },
  kicker: {
    ...typography.bodyLarge,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.displayLarge,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  subtitle: {
    ...typography.bodyLarge,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    paddingLeft: 4,
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
    ...typography.bodyLarge,
    lineHeight: undefined,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
    ...typography.bodyLarge,
    lineHeight: undefined,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
  },
  reqs: {
    marginTop: 6,
    gap: 4,
    paddingLeft: 4,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqLabel: {
    ...typography.bodySmall,
    fontWeight: '500',
    fontSize: 12,
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  primaryPillLabel: {
    ...typography.button,
    fontSize: 17,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  appleButton: {
    height: 56,
    width: '100%',
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: spacing.sm,
  },
  socialPillLabel: {
    ...typography.button,
    fontSize: 17,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loginLinkText: {
    ...typography.body,
  },
  errorText: {
    ...typography.bodySmall,
    fontSize: 12,
    paddingLeft: 4,
    marginTop: 4,
  },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  formErrorText: {
    flex: 1,
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
