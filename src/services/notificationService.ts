// ═══════════════════════════════════════════════════════════════
// Notification Service - Push notifications and in-app alerts
// ═══════════════════════════════════════════════════════════════

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type NotificationType =
  | 'split_created'
  | 'split_updated'
  | 'payment_requested'
  | 'payment_received'
  | 'payment_sent'
  | 'payment_reminder'
  | 'friend_request'
  | 'friend_accepted'
  | 'group_invite'
  | 'group_activity';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any> | null;
  action_url: string | null;
  read: boolean;
  read_at: string | null;
  push_sent: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  split_notifications: boolean;
  payment_notifications: boolean;
  reminder_notifications: boolean;
  friend_notifications: boolean;
  group_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "23:00"
  quiet_hours_end: string;   // "08:00"
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  push: true,
  email: true,
  sms: false,
  split_notifications: true,
  payment_notifications: true,
  reminder_notifications: true,
  friend_notifications: true,
  group_notifications: true,
  quiet_hours_enabled: true,
  quiet_hours_start: '23:00',
  quiet_hours_end: '08:00',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Configure Notifications
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Push Token Registration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Must be a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = tokenData.data;

    // Save token to database
    await savePushToken(token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // Android-specific channel configuration
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });

    await Notifications.setNotificationChannelAsync('payments', {
      name: 'Payments',
      description: 'Payment requests and confirmations',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      description: 'Payment reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return token;
}

async function savePushToken(token: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        push_token: token,
        push_token_updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;
    console.log('Push token saved successfully');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Notification Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getNotifications(
  userId: string,
  options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
): Promise<AppNotification[]> {
  const { limit = 50, offset = 0, unreadOnly = false } = options;

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Create Notifications (In-App)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, any>,
  actionUrl?: string
): Promise<string | null> {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data: data || null,
        action_url: actionUrl || null,
        channels: ['in_app', 'push'],
      })
      .select('id')
      .single();

    if (error) throw error;
    return notification?.id || null;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Send Push Notification (via Expo)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return result.data?.status === 'ok';
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Notification Triggers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function notifySplitCreated(
  participantIds: string[],
  splitTitle: string,
  creatorName: string,
  splitId: string
): Promise<void> {
  for (const userId of participantIds) {
    await createNotification(
      userId,
      'split_created',
      'New Split',
      `${creatorName} added you to "${splitTitle}"`,
      { splitId },
      `/splits/${splitId}`
    );
  }
}

export async function notifyPaymentRequested(
  userId: string,
  amount: number,
  requesterName: string,
  splitId: string
): Promise<void> {
  await createNotification(
    userId,
    'payment_requested',
    'Payment Requested',
    `${requesterName} requested $${amount.toFixed(2)}`,
    { splitId, amount },
    `/splits/${splitId}/pay`
  );
}

export async function notifyPaymentReceived(
  userId: string,
  amount: number,
  payerName: string,
  splitId: string
): Promise<void> {
  await createNotification(
    userId,
    'payment_received',
    'Payment Received',
    `${payerName} paid you $${amount.toFixed(2)}`,
    { splitId, amount },
    `/splits/${splitId}`
  );
}

export async function notifyPaymentSent(
  userId: string,
  amount: number,
  recipientName: string,
  splitId: string
): Promise<void> {
  await createNotification(
    userId,
    'payment_sent',
    'Payment Sent',
    `You paid ${recipientName} $${amount.toFixed(2)}`,
    { splitId, amount },
    `/splits/${splitId}`
  );
}

export async function notifyPaymentReminder(
  userId: string,
  amount: number,
  splitTitle: string,
  splitId: string,
  daysOverdue: number
): Promise<void> {
  const urgency = daysOverdue >= 7 ? '⚠️ ' : '';
  await createNotification(
    userId,
    'payment_reminder',
    `${urgency}Payment Reminder`,
    `You owe $${amount.toFixed(2)} for "${splitTitle}"`,
    { splitId, amount, daysOverdue },
    `/splits/${splitId}/pay`
  );
}

export async function notifyFriendRequest(
  userId: string,
  requesterName: string,
  requesterId: string
): Promise<void> {
  await createNotification(
    userId,
    'friend_request',
    'Friend Request',
    `${requesterName} wants to be your friend`,
    { requesterId },
    '/friends/requests'
  );
}

export async function notifyFriendAccepted(
  userId: string,
  friendName: string,
  friendId: string
): Promise<void> {
  await createNotification(
    userId,
    'friend_accepted',
    'Friend Request Accepted',
    `${friendName} accepted your friend request`,
    { friendId },
    `/friends/${friendId}`
  );
}

export async function notifyGroupInvite(
  userId: string,
  groupName: string,
  inviterName: string,
  groupId: string
): Promise<void> {
  await createNotification(
    userId,
    'group_invite',
    'Group Invitation',
    `${inviterName} invited you to join "${groupName}"`,
    { groupId },
    `/groups/${groupId}`
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Notification Preferences
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_PREFERENCES,
      ...(data?.notification_preferences || {}),
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const current = await getNotificationPreferences(userId);
    const updated = { ...current, ...preferences };

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: updated })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Quiet Hours Check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function isQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quiet_hours_enabled) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const start = preferences.quiet_hours_start;
  const end = preferences.quiet_hours_end;

  // Handle overnight quiet hours (e.g., 23:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  return currentTime >= start && currentTime < end;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Notification Listeners Setup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Local Notifications (for testing/reminders)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerSeconds: number,
  data?: Record<string, any>
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: {
      seconds: triggerSeconds,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    },
  });
}

export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
