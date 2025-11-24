import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../constants/theme';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card variant="elevated" padding="lg" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              name={user?.user_metadata?.full_name || user?.email || 'User'}
              size="xl"
              showBorder
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {user?.user_metadata?.full_name || 'User'}
              </Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments</Text>

          <TouchableOpacity onPress={() => navigation.navigate('ConnectStripe')}>
            <Card style={styles.menuCard}>
              <View style={styles.menuItemRow}>
                <Ionicons name="card-outline" size={20} color={colors.text} />
                <Text style={styles.menuItem}>Connect Stripe Account</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('PaymentHistory')}>
            <Card style={styles.menuCard}>
              <View style={styles.menuItemRow}>
                <Ionicons name="time-outline" size={20} color={colors.text} />
                <Text style={styles.menuItem}>Payment History</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social</Text>

          <TouchableOpacity onPress={() => navigation.navigate('Friends')}>
            <Card style={styles.menuCard}>
              <View style={styles.menuItemRow}>
                <Ionicons name="people-outline" size={20} color={colors.text} />
                <Text style={styles.menuItem}>Friends</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
            <Card style={styles.menuCard}>
              <View style={styles.menuItemRow}>
                <Ionicons name="people-circle-outline" size={20} color={colors.text} />
                <Text style={styles.menuItem}>Groups</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.menuCard}>
            <View style={styles.menuItemRow}>
              <Ionicons name="person-outline" size={20} color={colors.text} />
              <Text style={styles.menuItem}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
          <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')}>
            <Card style={styles.menuCard}>
              <View style={styles.menuItemRow}>
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
                <Text style={styles.menuItem}>Notification Settings</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacySettings')}>
            <Card style={styles.menuCard}>
              <View style={styles.menuItemRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
                <Text style={styles.menuItem}>Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        <Button
          variant="outline"
          onPress={signOut}
        >
          Log Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  profileCard: {
    marginTop: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  menuCard: {
    marginBottom: spacing.xs,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItem: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
});
