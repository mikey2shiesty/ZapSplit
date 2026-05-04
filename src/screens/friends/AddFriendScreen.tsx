import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { supabase } from '../../services/supabase';
import {
  searchUsers,
  sendFriendRequest,
  UserSearchResult,
} from '../../services/friendService';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { SearchInput } from '../../components/common/Input';

export default function AddFriendScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.length >= 3 && currentUserId) performSearch();
      else setResults([]);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, currentUserId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const performSearch = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      setResults(await searchUsers(searchQuery, currentUserId));
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResults((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, hasPendingRequest: true } : u))
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send request');
      }
    } catch {
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setSendingTo(null);
    }
  };

  const renderRow = ({ item, index }: { item: UserSearchResult; index: number }) => {
    const initial = (item.full_name?.charAt(0) || '?').toUpperCase();
    const isLast = index === results.length - 1;
    return (
      <View
        style={[
          styles.row,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        ]}
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
        {item.isFriend ? (
          <View style={[styles.statePill, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.statePillLabel, { color: colors.success }]}>Friends</Text>
          </View>
        ) : item.hasPendingRequest ? (
          <View style={[styles.statePill, { backgroundColor: colors.warningLight }]}>
            <Text style={[styles.statePillLabel, { color: colors.warning }]}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addPill, { backgroundColor: colors.primary }]}
            onPress={() => handleSendRequest(item.id, item.full_name)}
            disabled={sendingTo === item.id}
            activeOpacity={0.85}
          >
            {sendingTo === item.id ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={[styles.addPillLabel, { color: colors.textInverse }]}>Add</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (searchQuery.length < 3) {
      return (
        <Card>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Find friends</Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            Search by name, email, or username to find and add friends.
          </Text>
        </Card>
      );
    }
    if (loading) return null;
    return (
      <Card>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No users found</Text>
        <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
          Try a different search term, or invite them to ZapSplit.
        </Text>
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Add friend" onBack={() => navigation.goBack()} />

      <View style={styles.section}>
        <SearchInput
          placeholder="Search by name, email, or username"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Searching…
          </Text>
        </View>
      ) : results.length > 0 ? (
        <View style={styles.section}>
          <Card padding="sm">
            <FlatList
              scrollEnabled={false}
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderRow}
            />
          </Card>
        </View>
      ) : (
        <View style={styles.section}>{renderEmpty()}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
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
  addPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    minWidth: 72,
    alignItems: 'center',
  },
  addPillLabel: {
    ...typography.button,
    fontSize: 14,
  },
  statePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  statePillLabel: {
    ...typography.chip,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
  },
  emptyTitle: {
    ...typography.displayMedium,
  },
  emptyBody: {
    ...typography.body,
    marginTop: spacing.xs,
  },
});
