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
import { spacing } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithApple, isAppleSignInAvailable, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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
      await signIn(email, password);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password'
          : error.message || 'An error occurred during login'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(
          'Sign In Failed',
          error.message || 'An error occurred during Apple Sign In'
        );
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED' && error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(
          'Sign In Failed',
          error.message || 'An error occurred during Google Sign In'
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.gray50 }]}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.gray900 }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.gray500 }]}>
            Log in to continue splitting bills
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.gray600 }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.gray200, color: colors.gray900 }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.gray500}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.gray600 }]}>Password</Text>
            <View style={[styles.passwordContainer, { backgroundColor: colors.surface, borderColor: colors.gray200 }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.gray900 }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.gray500}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.gray500} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          {/* Social Sign In */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.gray200 }]} />
            <Text style={[styles.dividerText, { color: colors.gray500 }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.gray200 }]} />
          </View>

          {/* Apple Sign In - iOS only (official Apple button) */}
          {isAppleSignInAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          {/* Google Sign In - All platforms */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.socialButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.7}
          >
            {googleLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#4285F4" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={[styles.signupLinkText, { color: colors.gray500 }]}>
              Don't have an account?{' '}
              <Text style={[styles.linkText, { color: colors.primary }]}>Sign up</Text>
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
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: spacing.md,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: 16,
  },
  eyeButton: {
    padding: spacing.md,
  },
  loginButton: {
    paddingVertical: spacing.md + 2,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  appleButton: {
    height: 50,
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DADCE0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F1F1F',
    letterSpacing: 0.1,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  signupLink: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signupLinkText: {
    fontSize: 15,
  },
  linkText: {
    fontWeight: '600',
  },
});
