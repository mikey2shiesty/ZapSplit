import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import {
  getFriendProfile,
  toggleFavorite,
  removeFriend,
  FriendProfile
} from '../../services/friendService';
import { blockUser, reportUser, ReportReason } from '../../services/privacyService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';

type FriendProfileRouteProp = RouteProp<RootStackParamList, 'FriendProfile'>;

export default function FriendProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<FriendProfileRouteProp>();
  const { friendId } = route.params;
  const { colors } = useTheme();

  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadProfile();
    }
  }, [currentUserId, friendId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadProfile = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const data = await getFriendProfile(currentUserId, friendId);
      setProfile(data);
    } catch (error) {
      console.error('Error loading friend profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!profile) return;

    try {
      setActionLoading(true);
      const result = await toggleFavorite(profile.friendship_id, !profile.is_favorite);
      if (result.success) {
        setProfile({ ...profile, is_favorite: !profile.is_favorite });
      } else {
        Alert.alert('Error', result.error || 'Failed to update favorite');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${profile?.full_name} as a friend?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!profile) return;

            try {
              setActionLoading(true);
              const result = await removeFriend(profile.friendship_id);
              if (result.success) {
                navigation.goBack();
              } else {
                Alert.alert('Error', result.error || 'Failed to remove friend');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Block ${profile?.full_name}? They won't be able to see your profile or send you requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            if (!profile) return;

            try {
              setActionLoading(true);
              // Remove friend first
              await removeFriend(profile.friendship_id);
              // Then block
              const result = await blockUser(friendId);
              if (result.success) {
                Alert.alert('Blocked', `${profile.full_name} has been blocked.`);
                navigation.goBack();
              } else {
                Alert.alert('Error', result.error || 'Failed to block user');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to block user');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spam',
          onPress: () => submitReport('spam'),
        },
        {
          text: 'Harassment',
          onPress: () => submitReport('harassment'),
        },
        {
          text: 'Fraud',
          onPress: () => submitReport('fraud'),
        },
        {
          text: 'Other',
          onPress: () => submitReport('other'),
        },
      ]
    );
  };

  const submitReport = async (reason: ReportReason) => {
    try {
      setActionLoading(true);
      const result = await reportUser(friendId, reason);
      if (result.success) {
        Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.');
      } else {
        Alert.alert('Error', result.error || 'Failed to submit report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.gray50 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.gray50 }]}>
        <Ionicons name="person-outline" size={64} color={colors.gray300} />
        <Text style={[styles.errorText, { color: colors.gray600 }]}>Friend not found</Text>
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <Header
        title="Friend Profile"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={actionLoading}
          >
            <Ionicons
              name={profile.is_favorite ? 'star' : 'star-outline'}
              size={24}
              color={profile.is_favorite ? colors.warning : colors.gray500}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <Avatar
            name={profile.full_name}
            uri={profile.avatar_url || undefined}
            size="xl"
            showBorder
          />
          <Text style={[styles.name, { color: colors.gray900 }]}>{profile.full_name}</Text>
          {profile.username && (
            <Text style={[styles.username, { color: colors.primary }]}>@{profile.username}</Text>
          )}
          <Text style={[styles.email, { color: colors.gray500 }]}>{profile.email}</Text>
        </Card>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.gray900 }]}>{profile.splits_together}</Text>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>Splits Together</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, profile.total_you_owe > 0 ? { color: colors.error } : { color: colors.gray900 }]}>
              ${profile.total_you_owe.toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>You Owe</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, profile.total_they_owe > 0 ? { color: colors.success } : { color: colors.gray900 }]}>
              ${profile.total_they_owe.toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>They Owe</Text>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Actions</Text>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.gray900 }]}>View Shared Splits</Text>
              <Text style={[styles.actionSubtitle, { color: colors.gray500 }]}>See all splits with this friend</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.gray900 }]}>Create Split</Text>
              <Text style={[styles.actionSubtitle, { color: colors.gray500 }]}>Start a new split with this friend</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.gray900 }]}>Send Reminder</Text>
              <Text style={[styles.actionSubtitle, { color: colors.gray500 }]}>Remind about pending payments</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.dangerSection, { borderTopColor: colors.gray200 }]}>
          <Text style={[styles.dangerSectionTitle, { color: colors.gray500 }]}>Manage</Text>

          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: colors.error }]}
            onPress={handleRemoveFriend}
            disabled={actionLoading}
          >
            <Ionicons name="person-remove-outline" size={20} color={colors.error} />
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>Remove Friend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerButton, styles.blockButton, { borderColor: colors.error }]}
            onPress={handleBlockUser}
            disabled={actionLoading}
          >
            <Ionicons name="ban-outline" size={20} color={colors.error} />
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>Block User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerButton, styles.reportButton, { borderColor: colors.warning }]}
            onPress={handleReportUser}
            disabled={actionLoading}
          >
            <Ionicons name="flag-outline" size={20} color={colors.warning} />
            <Text style={[styles.dangerButtonText, { color: colors.warning }]}>Report User</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: spacing.md,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  username: {
    fontSize: 16,
    marginTop: spacing.xs,
  },
  email: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: radius.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: radius.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: radius.md,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: 13,
    marginTop: spacing.xxs,
  },
  dangerSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    marginBottom: 40,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: radius.md,
  },
  blockButton: {
    marginTop: spacing.sm,
  },
  reportButton: {
    marginTop: spacing.sm,
  },
});
