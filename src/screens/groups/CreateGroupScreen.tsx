import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { createGroup, GroupType } from '../../services/groupService';
import { getFriends, Friend } from '../../services/friendService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import { colors, shadows } from '../../constants/theme';

const GROUP_TYPES: { value: GroupType; label: string; icon: string }[] = [
  { value: 'household', label: 'Household', icon: 'home-outline' },
  { value: 'trip', label: 'Trip', icon: 'airplane-outline' },
  { value: 'event', label: 'Event', icon: 'calendar-outline' },
  { value: 'work', label: 'Work', icon: 'briefcase-outline' },
  { value: 'custom', label: 'Custom', icon: 'people-outline' },
];

export default function CreateGroupScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<GroupType>('custom');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadFriends();
    }
  }, [currentUserId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadFriends = async () => {
    if (!currentUserId) return;

    try {
      setLoadingFriends(true);
      const friendsData = await getFriends(currentUserId);
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const toggleMember = (friendId: string) => {
    setSelectedMembers(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreate = async () => {
    if (!currentUserId) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      setLoading(true);
      const result = await createGroup(currentUserId, {
        name: name.trim(),
        description: description.trim() || undefined,
        type: selectedType,
        memberIds: selectedMembers,
      });

      if (result.success) {
        Alert.alert('Success', 'Group created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create group');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeOption = (type: typeof GROUP_TYPES[0]) => {
    const isSelected = selectedType === type.value;
    return (
      <TouchableOpacity
        key={type.value}
        style={[styles.typeOption, isSelected && styles.typeOptionSelected]}
        onPress={() => setSelectedType(type.value)}
      >
        <Ionicons
          name={type.icon as any}
          size={24}
          color={isSelected ? colors.primary : colors.gray500}
        />
        <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
          {type.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedMembers.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => toggleMember(item.id)}
      >
        <Avatar
          name={item.full_name}
          uri={item.avatar_url || undefined}
          size="sm"
        />
        <Text style={styles.friendName}>{item.full_name}</Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color={colors.surface} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Group</Text>
        <TouchableOpacity
          style={[styles.createBtn, !name.trim() && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.createBtnText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Group Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Group name"
            placeholderTextColor={colors.gray400}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.gray400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Group Type</Text>
          <View style={styles.typeGrid}>
            {GROUP_TYPES.map(renderTypeOption)}
          </View>
        </Card>

        <Card variant="default" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add Members</Text>
            {selectedMembers.length > 0 && (
              <Text style={styles.selectedCount}>{selectedMembers.length} selected</Text>
            )}
          </View>
          {loadingFriends ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : friends.length === 0 ? (
            <View style={styles.noFriends}>
              <Text style={styles.noFriendsText}>No friends to add</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddFriend')}>
                <Text style={styles.addFriendsLink}>Add friends first</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={renderFriendItem}
              scrollEnabled={false}
            />
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
  createBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray900,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.gray50,
    gap: 8,
  },
  typeOptionSelected: {
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray600,
  },
  typeLabelSelected: {
    color: colors.primary,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: 12,
  },
  friendItemSelected: {
    backgroundColor: colors.infoLight,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  friendName: {
    flex: 1,
    fontSize: 15,
    color: colors.gray900,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  noFriends: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFriendsText: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 8,
  },
  addFriendsLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
