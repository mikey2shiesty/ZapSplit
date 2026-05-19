import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { supabase } from '../../services/supabase';
import {
  getFriends,
  getIncomingFriendRequests,
  Friend,
  FriendRequest,
} from '../../services/friendService';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { SearchInput } from '../../components/common/Input';

type TabType = 'friends' | 'requests';

export default function FriendsScreen() {
  const navigation = useNavigation<any>();
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
    if (currentUserId) loadData();
  }, [currentUserId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadData = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
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

  const filteredFriends = friends.filter((f) =>
    f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Chip = ({ tab, label, count }: { tab: TabType; label: string; count?: number }) => {
    const active = activeTab === tab;
    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setActiveTab(tab);
        }}
        style={[
          styles.chip,
          { backgroundColor: active ? colors.primary : colors.primaryLight },
        ]}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.chipLabel,
            { color: active ? colors.textInverse : colors.primary },
          ]}
        >
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.countDot, { backgroundColor: active ? colors.textInverse : colors.primary }]}>
            <Text
              style={[
                styles.countLabel,
                { color: active ? colors.primary : colors.textInverse },
              ]}
            >
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFriendItem = ({ item, index }: { item: Friend; index: number }) => {
    const initial = (item.full_name?.charAt(0) || '?').toUpperCase();
    const isLast = index === filteredFriends.length - 1;
    return (
      <TouchableOpacity
        style={[
          styles.row,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('FriendProfile', { friendId: item.id });
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarInitial, { color: colors.textInverse }]}>{initial}</Text>
        </View>
        <View style={styles.rowMain}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {item.full_name}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  const renderRequestItem = ({ item, index }: { item: FriendRequest; index: number }) => {
    const initial = (item.sender?.full_name?.charAt(0) || '?').toUpperCase();
    const isLast = index === requests.length - 1;
    return (
      <TouchableOpacity
        style={[
          styles.row,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        ]}
        onPress={() => navigation.navigate('FriendRequests')}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarInitial, { color: colors.textInverse }]}>{initial}</Text>
        </View>
        <View style={styles.rowMain}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {item.sender?.full_name || 'Unknown'}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.sender?.email}
          </Text>
        </View>
        <View style={[styles.viewPill, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.viewPillLabel, { color: colors.primary }]}>View</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const data = activeTab === 'friends' ? filteredFriends : requests;
  const renderItem = activeTab === 'friends' ? renderFriendItem : (renderRequestItem as any);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Friends"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={[styles.addCircle, { backgroundColor: colors.primaryLight }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('AddFriend');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add" size={18} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* SEARCH */}
      {activeTab === 'friends' && (
        <View style={styles.section}>
          <SearchInput
            placeholder="Search friends"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* TABS */}
      <View style={[styles.section, styles.tabsRow]}>
        <Chip tab="friends" label="All friends" />
        <Chip tab="requests" label="Requests" count={requests.length} />
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.section}>
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {activeTab === 'friends' ? 'No friends yet' : 'No pending requests'}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              {activeTab === 'friends'
                ? 'Add friends to easily split bills together.'
                : 'Friend requests will appear here.'}
            </Text>
            {activeTab === 'friends' && (
              <TouchableOpacity
                style={[styles.primaryPill, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('AddFriend');
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryPillLabel, { color: colors.textInverse }]}>
                  Add friends
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>
      ) : (
        <View style={[styles.section, { flex: 1 }]}>
          <Card padding="sm" style={{ flex: 1 }}>
            <FlatList
              data={data as any[]}
              keyExtractor={(item: any, i) =>
                'friendship_id' in item ? item.friendship_id : item.id
              }
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 200 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
            />
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  chipLabel: {
    ...typography.chip,
  },
  countDot: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLabel: {
    ...typography.chip,
    fontSize: 11,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    minHeight: 72,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.bodyLarge,
    fontWeight: '700',
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...typography.bodyLarge,
  },
  rowMeta: {
    ...typography.bodySmall,
  },
  viewPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  viewPillLabel: {
    ...typography.chip,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyTitle: {
    ...typography.displayMedium,
  },
  emptyBody: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  primaryPill: {
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  primaryPillLabel: {
    ...typography.button,
  },
});
