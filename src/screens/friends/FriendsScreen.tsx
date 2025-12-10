import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { getFriends, getIncomingFriendRequests, Friend, FriendRequest } from '../../services/friendService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import { colors, shadows } from '../../constants/theme';

type TabType = 'friends' | 'requests';

export default function FriendsScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      // Always load both friends and requests so badge count is accurate
      const [friendsData, requestsData] = await Promise.all([
        getFriends(currentUserId),
        getIncomingFriendRequests(currentUserId),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredFriends = friends.filter(friend =>
    friend.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTabButton = (tab: TabType, label: string, count?: number) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
        {count !== undefined && count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('FriendProfile', { friendId: item.id })}
    >
      <Card variant="default" style={styles.friendCard}>
        <View style={styles.friendContent}>
          <Avatar
            name={item.full_name}
            uri={item.avatar_url || undefined}
            size="md"
          />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{item.full_name}</Text>
            <Text style={styles.friendEmail}>{item.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: { item: FriendRequest }) => (
    <Card variant="default" style={styles.requestCard}>
      <View style={styles.requestContent}>
        <Avatar
          name={item.sender?.full_name || 'Unknown'}
          uri={item.sender?.avatar_url || undefined}
          size="md"
        />
        <View style={styles.requestInfo}>
          <Text style={styles.friendName}>{item.sender?.full_name || 'Unknown'}</Text>
          <Text style={styles.friendEmail}>{item.sender?.email}</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => navigation.navigate('FriendRequests')}
        >
          <Text style={styles.acceptButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'friends' ? 'people-outline' : 'mail-outline'}
        size={64}
        color={colors.gray300}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'friends' ? 'No Friends Yet' : 'No Pending Requests'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'friends'
          ? 'Add friends to easily split bills together'
          : 'Friend requests will appear here'}
      </Text>
      {activeTab === 'friends' && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <Ionicons name="person-add" size={20} color={colors.surface} />
          <Text style={styles.addButtonText}>Add Friends</Text>
        </TouchableOpacity>
      )}
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
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <Ionicons name="person-add-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {activeTab === 'friends' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {renderTabButton('friends', 'All Friends')}
        {renderTabButton('requests', 'Requests', requests.length)}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'friends' ? (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.friendship_id}
          renderItem={renderFriendItem}
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
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestItem}
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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.low,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    ...shadows.low,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.gray900,
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
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
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
  friendCard: {
    marginBottom: 12,
    padding: 16,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: colors.gray500,
  },
  requestCard: {
    marginBottom: 12,
    padding: 16,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: colors.surface,
    fontSize: 14,
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
