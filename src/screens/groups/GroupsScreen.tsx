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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { getUserGroups, Group } from '../../services/groupService';
import Card from '../../components/common/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

const GROUP_TYPE_ICONS: Record<string, string> = {
  household: 'home-outline',
  trip: 'airplane-outline',
  event: 'calendar-outline',
  work: 'briefcase-outline',
  custom: 'people-outline',
};

const GROUP_TYPE_COLOR_KEYS: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'gray600'> = {
  household: 'primary',
  trip: 'success',
  event: 'warning',
  work: 'info',
  custom: 'gray600',
};

export default function GroupsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadGroups();
    }
  }, [currentUserId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadGroups = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const groupsData = await getUserGroups(currentUserId);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const formatAmount = (amount: number) => {
    return '$' + amount.toFixed(2);
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    const iconName = GROUP_TYPE_ICONS[item.type] || 'people-outline';
    const colorKey = GROUP_TYPE_COLOR_KEYS[item.type] || 'gray600';
    const iconColor = colors[colorKey];

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
      >
        <Card variant="default" style={[styles.groupCard, { backgroundColor: colors.surface }]}>
          <View style={styles.groupContent}>
            <View style={[styles.groupIcon, { backgroundColor: iconColor + '15' }]}>
              <Ionicons name={iconName as any} size={24} color={iconColor} />
            </View>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, { color: colors.gray900 }]}>{item.name}</Text>
              <View style={styles.groupMeta}>
                <Ionicons name="people" size={14} color={colors.gray500} />
                <Text style={[styles.memberCount, { color: colors.gray500 }]}>{item.member_count} members</Text>
              </View>
              {item.description && (
                <Text style={[styles.groupDescription, { color: colors.gray400 }]} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </View>
          {item.total_expenses > 0 && (
            <View style={[styles.expensesRow, { borderTopColor: colors.gray100 }]}>
              <Text style={[styles.expensesLabel, { color: colors.gray500 }]}>Total expenses</Text>
              <Text style={[styles.expensesAmount, { color: colors.gray900 }]}>{formatAmount(item.total_expenses)}</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-circle-outline" size={80} color={colors.gray300} />
      <Text style={[styles.emptyTitle, { color: colors.gray900 }]}>No Groups Yet</Text>
      <Text style={[styles.emptyText, { color: colors.gray600 }]}>
        Create a group to easily split bills with the same people
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={[styles.createButtonText, { color: colors.surface }]}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.gray900 }]}>Groups</Text>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Ionicons name="add" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
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
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md - 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md + 4,
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  groupCard: {
    marginBottom: spacing.md - 4,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  groupContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    marginLeft: spacing.md - 4,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberCount: {
    fontSize: 14,
  },
  groupDescription: {
    fontSize: 13,
    marginTop: spacing.xs,
  },
  expensesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md - 4,
    paddingTop: spacing.md - 4,
    borderTopWidth: 1,
  },
  expensesLabel: {
    fontSize: 13,
  },
  expensesAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
