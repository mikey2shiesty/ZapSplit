import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getBlockedUsers, unblockUser, BlockedUser } from '../../services/privacyService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

export default function BlockedUsersScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadBlockedUsers();
    }, [])
  );

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const users = await getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBlockedUsers();
    setRefreshing(false);
  };

  const handleUnblock = (user: BlockedUser) => {
    const name = user.profile?.full_name || 'this user';
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${name}? They will be able to send you friend requests again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              setUnblocking(user.blocked_id);
              const result = await unblockUser(user.blocked_id);
              if (result.success) {
                setBlockedUsers(prev => prev.filter(u => u.blocked_id !== user.blocked_id));
              } else {
                Alert.alert('Error', result.error || 'Failed to unblock user');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user');
            } finally {
              setUnblocking(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => {
    const profile = item.profile;
    const isUnblocking = unblocking === item.blocked_id;

    return (
      <Card variant="default" style={styles.userCard}>
        <View style={styles.userInfo}>
          <Avatar
            name={profile?.full_name || 'Unknown'}
            uri={profile?.avatar_url || undefined}
            size="md"
          />
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.gray900 }]}>{profile?.full_name || 'Unknown User'}</Text>
            <Text style={[styles.userEmail, { color: colors.gray500 }]}>{profile?.email || 'No email'}</Text>
            <Text style={[styles.blockedDate, { color: colors.gray400 }]}>Blocked {formatDate(item.created_at)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.unblockButton, { backgroundColor: colors.primaryLight }, isUnblocking && styles.unblockButtonDisabled]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.unblockButtonText, { color: colors.primary }]}>Unblock</Text>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.gray100 }]}>
        <Ionicons name="ban-outline" size={48} color={colors.gray300} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.gray900 }]}>No Blocked Users</Text>
      <Text style={[styles.emptySubtitle, { color: colors.gray500 }]}>
        Users you block won't be able to see your profile or send you friend requests.
      </Text>
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
      <Header title="Blocked Users" onBack={() => navigation.goBack()} />

      {/* Content */}
      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderBlockedUser}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          blockedUsers.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      />

      {/* Info Footer */}
      {blockedUsers.length > 0 && (
        <View style={[styles.infoFooter, { backgroundColor: colors.gray50 }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.gray400} />
          <Text style={[styles.infoText, { color: colors.gray400 }]}>
            Blocked users cannot see your profile, send friend requests, or add you to splits.
          </Text>
        </View>
      )}
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
  listContent: {
    padding: spacing.md,
  },
  emptyListContent: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: spacing.sm + 4,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  blockedDate: {
    fontSize: 12,
    marginTop: 4,
  },
  unblockButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  unblockButtonDisabled: {
    opacity: 0.6,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
