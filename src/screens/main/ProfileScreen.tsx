import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Card from '../../components/common/Card';
import IconCircle from '../../components/common/IconCircle';
import SwipeableTabScreen from '../../components/common/SwipeableTabScreen';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

// Friendly Fintech Profile screen.
// Avatar header with name + email, edit pill. Settings rows in a card with
// soft-blue icon circles (Coinbase pattern). Sign out as soft-red pill at bottom.

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);

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
    if (data && !error) setProfile(data);
  };

  const initial = (profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?').toUpperCase();

  type IconName = keyof typeof Ionicons.glyphMap;
  type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral';
  interface RowProps {
    icon: IconName;
    label: string;
    onPress: () => void;
    tone?: Tone;
    isLast?: boolean;
  }
  const Row = ({ icon, label, onPress, tone = 'info', isLast }: RowProps) => (
    <TouchableOpacity
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <IconCircle name={icon} tone={tone} />
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SwipeableTabScreen>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* AVATAR + NAME */}
        <View style={styles.section}>
          <Card>
            <View style={styles.avatarRow}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarInitial, { color: colors.textInverse }]}>
                    {initial}
                  </Text>
                </View>
              )}
              <View style={styles.avatarInfo}>
                <Text
                  style={[styles.profileName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {profile?.full_name || 'Add your name'}
                </Text>
                <Text
                  style={[styles.profileEmail, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {profile?.email || user?.email}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.editPill, { backgroundColor: colors.primaryLight }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('EditProfile');
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.editPillLabel, { color: colors.primary }]}>
                Edit profile
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* PAYMENTS */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Payments
          </Text>
          <Card padding="sm">
            <Row
              icon="time"
              label="Payment history"
              onPress={() => navigation.navigate('PaymentHistory')}
              isLast
            />
          </Card>
        </View>

        {/* SOCIAL */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Social
          </Text>
          <Card padding="sm">
            <Row
              icon="people"
              label="Friends"
              onPress={() => navigation.navigate('Friends')}
            />
            <Row
              icon="people-circle"
              label="Groups"
              onPress={() => navigation.navigate('Groups')}
              isLast
            />
          </Card>
        </View>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Account
          </Text>
          <Card padding="sm">
            <Row
              icon="settings"
              label="Settings"
              onPress={() => navigation.navigate('Settings')}
            />
            <Row
              icon="help-circle"
              label="Help & support"
              onPress={() => navigation.navigate('HelpSupport')}
              isLast
            />
          </Card>
        </View>

        {/* SIGN OUT */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.signOutPill, { backgroundColor: colors.errorLight }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              signOut();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out" size={18} color={colors.error} />
            <Text style={[styles.signOutLabel, { color: colors.error }]}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.displayLarge,
    textAlign: 'center',
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

  // Avatar card
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '700',
  },
  avatarInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...typography.displayMedium,
  },
  profileEmail: {
    ...typography.body,
  },
  editPill: {
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  editPillLabel: {
    ...typography.button,
  },

  // Settings rows
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

  // Sign out
  signOutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.pill,
  },
  signOutLabel: {
    ...typography.button,
  },
});
