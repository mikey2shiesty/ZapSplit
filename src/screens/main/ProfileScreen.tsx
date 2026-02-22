import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Fetch profile when screen focuses (to get updated avatar after editing)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchProfile();
      }
    }, [user?.id])
  );

  const fetchProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      setProfile(data);
    }
  };

  const MenuItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={22} color={colors.gray600} />
      <Text style={[styles.menuItemText, { color: colors.gray900 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, paddingTop: insets.top + 10 }]}>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <Avatar
            uri={profile?.avatar_url ?? undefined}
            name={profile?.full_name || user?.email || 'User'}
            size="xl"
            showBorder
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.gray900 }]}>
              {profile?.full_name || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.gray500 }]}>
              {profile?.email || user?.email}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.gray100 }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Payments Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>PAYMENTS</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
            <MenuItem
              icon="time-outline"
              label="Payment History"
              onPress={() => navigation.navigate('PaymentHistory')}
            />
          </View>
        </View>

        {/* Social Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>SOCIAL</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
            <MenuItem
              icon="people-outline"
              label="Friends"
              onPress={() => navigation.navigate('Friends')}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.gray200 }]} />
            <MenuItem
              icon="people-circle-outline"
              label="Groups"
              onPress={() => navigation.navigate('Groups')}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>ACCOUNT</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
            <MenuItem
              icon="settings-outline"
              label="Settings"
              onPress={() => navigation.navigate('Settings')}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.gray200 }]} />
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => navigation.navigate('HelpSupport')}
            />
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  profileCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 15,
  },
  editButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.sm,
  },
  menuGroup: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginLeft: spacing.md + 22 + spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
});
