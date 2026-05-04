import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { decode } from 'base64-arraybuffer';

import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import IconCircle from '../../components/common/IconCircle';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const [originalValues, setOriginalValues] = useState({ fullName: '', phone: '' });

  useFocusEffect(
    useCallback(() => {
      if (user) loadProfile();
    }, [user])
  );

  useEffect(() => {
    setHasChanges(
      fullName !== originalValues.fullName || phone !== originalValues.phone
    );
  }, [fullName, phone, originalValues]);

  const loadProfile = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setFullName(data.full_name || '');
      setEmail(user.email || '');
      setPhone(data.phone || '');
      setAvatarUrl(data.avatar_url);
      setOriginalValues({ fullName: data.full_name || '', phone: data.phone || '' });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) await uploadAvatar(result.assets[0]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) await uploadAvatar(result.assets[0]);
  };

  const showImageOptions = () => {
    Alert.alert('Profile photo', 'Choose how you want to update your photo', [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from library', onPress: pickImage },
      ...(avatarUrl
        ? [{ text: 'Remove photo', onPress: removeAvatar, style: 'destructive' as const }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      if (!user || !asset.base64) return;
      setUploadingAvatar(true);
      const fileName = `${user.id}/avatar.jpg`;
      await supabase.storage.from('avatars').remove([fileName]);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(asset.base64), { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;
      setAvatarUrl(newAvatarUrl);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    try {
      if (!user) return;
      setUploadingAvatar(true);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      if (error) throw error;
      setAvatarUrl(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;
      if (!fullName.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
      setOriginalValues({ fullName: fullName.trim(), phone: phone.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const inputBorder = (field: string) =>
    focused === field ? colors.primary : colors.border;
  const inputWidth = (field: string) => (focused === field ? 2 : 1);
  const initial = (fullName?.charAt(0) || email?.charAt(0) || '?').toUpperCase();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Edit profile" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* AVATAR */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={showImageOptions}
              disabled={uploadingAvatar}
              activeOpacity={0.85}
            >
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarInitial, { color: colors.textInverse }]}>
                      {initial}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.cameraBadge,
                    { backgroundColor: colors.primary, borderColor: colors.background },
                  ]}
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator color={colors.textInverse} size="small" />
                  ) : (
                    <Ionicons name="camera" size={14} color={colors.textInverse} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={showImageOptions} disabled={uploadingAvatar} hitSlop={8}>
              <Text style={[styles.changePhoto, { color: colors.primary }]}>
                Change photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM */}
          <View style={styles.section}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: inputBorder('name'),
                    borderWidth: inputWidth('name'),
                    color: colors.text,
                  },
                ]}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <View
                style={[
                  styles.input,
                  styles.disabledInput,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
                  {email}
                </Text>
                <Ionicons name="lock-closed" size={14} color={colors.textTertiary} />
              </View>
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                Contact support to change your email.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: inputBorder('phone'),
                    borderWidth: inputWidth('phone'),
                    color: colors.text,
                  },
                ]}
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                placeholder="+61 4XX XXX XXX"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                Optional. Used for account recovery.
              </Text>
            </View>
          </View>

          {/* SECURITY */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Security
            </Text>
            <Card padding="sm">
              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('ChangePassword')}
                activeOpacity={0.7}
              >
                <IconCircle name="key" tone="info" />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Change password</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </Card>
          </View>

          {/* SAVE */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.primaryPill,
                {
                  backgroundColor: colors.primary,
                  opacity: !hasChanges || saving ? 0.4 : 1,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSave();
              }}
              disabled={!hasChanges || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
                  Save changes
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  changePhoto: {
    ...typography.button,
  },

  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
    paddingLeft: 4,
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
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.bodyLarge,
  },
  disabledInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  disabledText: {
    ...typography.bodyLarge,
  },
  hint: {
    ...typography.caption,
    marginTop: 2,
    paddingLeft: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    minHeight: 60,
  },
  rowLabel: {
    flex: 1,
    ...typography.bodyLarge,
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
