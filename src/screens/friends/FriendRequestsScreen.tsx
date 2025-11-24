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
import Card from '../../components/common/Card';
import { colors, shadows } from '../../constants/theme';

type TabType = 'incoming' | 'outgoing';

export default function FriendRequestsScreen() {
  const navigation = useNavigation<any>();
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
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
        {count > 0 && (
          <View style={[styles.badge, isActive && styles.badgeActive]}>
            <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderIncomingItem = ({ item }: { item: FriendRequest }) => (
    <Card variant="default" style={styles.requestCard}>
      <View style={styles.requestContent}>
        <Avatar
          name={item.sender?.full_name || 'Unknown'}
          uri={item.sender?.avatar_url || undefined}
          size="lg"
        />
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.sender?.full_name || 'Unknown'}</Text>
          <Text style={styles.requestEmail}>{item.sender?.email}</Text>
          <Text style={styles.requestTime}>
            Sent {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDecline(item.id)}
          disabled={processingId === item.id}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAccept(item.id, item.sender?.full_name || 'Unknown')}
          disabled={processingId === item.id}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.acceptButtonText}>Accept</Text>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderOutgoingItem = ({ item }: { item: FriendRequest }) => (
    <Card variant="default" style={styles.requestCard}>
      <View style={styles.requestContent}>
        <Avatar
          name={item.receiver?.full_name || 'Unknown'}
          uri={item.receiver?.avatar_url || undefined}
          size="lg"
        />
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.receiver?.full_name || 'Unknown'}</Text>
          <Text style={styles.requestEmail}>{item.receiver?.email}</Text>
          <Text style={styles.requestTime}>
            Sent {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.pendingBadge}>
          <Ionicons name="time-outline" size={14} color={colors.warning} />
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="mail-outline" size={64} color={colors.gray300} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'incoming' ? 'No Incoming Requests' : 'No Pending Requests'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'incoming'
          ? 'When someone sends you a friend request, it will appear here'
          : 'Requests you send will appear here until accepted'}
      </Text>
    </View>
  );

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
        <Text style={styles.title}>Friend Requests</Text>
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
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.low,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
  },
  placeholder: {
    width: 44,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray700,
  },
  tabTextActive: {
    color: colors.surface,
  },
  badge: {
    backgroundColor: colors.gray200,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: colors.gray700,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    flexGrow: 1,
  },
  requestCard: {
    marginBottom: 12,
    padding: 16,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 2,
  },
  requestEmail: {
    fontSize: 14,
    color: colors.gray500,
  },
  requestTime: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: colors.gray100,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  declineButtonText: {
    color: colors.gray700,
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  pendingText: {
    color: colors.warning,
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
