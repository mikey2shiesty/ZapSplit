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
import { supabase } from '../../services/supabase';
import { getPaymentHistory, getPaymentsSent, getPaymentsReceived, Payment } from '../../services/stripeService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';
import { format } from 'date-fns';

type TabType = 'all' | 'sent' | 'received';

export default function PaymentHistoryScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, [activeTab]);

  const loadPayments = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      let data: Payment[] = [];
      if (activeTab === 'all') {
        data = await getPaymentHistory(user.id);
      } else if (activeTab === 'sent') {
        data = await getPaymentsSent(user.id);
      } else if (activeTab === 'received') {
        data = await getPaymentsReceived(user.id);
      }

      // Filter out self-payments
      setPayments(data.filter(p => p.from_user_id !== p.to_user_id));
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const renderTabButton = (tab: TabType, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[
          styles.tabButton,
          isActive && { backgroundColor: colors.primary },
        ]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            { color: colors.gray500 },
            isActive && { color: '#FFFFFF' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: colors.success + '18', text: colors.success };
      case 'pending':
      case 'processing':
        return { bg: colors.warning + '18', text: colors.warning };
      case 'failed':
      case 'cancelled':
      case 'refunded':
        return { bg: colors.error + '18', text: colors.error };
      default:
        return { bg: colors.gray200, text: colors.gray600 };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Paid';
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      case 'refunded': return 'Refunded';
      default: return status;
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const isSent = item.from_user_id === currentUserId;
    const otherPerson = isSent ? item.receiver : item.payer;
    const amountColor = isSent ? colors.error : colors.success;
    const prefix = isSent ? '-' : '+';
    const statusStyle = getStatusColor(item.status);
    const hasFee = isSent && item.stripe_fee_amount && item.stripe_fee_amount > 0;
    const directionIcon = isSent ? 'arrow-up-circle' : 'arrow-down-circle';
    const directionColor = isSent ? colors.error : colors.success;

    return (
      <Card variant="elevated" style={styles.paymentCard}>
        <View style={styles.paymentRow}>
          {/* Direction indicator + Avatar */}
          <View style={styles.avatarContainer}>
            <Avatar
              name={otherPerson?.full_name || 'Unknown'}
              uri={otherPerson?.avatar_url || undefined}
              size="md"
            />
            <View style={[styles.directionBadge, { backgroundColor: colors.surface }]}>
              <Ionicons name={directionIcon} size={16} color={directionColor} />
            </View>
          </View>

          {/* Info */}
          <View style={styles.paymentInfo}>
            <Text style={[styles.personName, { color: colors.gray900 }]} numberOfLines={1}>
              {isSent ? 'Paid' : 'Received from'} {otherPerson?.full_name || 'Unknown'}
            </Text>
            {item.split?.title ? (
              <Text style={[styles.splitTitle, { color: colors.gray500 }]} numberOfLines={1}>
                {item.split.title}
              </Text>
            ) : null}
            <Text style={[styles.paymentDate, { color: colors.gray400 }]}>
              {format(new Date(item.created_at), 'MMM d, yyyy · h:mm a')}
              {hasFee ? `  ·  Fee $${item.stripe_fee_amount!.toFixed(2)}` : ''}
            </Text>
          </View>

          {/* Amount + Status */}
          <View style={styles.paymentRight}>
            <Text style={[styles.paymentAmount, { color: amountColor }]}>
              {prefix}${item.amount.toFixed(2)}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
        <Ionicons name="receipt-outline" size={32} color={colors.gray400} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.gray900 }]}>No Payments Yet</Text>
      <Text style={[styles.emptyText, { color: colors.gray500 }]}>
        {activeTab === 'sent' && "You haven't sent any payments yet"}
        {activeTab === 'received' && "You haven't received any payments yet"}
        {activeTab === 'all' && 'Your payment history will appear here'}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
        <Header title="Payment History" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <Header title="Payment History" onBack={() => navigation.goBack()} />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {renderTabButton('all', 'All')}
        {renderTabButton('sent', 'Sent')}
        {renderTabButton('received', 'Received')}
      </View>

      {/* Payments List */}
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={renderPaymentItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      />
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  paymentCard: {
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  directionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  splitTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
