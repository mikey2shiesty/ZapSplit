import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../constants/theme';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

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
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.menuCard}>
            <Text style={styles.menuItem}>Edit Profile</Text>
          </Card>
          <Card style={styles.menuCard}>
            <Text style={styles.menuItem}>Payment Methods</Text>
          </Card>
          <Card style={styles.menuCard}>
            <Text style={styles.menuItem}>Settings</Text>
          </Card>
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
  menuItem: {
    ...typography.body,
    color: colors.text,
  },
});
