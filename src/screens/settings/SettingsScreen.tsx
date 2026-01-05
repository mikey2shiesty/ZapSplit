import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/common/Avatar';
import Header from '../../components/common/Header';
import { colors, shadows } from '../../constants/theme';

const THEME_KEY = '@zapsplit_theme';

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) {
        setThemeMode(saved as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem(THEME_KEY, mode);
      // Note: Full theme implementation would require a ThemeContext
      // For now, this just saves the preference
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const userName = user?.user_metadata?.full_name || 'User';
  const userEmail = user?.email || '';

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Avatar
            name={userName}
            uri={user?.user_metadata?.avatar_url}
            size="lg"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingsItem
            icon="key-outline"
            label="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingsItem
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={() => navigation.navigate('PrivacySettings')}
          />
        </View>

        {/* Payments Section */}
        <Text style={styles.sectionTitle}>Payments</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="card-outline"
            label="Connect Stripe"
            subtitle="Link your account to receive payments"
            onPress={() => navigation.navigate('ConnectStripe')}
          />
          <SettingsItem
            icon="time-outline"
            label="Payment History"
            onPress={() => navigation.navigate('PaymentHistory')}
          />
        </View>

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="notifications-outline"
            label="Notification Preferences"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.section}>
          <View style={styles.themeSection}>
            <View style={styles.themeHeader}>
              <Ionicons name="color-palette-outline" size={22} color={colors.gray700} />
              <Text style={styles.themeLabel}>Theme</Text>
            </View>
            <View style={styles.themeOptions}>
              <ThemeOption
                label="Light"
                icon="sunny-outline"
                selected={themeMode === 'light'}
                onPress={() => handleThemeChange('light')}
              />
              <ThemeOption
                label="Dark"
                icon="moon-outline"
                selected={themeMode === 'dark'}
                onPress={() => handleThemeChange('dark')}
              />
              <ThemeOption
                label="System"
                icon="phone-portrait-outline"
                selected={themeMode === 'system'}
                onPress={() => handleThemeChange('system')}
              />
            </View>
          </View>
        </View>

        {/* Social Section */}
        <Text style={styles.sectionTitle}>Social</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="people-outline"
            label="Friends"
            onPress={() => navigation.navigate('Friends')}
          />
          <SettingsItem
            icon="people-circle-outline"
            label="Groups"
            onPress={() => navigation.navigate('Groups')}
          />
          <SettingsItem
            icon="ban-outline"
            label="Blocked Users"
            onPress={() => navigation.navigate('BlockedUsers')}
          />
        </View>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => Alert.alert('Help', 'Help center coming soon!')}
          />
          <SettingsItem
            icon="chatbubble-outline"
            label="Contact Support"
            onPress={() => Alert.alert('Contact', 'support@zapsplit.com')}
          />
          <SettingsItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => navigation.navigate('TermsOfService')}
          />
          <SettingsItem
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>ZapSplit v1.0.0</Text>
          <Text style={styles.appCopyright}>Made with ⚡ in Australia</Text>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        <View style={[styles.section, styles.dangerSection]}>
          <SettingsItem
            icon="trash-outline"
            label="Delete Account"
            onPress={() => navigation.navigate('DeleteAccount')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.error} />}
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// Settings Item Component
function SettingsItem({
  icon,
  label,
  subtitle,
  onPress,
  rightElement,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemIcon}>
        <Ionicons name={icon as any} size={22} color={colors.gray700} />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.gray400} />}
    </TouchableOpacity>
  );
}

// Theme Option Component
function ThemeOption({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.themeOption, selected && styles.themeOptionSelected]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={selected ? colors.primary : colors.gray500}
      />
      <Text style={[styles.themeOptionLabel, selected && styles.themeOptionLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingsItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingsItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray900,
  },
  settingsItemSubtitle: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  themeSection: {
    padding: 16,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray900,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  themeOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  themeOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray600,
  },
  themeOptionLabelSelected: {
    color: colors.primary,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  appVersion: {
    fontSize: 14,
    color: colors.gray500,
    fontWeight: '500',
  },
  appCopyright: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 4,
  },
  dangerTitle: {
    color: colors.error,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: colors.errorLight,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.errorLight,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  bottomSpacer: {
    height: 40,
  },
});
