import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import Avatar from '../../components/common/Avatar';
import Header from '../../components/common/Header';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const { themeMode, setThemeMode, colors } = useTheme();

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
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

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.gray50,
    },
    profileCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 16,
      marginBottom: 24,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.gray900,
    },
    profileEmail: {
      fontSize: 14,
      color: colors.gray500,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.gray500,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 8,
      paddingHorizontal: 4,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden' as const,
    },
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <Header title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TouchableOpacity
          style={dynamicStyles.profileCard}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Avatar
            name={userName}
            uri={user?.user_metadata?.avatar_url}
            size="lg"
          />
          <View style={styles.profileInfo}>
            <Text style={dynamicStyles.profileName}>{userName}</Text>
            <Text style={dynamicStyles.profileEmail}>{userEmail}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>

        {/* Account Section */}
        <Text style={dynamicStyles.sectionTitle}>Account</Text>
        <View style={dynamicStyles.section}>
          <SettingsItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            colors={colors}
          />
          <SettingsItem
            icon="key-outline"
            label="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
            colors={colors}
          />
          <SettingsItem
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={() => navigation.navigate('PrivacySettings')}
            colors={colors}
          />
        </View>

        {/* Payments Section */}
        <Text style={dynamicStyles.sectionTitle}>Payments</Text>
        <View style={dynamicStyles.section}>
          <SettingsItem
            icon="card-outline"
            label="Connect Stripe"
            subtitle="Link your account to receive payments"
            onPress={() => navigation.navigate('ConnectStripe')}
            colors={colors}
          />
          <SettingsItem
            icon="time-outline"
            label="Payment History"
            onPress={() => navigation.navigate('PaymentHistory')}
            colors={colors}
          />
        </View>

        {/* Notifications Section */}
        <Text style={dynamicStyles.sectionTitle}>Notifications</Text>
        <View style={dynamicStyles.section}>
          <SettingsItem
            icon="notifications-outline"
            label="Notification Preferences"
            onPress={() => navigation.navigate('NotificationSettings')}
            colors={colors}
          />
        </View>

        {/* Appearance Section */}
        <Text style={dynamicStyles.sectionTitle}>Appearance</Text>
        <View style={dynamicStyles.section}>
          <View style={styles.themeSection}>
            <View style={styles.themeHeader}>
              <Ionicons name="color-palette-outline" size={22} color={colors.gray700} />
              <Text style={[styles.themeLabel, { color: colors.gray900 }]}>Theme</Text>
            </View>
            <View style={styles.themeOptions}>
              <ThemeOption
                label="Light"
                icon="sunny-outline"
                selected={themeMode === 'light'}
                onPress={() => handleThemeChange('light')}
                colors={colors}
              />
              <ThemeOption
                label="Dark"
                icon="moon-outline"
                selected={themeMode === 'dark'}
                onPress={() => handleThemeChange('dark')}
                colors={colors}
              />
              <ThemeOption
                label="System"
                icon="phone-portrait-outline"
                selected={themeMode === 'system'}
                onPress={() => handleThemeChange('system')}
                colors={colors}
              />
            </View>
          </View>
        </View>

        {/* Social Section */}
        <Text style={dynamicStyles.sectionTitle}>Social</Text>
        <View style={dynamicStyles.section}>
          <SettingsItem
            icon="people-outline"
            label="Friends"
            onPress={() => navigation.navigate('Friends')}
            colors={colors}
          />
          <SettingsItem
            icon="people-circle-outline"
            label="Groups"
            onPress={() => navigation.navigate('Groups')}
            colors={colors}
          />
          <SettingsItem
            icon="ban-outline"
            label="Blocked Users"
            onPress={() => navigation.navigate('BlockedUsers')}
            colors={colors}
          />
        </View>

        {/* Support Section */}
        <Text style={dynamicStyles.sectionTitle}>Support</Text>
        <View style={dynamicStyles.section}>
          <SettingsItem
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => Alert.alert(
              'Need Help?',
              'For questions or support, email us at support@zapsplit.app',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@zapsplit.app?subject=ZapSplit%20Support') }
              ]
            )}
            colors={colors}
          />
          <SettingsItem
            icon="chatbubble-outline"
            label="Contact Support"
            onPress={() => Linking.openURL('mailto:support@zapsplit.app?subject=ZapSplit%20Feedback')}
            colors={colors}
          />
          <SettingsItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => navigation.navigate('TermsOfService')}
            colors={colors}
          />
          <SettingsItem
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
            colors={colors}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.gray500 }]}>ZapSplit v1.0.0</Text>
          <Text style={[styles.appCopyright, { color: colors.gray400 }]}>Made with ⚡ in Australia</Text>
        </View>

        {/* Danger Zone */}
        <Text style={[dynamicStyles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
        <View style={[dynamicStyles.section, { borderWidth: 1, borderColor: colors.errorLight }]}>
          <SettingsItem
            icon="trash-outline"
            label="Delete Account"
            onPress={() => navigation.navigate('DeleteAccount')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={colors.error} />}
            colors={colors}
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.surface, borderColor: colors.errorLight }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
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
  colors,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.gray100 }]}
      onPress={onPress}
    >
      <View style={[styles.settingsItemIcon, { backgroundColor: colors.gray100 }]}>
        <Ionicons name={icon as any} size={22} color={colors.gray700} />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={[styles.settingsItemLabel, { color: colors.gray900 }]}>{label}</Text>
        {subtitle && <Text style={[styles.settingsItemSubtitle, { color: colors.gray500 }]}>{subtitle}</Text>}
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
  colors,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.themeOption,
        { backgroundColor: selected ? colors.primaryLight : colors.gray100 },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={selected ? colors.primary : colors.gray500}
      />
      <Text
        style={[
          styles.themeOptionLabel,
          { color: selected ? colors.primary : colors.gray600 },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingsItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
  },
  settingsItemSubtitle: {
    fontSize: 13,
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
  },
  themeOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '500',
  },
  appCopyright: {
    fontSize: 12,
    marginTop: 4,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
