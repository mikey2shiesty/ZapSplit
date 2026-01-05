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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { getFriends, getIncomingFriendRequests, Friend, FriendRequest } from '../../services/friendService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius, shadows } from '../../constants/theme';

type TabType = 'friends' | 'requests';

export default function FriendsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
        style={[
          styles.tabButton,
          { backgroundColor: isActive ? colors.primary : colors.surface }
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[
          styles.tabText,
          { color: isActive ? colors.surface : colors.gray700 }
        ]}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={[styles.badgeText, { color: colors.surface }]}>{count}</Text>
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
            <Text style={[styles.friendName, { color: colors.gray900 }]}>{item.full_name}</Text>
            <Text style={[styles.friendEmail, { color: colors.gray500 }]}>{item.email}</Text>
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
          <Text style={[styles.friendName, { color: colors.gray900 }]}>{item.sender?.full_name || 'Unknown'}</Text>
          <Text style={[styles.friendEmail, { color: colors.gray500 }]}>{item.sender?.email}</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('FriendRequests')}
        >
          <Text style={[styles.acceptButtonText, { color: colors.surface }]}>View</Text>
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
      <Text style={[styles.emptyTitle, { color: colors.gray900 }]}>
        {activeTab === 'friends' ? 'No Friends Yet' : 'No Pending Requests'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.gray600 }]}>
        {activeTab === 'friends'
          ? 'Add friends to easily split bills together'
          : 'Friend requests will appear here'}
      </Text>
      {activeTab === 'friends' && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <Ionicons name="person-add" size={20} color={colors.surface} />
          <Text style={[styles.addButtonText, { color: colors.surface }]}>Add Friends</Text>
        </TouchableOpacity>
      )}
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
        <Text style={[styles.title, { color: colors.gray900 }]}>Friends</Text>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <Ionicons name="person-add-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {activeTab === 'friends' && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.gray400} />
          <TextInput
            style={[styles.searchInput, { color: colors.gray900 }]}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.low,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.low,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.md,
    ...shadows.low,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
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
  friendCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
  },
  requestCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requestInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  acceptButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  acceptButtonText: {
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
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
