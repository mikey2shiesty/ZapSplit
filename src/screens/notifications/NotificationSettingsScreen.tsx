import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
} from '../../services/notificationService';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadPreferences();
    }
  }, [currentUserId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadPreferences = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const prefs = await getNotificationPreferences(currentUserId);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!currentUserId || !preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    setSaving(true);
    const success = await updateNotificationPreferences(currentUserId, { [key]: value });
    setSaving(false);

    if (!success) {
      // Revert on failure
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to save preference');
    }
  };

  const renderToggle = (
    label: string,
    description: string,
    key: keyof NotificationPreferences,
    icon: string
  ) => (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIconContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon as any} size={22} color={colors.textSecondary} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        value={preferences?.[key] as boolean}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={preferences?.[key] ? colors.primary : colors.surface}
        disabled={saving}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Header
        title="Notification Settings"
        onBack={() => navigation.goBack()}
        rightElement={
          saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={{ width: 44 }} />
          )
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Channels */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notification Channels</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Push Notifications',
            'Receive notifications on your device',
            'push',
            'phone-portrait-outline'
          )}
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
          {renderToggle(
            'Email Notifications',
            'Receive notifications via email',
            'email',
            'mail-outline'
          )}
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
          {renderToggle(
            'SMS Notifications',
            'Receive notifications via SMS',
            'sms',
            'chatbox-outline'
          )}
        </Card>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notification Types</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Splits',
            'When you\'re added to a split or it\'s updated',
            'split_notifications',
            'receipt-outline'
          )}
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
          {renderToggle(
            'Payments',
            'Payment requests and confirmations',
            'payment_notifications',
            'card-outline'
          )}
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
          {renderToggle(
            'Reminders',
            'Reminders for unpaid balances',
            'reminder_notifications',
            'alarm-outline'
          )}
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
          {renderToggle(
            'Friends',
            'Friend requests and activity',
            'friend_notifications',
            'people-outline'
          )}
          <View style={[styles.divider, { backgroundColor: colors.surface }]} />
          {renderToggle(
            'Groups',
            'Group invites and activity',
            'group_notifications',
            'people-circle-outline'
          )}
        </Card>

        {/* Quiet Hours */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quiet Hours</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Enable Quiet Hours',
            'Silence notifications during set times',
            'quiet_hours_enabled',
            'moon-outline'
          )}
          {preferences?.quiet_hours_enabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.surface }]} />
              <View style={styles.quietHoursInfo}>
                <View style={styles.toggleIconContainer}>
                  <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                </View>
                <Text style={[styles.quietHoursText, { color: colors.textSecondary }]}>
                  11:00 PM - 8:00 AM
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
          <Text style={[styles.infoText, { color: colors.textTertiary }]}>
            You can also manage notifications in your device settings.
          </Text>
        </View>
      </ScrollView>

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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toggleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContent: {
    flex: 1,
    marginLeft: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  quietHoursInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    gap: 8,
  },
  quietHoursText: {
    flex: 1,
    fontSize: 15,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 40,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
