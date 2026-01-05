import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  setBadgeCount,
  AppNotification,
  NotificationType,
} from '../../services/notificationService';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import { colors, shadows } from '../../constants/theme';
import { formatDistanceToNow } from 'date-fns';

const NOTIFICATION_ICONS: Record<NotificationType, { name: string; color: string }> = {
  split_created: { name: 'receipt-outline', color: colors.primary },
  split_updated: { name: 'create-outline', color: colors.info },
  payment_requested: { name: 'cash-outline', color: colors.warning },
  payment_received: { name: 'checkmark-circle-outline', color: colors.success },
  payment_sent: { name: 'arrow-up-circle-outline', color: colors.success },
  payment_reminder: { name: 'alarm-outline', color: colors.error },
  friend_request: { name: 'person-add-outline', color: colors.primary },
  friend_accepted: { name: 'people-outline', color: colors.success },
  group_invite: { name: 'people-circle-outline', color: colors.primary },
  group_activity: { name: 'chatbubbles-outline', color: colors.info },
};

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        loadNotifications();
      }
    }, [currentUserId])
  );

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadNotifications = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const data = await getNotifications(currentUserId, { limit: 50 });
      setNotifications(data);

      // Update badge count
      const unreadCount = await getUnreadCount(currentUserId);
      await setBadgeCount(unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navigate based on notification type
    const data = notification.data || {};
    switch (notification.type) {
      case 'split_created':
      case 'split_updated':
      case 'payment_requested':
      case 'payment_received':
      case 'payment_sent':
      case 'payment_reminder':
        if (data.splitId) {
          navigation.navigate('SplitFlow', {
            screen: 'SplitDetail',
            params: { splitId: data.splitId },
          });
        }
        break;
      case 'friend_request':
        navigation.navigate('FriendRequests');
        break;
      case 'friend_accepted':
        if (data.friendId) {
          navigation.navigate('FriendProfile', { friendId: data.friendId });
        }
        break;
      case 'group_invite':
      case 'group_activity':
        if (data.groupId) {
          navigation.navigate('GroupDetail', { groupId: data.groupId });
        }
        break;
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUserId) return;

    Alert.alert(
      'Mark All as Read',
      'Mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: async () => {
            await markAllAsRead(currentUserId);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            await setBadgeCount(0);
          },
        },
      ]
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
          },
        },
      ]
    );
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const iconConfig = NOTIFICATION_ICONS[item.type] || {
      name: 'notifications-outline',
      color: colors.gray500,
    };

    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDeleteNotification(item.id)}
        delayLongPress={500}
      >
        <Card
          variant="default"
          style={[
            styles.notificationCard,
            !item.read && styles.unreadCard,
          ]}
        >
          <View style={styles.notificationContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}15` }]}>
              <Ionicons name={iconConfig.name as any} size={24} color={iconConfig.color} />
            </View>
            <View style={styles.textContent}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                  {item.title}
                </Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.body} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.time}>{timeAgo}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You're all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title="Notifications"
        onBack={() => navigation.goBack()}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllRead}
            >
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="mail-unread-outline" size={20} color={colors.primary} />
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primaryLight,
  },
  unreadBannerText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
    marginBottom: 12,
    padding: 16,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray900,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  body: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray600,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
