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

interface LoginScreenProps {
  navigation: any;
}

// Friendly Fintech Login.
// Display heading + boxed inputs + filled pill primary CTA + pill social buttons.
export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithApple, isAppleSignInAvailable, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  // Subtle horizontal shake on validation failure (iOS-style "no").
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
    if (!email.trim()) next.email = 'Email is required';
    else if (!emailRegex.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      triggerShake();
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      const msg =
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password'
          : error.message || 'Something went wrong, try again.';
      setErrors({ form: msg });
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

  const inputBorder = (focused: boolean, hasError?: boolean) =>
    hasError ? colors.error : focused ? colors.primary : colors.border;
  const inputWidth = (focused: boolean, hasError?: boolean) =>
    hasError || focused ? 2 : 1;

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
        {/* TOP ROW — back + always-visible alternate-path link */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primaryLight }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            hitSlop={12}
            activeOpacity={0.6}
          >
            <Text style={[styles.topLink, { color: colors.primary }]}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* HEADING */}
        <Text style={[styles.kicker, { color: colors.primary }]}>Sign in</Text>
        <Text style={[styles.title, { color: colors.text }]}>Welcome back.</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Log in to keep splitting.
        </Text>

        {/* FORM */}
        <Animated.View style={[styles.form, { transform: [{ translateX: shake }] }]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: inputBorder(emailFocused, !!errors.email),
                  borderWidth: inputWidth(emailFocused, !!errors.email),
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
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
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
                  borderColor: inputBorder(passwordFocused, !!errors.password),
                  borderWidth: inputWidth(passwordFocused, !!errors.password),
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Your password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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
          </View>

          {/* Form-level error (e.g. invalid credentials) */}
          {errors.form && (
            <View style={[styles.formError, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.formErrorText, { color: colors.error }]}>{errors.form}</Text>
            </View>
          )}

          {/* PRIMARY CTA */}
          <TouchableOpacity
            style={[
              styles.primaryPill,
              { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleLogin();
            }}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
                  Log in
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
              </>
            )}
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerLabel, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          {/* APPLE — outlined for visual consistency with Google on dark */}
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

          {/* GOOGLE */}
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
    marginBottom: spacing.xl,
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
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.7,
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
  signupLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  signupLinkText: {
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
