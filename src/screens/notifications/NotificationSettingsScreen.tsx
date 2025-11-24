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
import { colors } from '../../constants/theme';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<any>();
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
      <View style={styles.toggleIconContainer}>
        <Ionicons name={icon as any} size={22} color={colors.gray600} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={preferences?.[key] as boolean}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{ false: colors.gray300, true: colors.primaryLight }}
        thumbColor={preferences?.[key] ? colors.primary : colors.gray100}
        disabled={saving}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        {saving && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.savingIndicator} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Channels */}
        <Text style={styles.sectionTitle}>Notification Channels</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Push Notifications',
            'Receive notifications on your device',
            'push',
            'phone-portrait-outline'
          )}
          <View style={styles.divider} />
          {renderToggle(
            'Email Notifications',
            'Receive notifications via email',
            'email',
            'mail-outline'
          )}
          <View style={styles.divider} />
          {renderToggle(
            'SMS Notifications',
            'Receive notifications via SMS',
            'sms',
            'chatbox-outline'
          )}
        </Card>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Notification Types</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Splits',
            'When you\'re added to a split or it\'s updated',
            'split_notifications',
            'receipt-outline'
          )}
          <View style={styles.divider} />
          {renderToggle(
            'Payments',
            'Payment requests and confirmations',
            'payment_notifications',
            'card-outline'
          )}
          <View style={styles.divider} />
          {renderToggle(
            'Reminders',
            'Reminders for unpaid balances',
            'reminder_notifications',
            'alarm-outline'
          )}
          <View style={styles.divider} />
          {renderToggle(
            'Friends',
            'Friend requests and activity',
            'friend_notifications',
            'people-outline'
          )}
          <View style={styles.divider} />
          {renderToggle(
            'Groups',
            'Group invites and activity',
            'group_notifications',
            'people-circle-outline'
          )}
        </Card>

        {/* Quiet Hours */}
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Enable Quiet Hours',
            'Silence notifications during set times',
            'quiet_hours_enabled',
            'moon-outline'
          )}
          {preferences?.quiet_hours_enabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.quietHoursInfo}>
                <Ionicons name="time-outline" size={20} color={colors.gray500} />
                <Text style={styles.quietHoursText}>
                  {preferences.quiet_hours_start} - {preferences.quiet_hours_end}
                </Text>
                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.gray400} />
          <Text style={styles.infoText}>
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
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
  },
  savingIndicator: {
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
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
    backgroundColor: colors.gray100,
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
    color: colors.gray900,
  },
  toggleDescription: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
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
    color: colors.gray600,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.gray100,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
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
    color: colors.gray400,
    lineHeight: 18,
  },
});
