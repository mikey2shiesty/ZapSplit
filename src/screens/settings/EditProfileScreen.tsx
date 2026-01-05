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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { decode } from 'base64-arraybuffer';

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

  // Original values to track changes
  const [originalValues, setOriginalValues] = useState({
    fullName: '',
    phone: '',
  });

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadProfile();
      }
    }, [user])
  );

  useEffect(() => {
    // Check if values have changed
    const changed =
      fullName !== originalValues.fullName ||
      phone !== originalValues.phone;
    setHasChanges(changed);
  }, [fullName, phone, originalValues]);

  const loadProfile = async () => {
    try {
      if (!user) return;

      console.log('Loading profile for user:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Profile loaded:', { data, error });
      console.log('Avatar URL from DB:', data?.avatar_url);

      if (error) throw error;

      setFullName(data.full_name || '');
      setEmail(user.email || '');
      setPhone(data.phone || '');
      setAvatarUrl(data.avatar_url);

      setOriginalValues({
        fullName: data.full_name || '',
        phone: data.phone || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos to change your avatar.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your camera to take a photo.');
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose how you want to update your photo',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        ...(avatarUrl ? [{ text: 'Remove Photo', onPress: removeAvatar, style: 'destructive' as const }] : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      if (!user || !asset.base64) {
        Alert.alert('Error', 'No user or image data');
        return;
      }

      setUploadingAvatar(true);
      console.log('Uploading avatar for user:', user.id);

      // Always use jpg for consistency
      const fileName = `${user.id}/avatar.jpg`;
      const contentType = 'image/jpeg';

      // First try to remove existing file (ignore errors)
      await supabase.storage.from('avatars').remove([fileName]);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(asset.base64), {
          contentType,
          upsert: true,
        });

      console.log('Upload result:', { uploadData, uploadError });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      console.log('New avatar URL:', newAvatarUrl);

      // Update profile
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id)
        .select();

      console.log('Profile update result:', { updateData, updateError });

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setAvatarUrl(newAvatarUrl);
      Alert.alert('Success', 'Profile photo updated!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    try {
      if (!user) return;

      setUploadingAvatar(true);

      // Update profile to remove avatar
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarUrl(null);
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      Alert.alert('Error', error.message || 'Failed to remove photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      // Validate
      if (!fullName.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }

      setSaving(true);

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update user metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      setOriginalValues({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.gray50 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <Header title="Edit Profile" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={showImageOptions}
              disabled={uploadingAvatar}
            >
              <Avatar
                name={fullName || 'User'}
                uri={avatarUrl || undefined}
                size="xl"
              />
              {uploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={colors.surface} />
                </View>
              ) : (
                <View style={[styles.cameraIcon, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                  <Ionicons name="camera" size={16} color={colors.surface} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={showImageOptions} disabled={uploadingAvatar}>
              <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.gray700 }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.gray200, color: colors.gray900 }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your name"
                placeholderTextColor={colors.gray400}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.gray700 }]}>Email</Text>
              <View style={styles.disabledInputContainer}>
                <TextInput
                  style={[styles.input, styles.disabledInput, { backgroundColor: colors.gray100, borderColor: colors.gray200, color: colors.gray500 }]}
                  value={email}
                  editable={false}
                />
                <Ionicons name="lock-closed" size={16} color={colors.gray400} style={styles.lockIcon} />
              </View>
              <Text style={[styles.inputHint, { color: colors.gray400 }]}>
                Contact support to change your email address
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.gray700 }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.gray200, color: colors.gray900 }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.gray400}
                keyboardType="phone-pad"
              />
              <Text style={[styles.inputHint, { color: colors.gray400 }]}>
                Optional - used for account recovery
              </Text>
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.securitySection}>
            <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>Security</Text>
            <TouchableOpacity
              style={[styles.securityButton, { backgroundColor: colors.surface, borderColor: colors.gray200 }]}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <View style={styles.securityButtonContent}>
                <Ionicons name="key-outline" size={22} color={colors.gray700} />
                <Text style={[styles.securityButtonText, { color: colors.gray900 }]}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            <Button
              variant="primary"
              onPress={handleSave}
              loading={saving}
              disabled={!hasChanges || saving}
              fullWidth
            >
              Save Changes
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  disabledInputContainer: {
    position: 'relative',
  },
  disabledInput: {
  },
  lockIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
  },
  securitySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  securityButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveSection: {
    marginBottom: 40,
  },
});
