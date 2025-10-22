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
import { colors } from '../../constants/theme';

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
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
  const [searchQuery, setSearchQuery] = useState('');

  // Filter friends based on search
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
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
        style={[styles.friendCard, selected && styles.friendCardSelected]}
        onPress={() => handleToggleFriend(item.id)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Selected Checkmark */}
          {selected && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Friend Name */}
        <Text style={styles.friendName} numberOfLines={1}>
          {item.name}
        </Text>

        {/* Friend Email (optional) */}
        <Text style={styles.friendEmail} numberOfLines={1}>
          {item.email}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.gray300} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No friends found' : 'No friends yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try a different search term'
          : 'Add friends to split bills with them'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor={colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Count Badge */}
      {selectedFriendIds.length > 0 && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>
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
      />

      {/* Add Friend Button */}
      {onAddFriend && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAddFriend();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add" size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Friend</Text>
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
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
    padding: 0,
  },
  selectedBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  selectedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  friendCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
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
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 11,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    paddingVertical: 14,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
});
