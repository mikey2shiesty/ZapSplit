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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { createGroup, GroupType } from '../../services/groupService';
import { getFriends, Friend } from '../../services/friendService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import { shadows } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

const GROUP_TYPES: { value: GroupType; label: string; icon: string }[] = [
  { value: 'household', label: 'Household', icon: 'home-outline' },
  { value: 'trip', label: 'Trip', icon: 'airplane-outline' },
  { value: 'event', label: 'Event', icon: 'calendar-outline' },
  { value: 'work', label: 'Work', icon: 'briefcase-outline' },
  { value: 'custom', label: 'Custom', icon: 'people-outline' },
];

export default function CreateGroupScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<GroupType>('custom');
  const [customTypeName, setCustomTypeName] = useState('');
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
      const groupDescription = selectedType === 'custom' && customTypeName.trim()
        ? description.trim()
          ? `${customTypeName.trim()} — ${description.trim()}`
          : customTypeName.trim()
        : description.trim() || undefined;

      const result = await createGroup(currentUserId, {
        name: name.trim(),
        description: groupDescription,
        type: selectedType,
        memberIds: selectedMembers,
      });

      if (result.success) {
        Alert.alert('Success', 'Group created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Something went wrong', 'Couldn\'t create the group. Please try again.');
      }
    } catch (error) {
      Alert.alert('Something went wrong', 'Couldn\'t create the group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeOption = (type: typeof GROUP_TYPES[0]) => {
    const isSelected = selectedType === type.value;
    return (
      <TouchableOpacity
        key={type.value}
        style={[
          styles.typeOption,
          { backgroundColor: isSelected ? colors.infoLight : colors.gray100 },
          isSelected && { borderWidth: 1, borderColor: colors.primary },
        ]}
        onPress={() => setSelectedType(type.value)}
      >
        <Ionicons
          name={type.icon as any}
          size={24}
          color={isSelected ? colors.primary : colors.gray500}
        />
        <Text style={[styles.typeLabel, { color: isSelected ? colors.primary : colors.gray600 }]}>
          {type.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedMembers.includes(item.id);
    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          { borderBottomColor: colors.gray200 },
          isSelected && { backgroundColor: colors.infoLight, marginHorizontal: -16, paddingHorizontal: 16 },
        ]}
        onPress={() => toggleMember(item.id)}
      >
        <Avatar
          name={item.full_name}
          uri={item.avatar_url || undefined}
          size="sm"
        />
        <Text style={[styles.friendName, { color: colors.gray900 }]}>{item.full_name}</Text>
        <View style={[
          styles.checkbox,
          { borderColor: colors.gray300 },
          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}>
          {isSelected && <Ionicons name="checkmark" size={16} color={colors.surface} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.gray50, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.gray900 }]}>Create Group</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }, !name.trim() && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={[styles.createBtnText, { color: colors.surface }]}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="default" style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Group Details</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.gray100, color: colors.gray900 }]}
            placeholder="Group name"
            placeholderTextColor={colors.gray400}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.gray100, color: colors.gray900 }]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.gray400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </Card>

        <Card variant="default" style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Group Type</Text>
          <View style={styles.typeGrid}>
            {GROUP_TYPES.map(renderTypeOption)}
          </View>
          {selectedType === 'custom' && (
            <TextInput
              style={[styles.input, styles.customTypeInput, { backgroundColor: colors.gray100, color: colors.gray900 }]}
              placeholder="e.g., Sports Team, Book Club..."
              placeholderTextColor={colors.gray400}
              value={customTypeName}
              onChangeText={setCustomTypeName}
            />
          )}
        </Card>

        <Card variant="default" style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Add Members</Text>
            {selectedMembers.length > 0 && (
              <Text style={[styles.selectedCount, { color: colors.primary }]}>{selectedMembers.length} selected</Text>
            )}
          </View>
          {loadingFriends ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : friends.length === 0 ? (
            <View style={styles.noFriends}>
              <Text style={[styles.noFriendsText, { color: colors.gray500 }]}>No friends to add</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddFriend')}>
                <Text style={[styles.addFriendsLink, { color: colors.primary }]}>Add friends first</Text>
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
  createBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
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
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
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
  customTypeInput: {
    marginTop: 12,
    marginBottom: 0,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  friendName: {
    flex: 1,
    fontSize: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFriends: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFriendsText: {
    fontSize: 14,
    marginBottom: 8,
  },
  addFriendsLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
