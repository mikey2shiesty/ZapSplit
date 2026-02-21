import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useFriends } from '../../hooks/useFriends';
import { getGroupWithMembers, addMemberToGroup } from '../../services/groupService';
import { supabase } from '../../services/supabase';
import Avatar from '../../components/common/Avatar';
import Header from '../../components/common/Header';
import { spacing, radius } from '../../constants/theme';

type RouteParams = {
  AddGroupMembers: { groupId: string };
};

interface Friend {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export default function AddGroupMembersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AddGroupMembers'>>();
  const { groupId } = route.params;
  const { colors } = useTheme();
  const { friends, loading: friendsLoading } = useFriends();

  const [existingMemberIds, setExistingMemberIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const group = await getGroupWithMembers(groupId);
      if (group) {
        const memberIds = group.members
          .map(m => m.user?.id)
          .filter((id): id is string => !!id);
        setExistingMemberIds(memberIds);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Friends not already in the group
  const availableFriends = friends.filter(f => !existingMemberIds.includes(f.id));

  const handleToggle = (friendId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0 || !currentUserId) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const results = await Promise.all(
        selectedIds.map(id => addMemberToGroup(groupId, id, currentUserId))
      );

      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        Alert.alert('Warning', `${failed.length} member(s) could not be added.`);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'Failed to add members. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.friendRow, { backgroundColor: colors.surface }]}
        onPress={() => handleToggle(item.id)}
        activeOpacity={0.7}
      >
        <Avatar
          name={item.full_name || 'Unknown'}
          uri={item.avatar_url || undefined}
          size="sm"
        />
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, { color: colors.gray900 }]}>
            {item.full_name || 'Unknown'}
          </Text>
          <Text style={[styles.friendEmail, { color: colors.gray500 }]}>
            {item.email}
          </Text>
        </View>
        <View style={[
          styles.checkbox,
          { borderColor: isSelected ? colors.primary : colors.gray300 },
          isSelected && { backgroundColor: colors.primary },
        ]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || friendsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
        <Header title="Add Members" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <Header title="Add Members" onBack={() => navigation.goBack()} />

      {availableFriends.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.gray300} />
          <Text style={[styles.emptyTitle, { color: colors.gray700 }]}>
            No friends to add
          </Text>
          <Text style={[styles.emptyText, { color: colors.gray500 }]}>
            All your friends are already in this group, or you need to add more friends first.
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableFriends}
          keyExtractor={item => item.id}
          renderItem={renderFriend}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.gray100 }]} />
          )}
        />
      )}

      {selectedIds.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.gray50 }]}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAdd}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>
                Add {selectedIds.length} {selectedIds.length === 1 ? 'Member' : 'Members'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
    gap: 14,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    marginLeft: 52,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    padding: 20,
  },
  addButton: {
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
