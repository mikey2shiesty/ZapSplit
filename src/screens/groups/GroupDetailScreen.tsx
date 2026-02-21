import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import {
  getGroupWithMembers,
  getGroupSplits,
  leaveGroup,
  deleteGroup,
  isUserGroupAdmin,
  GroupWithMembers,
  GroupSplit,
} from '../../services/groupService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { shadows } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

type RouteParams = {
  GroupDetail: { groupId: string };
};

export default function GroupDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'GroupDetail'>>();
  const { groupId } = route.params;
  const { colors } = useTheme();

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [splits, setSplits] = useState<GroupSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadData();
      checkAdminStatus();
    }
  }, [currentUserId, groupId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupData, splitsData] = await Promise.all([
        getGroupWithMembers(groupId),
        getGroupSplits(groupId),
      ]);
      setGroup(groupData);
      setSplits(splitsData);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    if (!currentUserId) return;
    const adminStatus = await isUserGroupAdmin(groupId, currentUserId);
    setIsAdmin(adminStatus);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!currentUserId) return;
            const result = await leaveGroup(groupId, currentUserId);
            if (result.success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', result.error || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteGroup(groupId);
            if (result.success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const handleCreateSplit = () => {
    navigation.navigate('SplitFlow', { screen: 'CreateSplit', params: { groupId } });
  };

  const formatAmount = (amount: number) => {
    return '$' + amount.toFixed(2);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.gray50 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.gray50 }]}>
        <Text style={[styles.errorText, { color: colors.gray600 }]}>Group not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.errorLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.gray900 }]} numberOfLines={1}>{group.name}</Text>
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            Alert.alert(
              'Group Options',
              undefined,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave Group', onPress: handleLeaveGroup },
                ...(isAdmin ? [{ text: 'Delete Group', style: 'destructive' as const, onPress: handleDeleteGroup }] : []),
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={colors.gray900} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <Card variant="default" style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.groupHeader}>
            <View style={[styles.groupIconLarge, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="people" size={32} color={colors.primary} />
            </View>
            <View style={styles.groupHeaderInfo}>
              <Text style={[styles.groupName, { color: colors.gray900 }]}>{group.name}</Text>
              {group.description && (
                <Text style={[styles.groupDescription, { color: colors.gray500 }]}>{group.description}</Text>
              )}
            </View>
          </View>
          <View style={[styles.statsRow, { borderTopColor: colors.gray100 }]}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.gray900 }]}>{group.member_count}</Text>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>Members</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.gray200 }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.gray900 }]}>{splits.length}</Text>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>Splits</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.gray200 }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.gray900 }]}>{formatAmount(group.total_expenses)}</Text>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>Total</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Members</Text>
            {isAdmin && (
              <TouchableOpacity onPress={() => navigation.navigate('AddGroupMembers', { groupId })}>
                <Text style={[styles.addLink, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
          <Card variant="default" style={[styles.membersCard, { backgroundColor: colors.surface }]}>
            {group.members.map((member, index) => (
              <View
                key={member.id}
                style={[
                  styles.memberItem,
                  index < group.members.length - 1 && [styles.memberItemBorder, { borderBottomColor: colors.gray100 }],
                ]}
              >
                <Avatar
                  name={member.user?.full_name || 'Unknown'}
                  uri={member.user?.avatar_url || undefined}
                  size="sm"
                />
                <Text style={[styles.memberName, { color: colors.gray900 }]}>{member.user?.full_name || 'Unknown'}</Text>
                {member.role === 'admin' && (
                  <Badge variant="info" size="small">Admin</Badge>
                )}
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Recent Splits</Text>
            <TouchableOpacity onPress={handleCreateSplit}>
              <Text style={[styles.addLink, { color: colors.primary }]}>New Split</Text>
            </TouchableOpacity>
          </View>
          {splits.length === 0 ? (
            <Card variant="default" style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="receipt-outline" size={40} color={colors.gray300} />
              <Text style={[styles.emptyText, { color: colors.gray500 }]}>No splits yet</Text>
              <TouchableOpacity style={[styles.createSplitBtn, { backgroundColor: colors.primary }]} onPress={handleCreateSplit}>
                <Text style={[styles.createSplitBtnText, { color: colors.surface }]}>Create First Split</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            splits.slice(0, 5).map(split => (
              <TouchableOpacity
                key={split.id}
                onPress={() => navigation.navigate('SplitDetail', { splitId: split.id })}
              >
                <Card variant="default" style={[styles.splitCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.splitContent}>
                    <View style={styles.splitInfo}>
                      <Text style={[styles.splitTitle, { color: colors.gray900 }]}>{split.title}</Text>
                      <Text style={[styles.splitDate, { color: colors.gray500 }]}>
                        {new Date(split.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.splitRight}>
                      <Text style={[styles.splitAmount, { color: colors.gray900 }]}>{formatAmount(split.total_amount)}</Text>
                      <Badge
                        variant={split.status === 'settled' ? 'success' : 'warning'}
                        size="small"
                      >
                        {split.status === 'settled' ? 'Settled' : 'Active'}
                      </Badge>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 12,
  },
  errorLink: {
    fontSize: 16,
    fontWeight: '600',
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
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.low,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 8,
  },
  infoCard: {
    padding: 20,
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  groupIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addLink: {
    fontSize: 15,
    fontWeight: '600',
  },
  membersCard: {
    padding: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  memberItemBorder: {
    borderBottomWidth: 1,
  },
  memberName: {
    flex: 1,
    fontSize: 15,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    marginBottom: 16,
  },
  createSplitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  createSplitBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  splitCard: {
    padding: 16,
    marginBottom: 8,
  },
  splitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitInfo: {
    flex: 1,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  splitDate: {
    fontSize: 13,
  },
  splitRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  splitAmount: {
    fontSize: 17,
    fontWeight: '700',
  },
});
