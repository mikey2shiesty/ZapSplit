import React, { useState } from 'react';
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

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
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
      Alert.alert(
        'Login failed',
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password'
          : error.message || 'An error occurred during login'
      );
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

  const inputBorder = (focused: boolean) =>
    focused ? colors.primary : colors.border;

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
        {/* BACK */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* HEADING */}
        <Text style={[styles.title, { color: colors.text }]}>Welcome back.</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Log in to keep splitting.
        </Text>

        {/* FORM */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: inputBorder(emailFocused),
                  borderWidth: emailFocused ? 2 : 1,
                  color: colors.text,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View
              style={[
                styles.passwordRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: inputBorder(passwordFocused),
                  borderWidth: passwordFocused ? 2 : 1,
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Your password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
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
          </View>

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
              <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
                Log in
              </Text>
            )}
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerLabel, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          {/* APPLE */}
          {isAppleSignInAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                isDark
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
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

          {/* SIGN UP LINK */}
          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation.navigate('Signup')}
            hitSlop={8}
          >
            <Text style={[styles.signupLinkText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
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
    paddingVertical: 14,
    ...typography.bodyLarge,
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
  primaryPill: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
});
