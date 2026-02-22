import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { searchUsers, sendFriendRequest, UserSearchResult } from '../../services/friendService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import { shadows } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

export default function AddFriendScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.length >= 3 && currentUserId) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, currentUserId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const performSearch = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const searchResults = await searchUsers(searchQuery, currentUserId);
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: string, userName: string) => {
    if (!currentUserId) return;

    try {
      setSendingTo(userId);
      const result = await sendFriendRequest(currentUserId, userId);

      if (result.success) {
        Alert.alert('Request Sent', `Friend request sent to ${userName}`);
        // Update the local state to show pending
        setResults(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, hasPendingRequest: true } : user
          )
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setSendingTo(null);
    }
  };

  const renderUserItem = ({ item }: { item: UserSearchResult }) => (
    <Card variant="default" style={[styles.userCard, { backgroundColor: colors.surface }]}>
      <View style={styles.userContent}>
        <Avatar
          name={item.full_name}
          uri={item.avatar_url || undefined}
          size="md"
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.gray900 }]}>{item.full_name}</Text>
          <Text style={[styles.userEmail, { color: colors.gray500 }]}>{item.email}</Text>
          {item.username && (
            <Text style={[styles.userUsername, { color: colors.primary }]}>@{item.username}</Text>
          )}
        </View>
        {item.isFriend ? (
          <View style={[styles.friendBadge, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.friendBadgeText, { color: colors.success }]}>Friends</Text>
          </View>
        ) : item.hasPendingRequest ? (
          <View style={[styles.pendingBadge, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <Text style={[styles.pendingBadgeText, { color: colors.warning }]}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => handleSendRequest(item.id, item.full_name)}
            disabled={sendingTo === item.id}
          >
            {sendingTo === item.id ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color={colors.surface} />
                <Text style={[styles.addButtonText, { color: colors.surface }]}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderEmptyState = () => {
    if (searchQuery.length < 2) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color={colors.gray300} />
          <Text style={[styles.emptyTitle, { color: colors.gray900 }]}>Find Friends</Text>
          <Text style={[styles.emptyText, { color: colors.gray600 }]}>
            Search by name, email, or username to find and add friends
          </Text>
        </View>
      );
    }

    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="person-outline" size={64} color={colors.gray300} />
        <Text style={[styles.emptyTitle, { color: colors.gray900 }]}>No Users Found</Text>
        <Text style={[styles.emptyText, { color: colors.gray600 }]}>
          Try a different search term or invite them to join ZapSplit
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.gray50, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.gray900 }]}>Add Friend</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.gray400} />
        <TextInput
          style={[styles.searchInput, { color: colors.gray900 }]}
          placeholder="Search by name, email, or username..."
          placeholderTextColor={colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.gray600 }]}>Searching...</Text>
        </View>
      )}

      {/* Results */}
      {!loading && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
        />
      )}
    </KeyboardAvoidingView>
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
    padding: 20,
    paddingBottom: 12,
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
  placeholder: {
    width: 44,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 12,
    ...shadows.low,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    flexGrow: 1,
  },
  userCard: {
    marginBottom: 12,
    padding: 16,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  userUsername: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  friendBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  pendingBadgeText: {
    fontSize: 13,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
