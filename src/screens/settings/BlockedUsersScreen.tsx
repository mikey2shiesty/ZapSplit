import React, { useState, useEffect, useCallback } from 'react';
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
import { colors, shadows } from '../../constants/theme';

export default function BlockedUsersScreen() {
  const navigation = useNavigation<any>();
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
            <Text style={styles.userName}>{profile?.full_name || 'Unknown User'}</Text>
            <Text style={styles.userEmail}>{profile?.email || 'No email'}</Text>
            <Text style={styles.blockedDate}>Blocked {formatDate(item.created_at)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.unblockButton, isUnblocking && styles.unblockButtonDisabled]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.unblockButtonText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="ban-outline" size={48} color={colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>No Blocked Users</Text>
      <Text style={styles.emptySubtitle}>
        Users you block won't be able to see your profile or send you friend requests.
      </Text>
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
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.headerSpacer} />
      </View>

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
        <View style={styles.infoFooter}>
          <Ionicons name="information-circle-outline" size={18} color={colors.gray400} />
          <Text style={styles.infoText}>
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 2,
  },
  blockedDate: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 4,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    minWidth: 80,
    alignItems: 'center',
  },
  unblockButtonDisabled: {
    opacity: 0.6,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 32,
    gap: 8,
    backgroundColor: colors.gray50,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray400,
    lineHeight: 18,
  },
});
