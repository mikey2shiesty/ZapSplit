import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabase';
import { radius } from '../../constants/theme';

interface Props {
  userId: string;
  onComplete: () => void;
}

export default function NameOnboardingScreen({ userId, onComplete }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', userId);

      await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });

      onComplete();
    } catch (error) {
      console.error('Error saving name:', error);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const isValid = name.trim().length >= 2;
  const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('');

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Center everything vertically */}
        <View style={styles.centerContent}>
          {/* Avatar preview */}
          <View style={[styles.avatar, { backgroundColor: name.trim() ? colors.primary : colors.primary + '20' }]}>
            {name.trim() ? (
              <Text style={styles.avatarInitials}>{initials || '?'}</Text>
            ) : (
              <Ionicons name="person" size={36} color={colors.primary} />
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>What's your name?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This is how friends see you on splits
          </Text>

          {/* Input */}
          <View style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderColor: name.trim() ? colors.primary : colors.border,
            },
          ]}>
            <Ionicons name="person-outline" size={20} color={name.trim() ? colors.primary : colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="First and last name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            {name.trim().length > 0 && (
              <TouchableOpacity onPress={() => setName('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isValid ? colors.primary : colors.surface,
                opacity: isValid && !saving ? 1 : 0.6,
              },
            ]}
            onPress={handleContinue}
            disabled={!isValid || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={[styles.buttonText, { color: isValid ? colors.textInverse : colors.textSecondary }]}>
                  Get started
                </Text>
                {isValid && <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
              </View>
            )}
          </TouchableOpacity>

        </View>

        {/* Footer note - pinned to bottom */}
        <View style={[styles.footerNote, { paddingBottom: insets.bottom + 16 }]}>
          <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            You can change this anytime in settings
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: -40,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 36,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    height: '100%',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
  },
});
