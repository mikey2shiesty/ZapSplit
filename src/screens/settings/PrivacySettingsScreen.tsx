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
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  getPrivacySettings,
  updatePrivacySettings,
  getBlockedUsers,
  requestAccountDeletion,
  cancelAccountDeletion,
  getDeletionRequest,
  exportUserData,
  PrivacySettings,
  DeletionRequest,
} from '../../services/privacyService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PrivacySettingsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [blockedCount, setBlockedCount] = useState(0);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [privacySettings, blocked, deletion] = await Promise.all([
        getPrivacySettings(),
        getBlockedUsers(),
        getDeletionRequest(),
      ]);
      setSettings(privacySettings);
      setBlockedCount(blocked.length);
      setDeletionRequest(deletion);
    } catch (error) {
      console.error('Error loading privacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof PrivacySettings, value: boolean) => {
    if (!settings) return;

    const updated = { ...settings, [key]: value };
    setSettings(updated);

    setSaving(true);
    const result = await updatePrivacySettings({ [key]: value });
    setSaving(false);

    if (!result.success) {
      setSettings(settings);
      Alert.alert('Error', result.error || 'Failed to save setting');
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const result = await exportUserData();

      if (!result.success || !result.data) {
        Alert.alert('Error', result.error || 'Failed to export data');
        return;
      }

      // Save to file and share
      const fileName = `zapsplit_data_${Date.now()}.json`;
      const file = new File(Paths.document, fileName);

      await file.write(JSON.stringify(result.data, null, 2));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Your Data',
        });
      } else {
        Alert.alert('Success', 'Data exported to: ' + file.uri);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleRequestDeletion = async () => {
    try {
      const result = await requestAccountDeletion(deleteReason || undefined);

      if (result.success) {
        setShowDeleteConfirm(false);
        setDeleteReason('');
        await loadData();
        Alert.alert(
          'Deletion Scheduled',
          `Your account will be deleted on ${new Date(result.scheduledFor!).toLocaleDateString()}. You can cancel this request within the next 30 days.`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to request deletion');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request deletion');
    }
  };

  const handleCancelDeletion = async () => {
    Alert.alert(
      'Cancel Deletion',
      'Are you sure you want to cancel your account deletion request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel Deletion',
          onPress: async () => {
            const result = await cancelAccountDeletion();
            if (result.success) {
              setDeletionRequest(null);
              Alert.alert('Cancelled', 'Your account deletion has been cancelled.');
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel deletion');
            }
          },
        },
      ]
    );
  };

  const formatDeletionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderToggle = (
    label: string,
    description: string,
    key: keyof PrivacySettings,
    icon: string
  ) => (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIconContainer, { backgroundColor: colors.gray100 }]}>
        <Ionicons name={icon as any} size={22} color={colors.gray600} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={[styles.toggleLabel, { color: colors.gray900 }]}>{label}</Text>
        <Text style={[styles.toggleDescription, { color: colors.gray500 }]}>{description}</Text>
      </View>
      <Switch
        value={settings?.[key] as boolean}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{ false: colors.gray300, true: colors.primaryLight }}
        thumbColor={settings?.[key] ? colors.primary : colors.gray100}
        disabled={saving}
      />
    </View>
  );

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
      <Header
        title="Privacy & Security"
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
        {/* Pending Deletion Banner */}
        {deletionRequest && (
          <Card variant="default" style={[styles.deletionBanner, { backgroundColor: colors.errorLight }]}>
            <View style={styles.deletionBannerContent}>
              <Ionicons name="warning" size={24} color={colors.error} />
              <View style={styles.deletionBannerText}>
                <Text style={[styles.deletionBannerTitle, { color: colors.error }]}>Account Deletion Scheduled</Text>
                <Text style={[styles.deletionBannerDate, { color: colors.gray700 }]}>
                  Your account will be deleted on{'\n'}
                  {formatDeletionDate(deletionRequest.scheduled_for)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.cancelDeletionButton, { backgroundColor: colors.surface }]}
              onPress={handleCancelDeletion}
            >
              <Text style={[styles.cancelDeletionText, { color: colors.primary }]}>Cancel Deletion</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Profile Visibility */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>Profile Visibility</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Public Profile',
            'Allow others to find and view your profile',
            'profile_visible',
            'eye-outline'
          )}
          <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />
          {renderToggle(
            'Online Status',
            'Show when you were last active',
            'show_online_status',
            'radio-button-on-outline'
          )}
          <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />
          {renderToggle(
            'Friend Requests',
            'Allow others to send you friend requests',
            'allow_friend_requests',
            'person-add-outline'
          )}
        </Card>

        {/* Data & Analytics */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>Data & Analytics</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Share Statistics',
            'Help improve the app by sharing anonymous usage data',
            'share_statistics',
            'analytics-outline'
          )}
        </Card>

        {/* Blocked Users */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>Blocked Users</Text>
        <TouchableOpacity
          style={[styles.blockedUsersCard, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('BlockedUsers')}
        >
          <View style={styles.blockedUsersContent}>
            <View style={[styles.blockedIconContainer, { backgroundColor: colors.gray100 }]}>
              <Ionicons name="ban-outline" size={22} color={colors.gray600} />
            </View>
            <View style={styles.blockedTextContainer}>
              <Text style={[styles.blockedUsersLabel, { color: colors.gray900 }]}>Manage Blocked Users</Text>
              <Text style={[styles.blockedUsersCount, { color: colors.gray500 }]}>
                {blockedCount} {blockedCount === 1 ? 'user' : 'users'} blocked
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>

        {/* Data Export */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>Your Data</Text>
        <Card variant="default" style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleExportData}
            disabled={exporting}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="download-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionLabel, { color: colors.gray900 }]}>Export Your Data</Text>
              <Text style={[styles.actionDescription, { color: colors.gray500 }]}>
                Download a copy of all your ZapSplit data
              </Text>
            </View>
            {exporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            )}
          </TouchableOpacity>
        </Card>

        {/* Delete Account */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>Danger Zone</Text>
        <Card variant="default" style={[styles.dangerCard, { borderColor: colors.errorLight }]}>
          {!showDeleteConfirm ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteConfirm(true)}
              disabled={!!deletionRequest}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <View style={styles.deleteContent}>
                <Text style={[styles.deleteLabel, { color: colors.error }]}>Delete Account</Text>
                <Text style={[styles.deleteDescription, { color: colors.gray500 }]}>
                  Permanently delete your account and all data
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.deleteConfirmContainer}>
              <Text style={[styles.deleteConfirmTitle, { color: colors.error }]}>Delete Your Account?</Text>
              <Text style={[styles.deleteConfirmText, { color: colors.gray600 }]}>
                This will permanently delete your account, including all splits, payments, and friendships.
                You have 30 days to change your mind.
              </Text>
              <TextInput
                style={[styles.deleteReasonInput, { borderColor: colors.gray200, color: colors.gray900, backgroundColor: colors.gray50 }]}
                placeholder="Why are you leaving? (optional)"
                placeholderTextColor={colors.gray400}
                value={deleteReason}
                onChangeText={setDeleteReason}
                multiline
                numberOfLines={3}
              />
              <View style={styles.deleteConfirmButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.gray100 }]}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeleteReason('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.gray700 }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmDeleteButton, { backgroundColor: colors.error }]}
                  onPress={handleRequestDeletion}
                >
                  <Text style={[styles.confirmDeleteText, { color: colors.surface }]}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.gray400} />
          <Text style={[styles.infoText, { color: colors.gray400 }]}>
            Your data is encrypted and stored securely. We comply with GDPR and Australian privacy laws.
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
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm + 4,
    marginTop: spacing.sm,
  },
  card: {
    padding: 0,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
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
    marginLeft: spacing.sm + 4,
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
  blockedUsersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  blockedUsersContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedTextContainer: {
    marginLeft: spacing.sm + 4,
  },
  blockedUsersLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  blockedUsersCount: {
    fontSize: 13,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: spacing.sm + 4,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  dangerCard: {
    padding: 0,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  deleteContent: {
    flex: 1,
    marginLeft: spacing.sm + 4,
  },
  deleteLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteConfirmContainer: {
    padding: spacing.md,
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  deleteConfirmText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  deleteReasonInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deletionBanner: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  deletionBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
  },
  deletionBannerText: {
    flex: 1,
  },
  deletionBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  deletionBannerDate: {
    fontSize: 14,
    lineHeight: 20,
  },
  cancelDeletionButton: {
    marginTop: spacing.sm + 4,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  cancelDeletionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: 4,
    marginBottom: 40,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
