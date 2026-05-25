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
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import IconCircle from '../../components/common/IconCircle';
import StripeActionRequiredBanner from '../../components/common/StripeActionRequiredBanner';

// Friendly Fintech Settings hub.
// Header → groups of rows in cards. Each row uses a soft-blue IconCircle.
// Sign-out as soft-red pill at bottom. Delete account in its own danger card.

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { signOut } = useAuth();
  const { colors } = useTheme();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const Row = ({
    icon,
    label,
    subtitle,
    onPress,
    tone = 'info',
    isLast,
  }: {
    icon: IconName;
    label: string;
    subtitle?: string;
    onPress?: () => void;
    tone?: Tone;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      activeOpacity={0.7}
    >
      <IconCircle name={icon} tone={tone} />
      <View style={styles.rowMain}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* STRIPE ACTION REQUIRED — auto-hides when nothing's due. */}
        <StripeActionRequiredBanner />

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Account
          </Text>
          <Card padding="sm">
            <Row
              icon="person"
              label="Edit profile"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <Row
              icon="key"
              label="Change password"
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <Row
              icon="shield-checkmark"
              label="Privacy & security"
              onPress={() => navigation.navigate('PrivacySettings')}
              isLast
            />
          </Card>
        </View>

        {/* PAYMENTS */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Payments
          </Text>
          <Card padding="sm">
            <Row
              icon="card"
              label="Connect Stripe"
              subtitle="Link your account to receive payments"
              onPress={() => navigation.navigate('ConnectStripe')}
            />
            <Row
              icon="time"
              label="Payment history"
              onPress={() => navigation.navigate('PaymentHistory')}
              isLast
            />
          </Card>
        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Notifications
          </Text>
          <Card padding="sm">
            <Row
              icon="notifications"
              label="Notification preferences"
              onPress={() => navigation.navigate('NotificationSettings')}
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
            />
            <Row
              icon="ban"
              label="Blocked users"
              onPress={() => navigation.navigate('BlockedUsers')}
              isLast
            />
          </Card>
        </View>

        {/* SUPPORT */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Support
          </Text>
          <Card padding="sm">
            <Row
              icon="help-circle"
              label="Help & FAQ"
              onPress={() =>
                Alert.alert(
                  'Need help?',
                  'For questions or support, email us at support@zapsplit.com.au',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Email support',
                      onPress: () =>
                        Linking.openURL('mailto:support@zapsplit.com.au?subject=ZapSplit%20Support'),
                    },
                  ]
                )
              }
            />
            <Row
              icon="chatbubble"
              label="Contact support"
              onPress={() =>
                Linking.openURL('mailto:support@zapsplit.com.au?subject=ZapSplit%20Feedback')
              }
            />
            <Row
              icon="document-text"
              label="Terms of service"
              onPress={() => navigation.navigate('TermsOfService')}
            />
            <Row
              icon="lock-closed"
              label="Privacy policy"
              onPress={() => navigation.navigate('PrivacyPolicy')}
              isLast
            />
          </Card>
        </View>

        {/* APP INFO */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
            ZapSplit v1.0.0
          </Text>
          <Text style={[styles.appCopyright, { color: colors.textTertiary }]}>
            Made in Australia
          </Text>
        </View>

        {/* DANGER */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.error }]}>
            Danger zone
          </Text>
          <Card padding="sm">
            <Row
              icon="trash"
              label="Delete account"
              onPress={() => navigation.navigate('DeleteAccount')}
              tone="error"
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
              handleSignOut();
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    minHeight: 60,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    ...typography.bodyLarge,
  },
  rowSubtitle: {
    ...typography.bodySmall,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  appVersion: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  appCopyright: {
    ...typography.caption,
    marginTop: 2,
  },
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
