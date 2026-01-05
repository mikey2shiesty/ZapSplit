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
import { supabase } from '../../services/supabase';
import { getPaymentHistory, getPaymentsSent, getPaymentsReceived, Payment } from '../../services/stripeService';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import { colors } from '../../constants/theme';
import { format } from 'date-fns';

type TabType = 'all' | 'sent' | 'received';

export default function PaymentHistoryScreen() {
  const navigation = useNavigation();
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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Fetch payments based on active tab
      let data: Payment[] = [];
      if (activeTab === 'all') {
        data = await getPaymentHistory(user.id);
      } else if (activeTab === 'sent') {
        data = await getPaymentsSent(user.id);
      } else if (activeTab === 'received') {
        data = await getPaymentsReceived(user.id);
      }

      setPayments(data);
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
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success' as const;
      case 'pending':
      case 'processing':
        return 'warning' as const;
      case 'failed':
      case 'cancelled':
      case 'refunded':
        return 'error' as const;
      default:
        return 'neutral' as const;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const isSent = item.from_user_id === currentUserId;
    const otherPerson = isSent ? item.receiver : item.payer;
    const amountColor = isSent ? colors.error : colors.success;
    const prefix = isSent ? '-' : '+';

    return (
      <Card variant="default" style={styles.paymentCard}>
        <View style={styles.paymentContent}>
          {/* Left: Avatar and Person Info */}
          <View style={styles.paymentLeft}>
            <Avatar
              name={otherPerson?.full_name || 'Unknown'}
              uri={otherPerson?.avatar_url || undefined}
              size="md"
            />
            <View style={styles.paymentInfo}>
              <Text style={styles.personName}>
                {isSent ? 'Paid' : 'Received from'} {otherPerson?.full_name || 'Unknown'}
              </Text>
              {item.split?.title && (
                <Text style={styles.splitTitle}>{item.split.title}</Text>
              )}
              <Text style={styles.paymentDate}>
                {format(new Date(item.created_at), 'MMM d, yyyy • h:mm a')}
              </Text>
            </View>
          </View>

          {/* Right: Amount and Status */}
          <View style={styles.paymentRight}>
            <Text style={[styles.paymentAmount, { color: amountColor }]}>
              {prefix}${item.amount.toFixed(2)}
            </Text>
            <Badge variant={getStatusBadgeVariant(item.status)} size="small">
              {getStatusText(item.status)}
            </Badge>
            {item.payment_method && (
              <Text style={styles.paymentMethod}>
                {item.payment_method === 'stripe' ? '💳 Card' : item.payment_method}
              </Text>
            )}
          </View>
        </View>

        {/* Fee Info (for sent payments) */}
        {isSent && item.stripe_fee_amount && item.stripe_fee_amount > 0 && (
          <View style={styles.feeInfo}>
            <Text style={styles.feeText}>
              Fee: ${item.stripe_fee_amount.toFixed(2)}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💸</Text>
      <Text style={styles.emptyTitle}>No Payments Yet</Text>
      <Text style={styles.emptyText}>
        {activeTab === 'sent' && 'You haven\'t sent any payments yet'}
        {activeTab === 'received' && 'You haven\'t received any payments yet'}
        {activeTab === 'all' && 'No payment history to show'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Payment History" onBack={() => navigation.goBack()} />

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>View all your transactions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
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
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray600,
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray600,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray700,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  paymentCard: {
    marginBottom: 12,
    padding: 16,
  },
  paymentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  paymentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
  },
  splitTitle: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 13,
    color: colors.gray500,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  paymentMethod: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  feeInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  feeText: {
    fontSize: 12,
    color: colors.gray500,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray600,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
