import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

export interface Friend {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

interface FriendSelectorProps {
  friends: Friend[];
  selectedFriendIds: string[];
  onToggleFriend: (friendId: string) => void;
  onAddFriend?: () => void;
}

export default function FriendSelector({
  friends,
  selectedFriendIds,
  onToggleFriend,
  onAddFriend,
}: FriendSelectorProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter friends based on search
  const filteredFriends = friends.filter(friend =>
    friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFriend = (friendId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFriend(friendId);
  };

  const isSelected = (friendId: string) => selectedFriendIds.includes(friendId);

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const selected = isSelected(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.friendCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          selected && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
        ]}
        onPress={() => handleToggleFriend(item.id)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {item.full_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}

          {/* Selected Checkmark */}
          {selected && (
            <View style={[styles.checkmarkContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Friend Name */}
        <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
          {item.full_name || 'Unknown'}
        </Text>

        {/* Friend Email (optional) */}
        <Text style={[styles.friendEmail, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.email}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        {searchQuery ? 'No friends found' : 'No friends yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        {searchQuery
          ? 'Try a different search term'
          : 'Add friends to split bills with them'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.gray100 }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search friends..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Count Badge */}
      {selectedFriendIds.length > 0 && (
        <View style={[styles.selectedBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.selectedBadgeText, { color: colors.primary }]}>
            {selectedFriendIds.length} friend{selectedFriendIds.length > 1 ? 's' : ''} selected
          </Text>
        </View>
      )}

      {/* Friends Grid */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriendItem}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />

      {/* Add Friend Button */}
      {onAddFriend && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAddFriend();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add" size={20} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Friend</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    padding: 0,
  },
  selectedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  selectedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  friendCard: {
    width: '31%',
    marginRight: '3.5%',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 12,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 11,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: 14,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
