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
import { colors } from '../../constants/theme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PrivacySettingsScreen() {
  const navigation = useNavigation<any>();
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
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(result.data, null, 2)
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Your Data',
        });
      } else {
        Alert.alert('Success', 'Data exported to: ' + filePath);
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
      <View style={styles.toggleIconContainer}>
        <Ionicons name={icon as any} size={22} color={colors.gray600} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
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
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        {saving && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.savingIndicator} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pending Deletion Banner */}
        {deletionRequest && (
          <Card variant="default" style={styles.deletionBanner}>
            <View style={styles.deletionBannerContent}>
              <Ionicons name="warning" size={24} color={colors.error} />
              <View style={styles.deletionBannerText}>
                <Text style={styles.deletionBannerTitle}>Account Deletion Scheduled</Text>
                <Text style={styles.deletionBannerDate}>
                  Your account will be deleted on{'\n'}
                  {formatDeletionDate(deletionRequest.scheduled_for)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cancelDeletionButton}
              onPress={handleCancelDeletion}
            >
              <Text style={styles.cancelDeletionText}>Cancel Deletion</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Profile Visibility */}
        <Text style={styles.sectionTitle}>Profile Visibility</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Public Profile',
            'Allow others to find and view your profile',
            'profile_visible',
            'eye-outline'
          )}
          <View style={styles.divider} />
          {renderToggle(
            'Online Status',
            'Show when you were last active',
            'show_online_status',
            'radio-button-on-outline'
          )}
          <View style={styles.divider} />
          {renderToggle(
            'Friend Requests',
            'Allow others to send you friend requests',
            'allow_friend_requests',
            'person-add-outline'
          )}
        </Card>

        {/* Data & Analytics */}
        <Text style={styles.sectionTitle}>Data & Analytics</Text>
        <Card variant="default" style={styles.card}>
          {renderToggle(
            'Share Statistics',
            'Help improve the app by sharing anonymous usage data',
            'share_statistics',
            'analytics-outline'
          )}
        </Card>

        {/* Blocked Users */}
        <Text style={styles.sectionTitle}>Blocked Users</Text>
        <TouchableOpacity
          style={styles.blockedUsersCard}
          onPress={() => navigation.navigate('BlockedUsers')}
        >
          <View style={styles.blockedUsersContent}>
            <View style={styles.blockedIconContainer}>
              <Ionicons name="ban-outline" size={22} color={colors.gray600} />
            </View>
            <View style={styles.blockedTextContainer}>
              <Text style={styles.blockedUsersLabel}>Manage Blocked Users</Text>
              <Text style={styles.blockedUsersCount}>
                {blockedCount} {blockedCount === 1 ? 'user' : 'users'} blocked
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>

        {/* Data Export */}
        <Text style={styles.sectionTitle}>Your Data</Text>
        <Card variant="default" style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleExportData}
            disabled={exporting}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="download-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>Export Your Data</Text>
              <Text style={styles.actionDescription}>
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
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <Card variant="default" style={styles.dangerCard}>
          {!showDeleteConfirm ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteConfirm(true)}
              disabled={!!deletionRequest}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <View style={styles.deleteContent}>
                <Text style={styles.deleteLabel}>Delete Account</Text>
                <Text style={styles.deleteDescription}>
                  Permanently delete your account and all data
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.deleteConfirmContainer}>
              <Text style={styles.deleteConfirmTitle}>Delete Your Account?</Text>
              <Text style={styles.deleteConfirmText}>
                This will permanently delete your account, including all splits, payments, and friendships.
                You have 30 days to change your mind.
              </Text>
              <TextInput
                style={styles.deleteReasonInput}
                placeholder="Why are you leaving? (optional)"
                placeholderTextColor={colors.gray400}
                value={deleteReason}
                onChangeText={setDeleteReason}
                multiline
                numberOfLines={3}
              />
              <View style={styles.deleteConfirmButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeleteReason('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={handleRequestDeletion}
                >
                  <Text style={styles.confirmDeleteText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.gray400} />
          <Text style={styles.infoText}>
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
  blockedUsersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  blockedUsersContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedTextContainer: {
    marginLeft: 12,
  },
  blockedUsersLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  blockedUsersCount: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  actionDescription: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  dangerCard: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.errorLight,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deleteContent: {
    flex: 1,
    marginLeft: 12,
  },
  deleteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  deleteDescription: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  deleteConfirmContainer: {
    padding: 16,
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 8,
  },
  deleteConfirmText: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteReasonInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray900,
    backgroundColor: colors.gray50,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray700,
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  deletionBanner: {
    backgroundColor: colors.errorLight,
    padding: 16,
    marginBottom: 24,
  },
  deletionBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  deletionBannerText: {
    flex: 1,
  },
  deletionBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 4,
  },
  deletionBannerDate: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
  },
  cancelDeletionButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  cancelDeletionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  infoFooter: {
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
