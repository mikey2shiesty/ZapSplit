import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import {
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  FriendRequest,
} from '../../services/friendService';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

type TabType = 'incoming' | 'outgoing';

export default function FriendRequestsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadData = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const [incomingData, outgoingData] = await Promise.all([
        getIncomingFriendRequests(currentUserId),
        getOutgoingFriendRequests(currentUserId),
      ]);
      setIncoming(incomingData);
      setOutgoing(outgoingData);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: string, senderName: string) => {
    try {
      setProcessingId(requestId);
      const result = await acceptFriendRequest(requestId);

      if (result.success) {
        Alert.alert('Success', `You are now friends with ${senderName}`);
        setIncoming(prev => prev.filter(r => r.id !== requestId));
      } else {
        Alert.alert('Error', result.error || 'Failed to accept request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(requestId);
              const result = await declineFriendRequest(requestId);

              if (result.success) {
                setIncoming(prev => prev.filter(r => r.id !== requestId));
              } else {
                Alert.alert('Error', result.error || 'Failed to decline request');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to decline friend request');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderTabButton = (tab: TabType, label: string, count: number) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          { backgroundColor: isActive ? colors.primary : colors.surface }
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabText, { color: isActive ? colors.surface : colors.gray700 }]}>{label}</Text>
        {count > 0 && (
          <View style={[
            styles.badge,
            { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : colors.gray200 }
          ]}>
            <Text style={[styles.badgeText, { color: isActive ? colors.surface : colors.gray700 }]}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderIncomingItem = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.surface }]}>
      <View style={styles.requestContent}>
        <Avatar
          name={item.sender?.full_name || 'Unknown'}
          uri={item.sender?.avatar_url || undefined}
          size="lg"
        />
        <View style={styles.requestInfo}>
          <Text style={[styles.requestName, { color: colors.gray900 }]}>{item.sender?.full_name || 'Unknown'}</Text>
          <Text style={[styles.requestEmail, { color: colors.gray500 }]} numberOfLines={1}>{item.sender?.email}</Text>
          <Text style={[styles.requestTime, { color: colors.gray400 }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.declineButton, { backgroundColor: colors.gray100 }]}
          onPress={() => handleDecline(item.id)}
          disabled={processingId === item.id}
        >
          <Text style={[styles.declineButtonText, { color: colors.gray700 }]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={() => handleAccept(item.id, item.sender?.full_name || 'Unknown')}
          disabled={processingId === item.id}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={[styles.acceptButtonText, { color: colors.surface }]}>Accept</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOutgoingItem = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.surface }]}>
      <View style={styles.requestContent}>
        <Avatar
          name={item.receiver?.full_name || 'Unknown'}
          uri={item.receiver?.avatar_url || undefined}
          size="lg"
        />
        <View style={styles.requestInfo}>
          <Text style={[styles.requestName, { color: colors.gray900 }]}>{item.receiver?.full_name || 'Unknown'}</Text>
          <Text style={[styles.requestEmail, { color: colors.gray500 }]} numberOfLines={1}>{item.receiver?.email}</Text>
          <Text style={[styles.requestTime, { color: colors.gray400 }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.pendingBadge, { backgroundColor: colors.warningLight }]}>
          <Ionicons name="time-outline" size={14} color={colors.warning} />
          <Text style={[styles.pendingText, { color: colors.warning }]}>Pending</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="mail-outline" size={64} color={colors.gray300} />
      <Text style={[styles.emptyTitle, { color: colors.gray900 }]}>
        {activeTab === 'incoming' ? 'No Incoming Requests' : 'No Pending Requests'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.gray600 }]}>
        {activeTab === 'incoming'
          ? 'When someone sends you a friend request, it will appear here'
          : 'Requests you send will appear here until accepted'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.gray900 }]}>Friend Requests</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {renderTabButton('incoming', 'Received', incoming.length)}
        {renderTabButton('outgoing', 'Sent', outgoing.length)}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'incoming' ? incoming : outgoing}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'incoming' ? renderIncomingItem : renderOutgoingItem}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: radius.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
    flexGrow: 1,
  },
  requestCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: radius.md,
  },
  requestName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  requestEmail: {
    fontSize: 14,
  },
  requestTime: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: spacing.xs,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
