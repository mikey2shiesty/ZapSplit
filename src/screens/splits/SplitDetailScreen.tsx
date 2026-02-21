import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Share as RNShare,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography, shadows } from '../../constants/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { SplitDetailScreenProps } from '../../types/navigation';
import {
  getSplitById,
  markParticipantAsPaid,
  deleteSplit,
  generateShareMessage,
  getOrCreatePaymentLink,
  generateShareMessageWithLink,
  SplitWithParticipants,
  SplitParticipant,
} from '../../services/splitService';
import { supabase } from '../../services/supabase';
import { createPayment } from '../../services/stripeService';
import { useStripe } from '@stripe/stripe-react-native';

export default function SplitDetailScreen({ navigation, route }: SplitDetailScreenProps) {
  const { splitId } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [split, setSplit] = useState<SplitWithParticipants | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [itemClaims, setItemClaims] = useState<Map<string, any[]>>(new Map()); // userId -> claims

  // Load split details
  useEffect(() => {
    loadSplitDetails();
    getCurrentUser();
  }, [splitId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadSplitDetails = async () => {
    try {
      setLoading(true);
      const splitData = await getSplitById(splitId);
      setSplit(splitData);

      // Fetch item claims for this split
      const { data: claims } = await supabase
        .from('item_claims')
        .select('*')
        .eq('split_id', splitId);

      if (claims) {
        // Group claims by user_id
        const claimsByUser = new Map<string, any[]>();
        claims.forEach(claim => {
          const key = claim.claimed_by_user_id || claim.claimed_by_email;
          if (key) {
            const existing = claimsByUser.get(key) || [];
            existing.push(claim);
            claimsByUser.set(key, existing);
          }
        });
        setItemClaims(claimsByUser);
      }
    } catch (error) {
      console.error('Error loading split:', error);
      Alert.alert('Error', 'Failed to load split details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const refreshSplitDetails = async () => {
    try {
      setRefreshing(true);
      const splitData = await getSplitById(splitId);
      setSplit(splitData);
    } catch (error) {
      console.error('Error refreshing split:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsPaid = async (participant: any) => {
    if (!split || !currentUserId) return;

    // Only creator can mark as paid
    if (split.creator_id !== currentUserId) {
      Alert.alert('Permission Denied', 'Only the creator can mark payments');
      return;
    }

    // Show confirmation
    Alert.alert(
      'Mark as Paid',
      `Mark ${participant.user?.full_name || 'participant'} as paid $${participant.amount_owed.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          style: 'default',
          onPress: async () => {
            try {
              await markParticipantAsPaid(participant.id, splitId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await refreshSplitDetails();
            } catch (error) {
              console.error('Error marking as paid:', error);
              Alert.alert('Error', 'Failed to mark as paid');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!split || !currentUserId) return;

    // Only creator can delete
    if (split.creator_id !== currentUserId) {
      Alert.alert('Permission Denied', 'Only the creator can delete this split');
      return;
    }

    // Check if any payments received
    const hasPaidParticipants = split.participants.some(p => p.status === 'paid');

    const warningMessage = hasPaidParticipants
      ? 'Some participants have already paid. Are you sure you want to delete this split?'
      : 'Delete this split? This cannot be undone.';

    Alert.alert(
      'Delete Split',
      warningMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSplit(splitId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Split deleted');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting split:', error);
              Alert.alert('Error', 'Failed to delete split');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!split || !currentUserId) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Generate or get existing payment link
      const result = await getOrCreatePaymentLink(split.id, currentUserId);

      if (!result) {
        // Fallback to simple share without link
        const message = generateShareMessage(split, currentUserId);
        await RNShare.share({
          message,
          title: `Split: ${split.title}`,
        });
        return;
      }

      // Share with payment link
      const message = generateShareMessageWithLink(split, result.url);
      await RNShare.share({
        message,
        title: `Split: ${split.title}`,
        url: result.url, // iOS will show this as a clickable link
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to create share link. Please try again.');
    }
  };

  // Handle Pay Now - Stripe payment flow
  const handlePayNow = async () => {
    if (!split || !currentUserId) return;

    // Find current user's participant record
    const userParticipant = split.participants.find(p => p.user_id === currentUserId);
    if (!userParticipant || userParticipant.status === 'paid') {
      Alert.alert('Error', 'No payment required');
      return;
    }

    const amountToPay = userParticipant.amount_owed;

    try {
      setPaymentLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Create payment and show Stripe payment sheet
      const result = await createPayment(
        currentUserId,           // fromUserId (payer)
        split.creator_id,        // toUserId (receiver/creator)
        amountToPay,             // amount
        splitId,                 // splitId
        initPaymentSheet,        // from useStripe()
        presentPaymentSheet      // from useStripe()
      );

      if (!result.success) {
        if (result.error !== 'Canceled') {
          Alert.alert('Payment Failed', result.error || 'Unknown error');
        }
        return;
      }

      // Payment successful - mark as paid in database
      await markParticipantAsPaid(userParticipant.id, splitId);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Payment Successful!',
        `You paid $${amountToPay.toFixed(2)} for "${split.title}"`,
        [{ text: 'OK', onPress: () => refreshSplitDetails() }]
      );
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'Failed to process payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.gray500 }]}>Loading split...</Text>
        </View>
      </View>
    );
  }

  if (!split) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Split not found</Text>
        </View>
      </View>
    );
  }

  const isCreator = currentUserId === split.creator_id;
  const isSettled = split.status === 'settled';
  const isReceiptSplit = split.split_type === 'receipt';

  // Calculate what others owe (sum of all participant amounts)
  const othersOweTotal = split.participants.reduce((sum, p) => sum + (p.amount_owed || 0), 0);

  // Calculate the current user's share from their claimed items (for receipt splits)
  const currentUserClaims = isReceiptSplit && currentUserId
    ? (itemClaims.get(currentUserId) || []).reduce((sum: number, claim: any) => sum + (Number(claim.item_amount) / (claim.share_count || 1)), 0)
    : 0;

  // Creator's share calculation
  const creatorShareFromClaims = isReceiptSplit && split.creator_id
    ? (itemClaims.get(split.creator_id) || []).reduce((sum: number, claim: any) => sum + (Number(claim.item_amount) / (claim.share_count || 1)), 0)
    : 0;
  const creatorShare = isReceiptSplit
    ? creatorShareFromClaims
    : split.total_amount - othersOweTotal;

  // Check if current user owes money
  const userParticipant = split.participants.find(p => p.user_id === currentUserId);
  const userOwesMoney = userParticipant && userParticipant.amount_owed > 0 && userParticipant.status !== 'paid';
  const amountOwed = userParticipant?.amount_owed || 0;

  // "Your Share" depends on who is viewing
  const yourShare = isCreator
    ? creatorShare
    : (isReceiptSplit && currentUserClaims > 0 ? currentUserClaims : amountOwed);

  // Check if user can claim items (receipt split - creators can also claim their own items)
  const canClaimItems = isReceiptSplit;

  const handleClaimItems = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ClaimItems', { splitId });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.gray50 }]}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>Split Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt Image (if exists) */}
        {split.image_url && (
          <View style={styles.receiptImageContainer}>
            <Image source={{ uri: split.image_url }} style={styles.receiptImage} resizeMode="cover" />
          </View>
        )}

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: colors.gray900 }]}>
              {!isCreator && split.title?.startsWith('Request to ')
                ? `Request from ${split.creator?.full_name || 'someone'}`
                : split.title}
            </Text>
            {isSettled && (
              <View style={[styles.settledBadge, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.settledBadgeText, { color: colors.success }]}>Settled</Text>
              </View>
            )}
          </View>

          {split.description && <Text style={[styles.summaryDescription, { color: colors.gray500 }]}>{split.description}</Text>}

          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>Total Amount</Text>
            <Text style={[styles.summaryValue, { color: colors.gray900 }]}>${split.total_amount.toFixed(2)} AUD</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>Split Method</Text>
            <Text style={[styles.summaryValue, { color: colors.gray900 }]}>{getSplitMethodLabel(split.split_type || 'equal')}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>Created</Text>
            <Text style={[styles.summaryValue, { color: colors.gray900 }]}>{formatDate(split.created_at)}</Text>
          </View>

          {/* Payment Progress */}
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

          {/* Your Share — shows different value for creator vs participant */}
          {yourShare > 0.01 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>Your Share</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                ${yourShare.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Status section — different for creator vs participant */}
          {(() => {
            if (!isCreator) {
              // Participant view: show their payment status
              // Check split_participants status, amount_paid, AND web payments
              const userPart = userParticipant as any;
              const participantEmail = userPart?.user?.email?.toLowerCase();
              const participantName = userPart?.user?.full_name?.toLowerCase();
              const webPayments = split.web_payments || [];
              const paidViaWeb = webPayments.some((wp: any) => {
                const payerEmail = wp.payer_email?.toLowerCase();
                const payerName = wp.payer_name?.toLowerCase();
                if (participantEmail && payerEmail === participantEmail) return true;
                if (participantName && payerName) {
                  if (payerName === participantName) return true;
                  if (participantName.includes(payerName) || payerName.includes(participantName)) return true;
                }
                return false;
              });
              const isPaid = userParticipant?.status === 'paid' || (userParticipant?.amount_paid && userParticipant.amount_paid > 0) || paidViaWeb;
              return (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>Status</Text>
                  <Text style={[styles.summaryValue, { color: isPaid ? colors.success : colors.warning }]}>
                    {isPaid ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
              );
            }

            // Creator view: show collection tracking
            const othersHaveClaims = isReceiptSplit && Array.from(itemClaims.entries()).some(
              ([userId, claims]) => userId !== currentUserId && claims.length > 0
            );
            const hasOthersOwing = othersOweTotal > 0.01 || othersHaveClaims;
            const totalPaid = split.total_paid || 0;
            const calculatedOwed = othersOweTotal > 0.01 ? othersOweTotal : (split.total_amount - creatorShare);
            const effectiveOwed = Math.max(calculatedOwed, totalPaid);
            const remaining = effectiveOwed - totalPaid;

            if (!hasOthersOwing) {
              return (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>Status</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>All yours</Text>
                </View>
              );
            }

            return (
              <>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>Collected</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    ${totalPaid.toFixed(2)} of ${effectiveOwed.toFixed(2)}
                  </Text>
                </View>
                {remaining > 0.01 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.gray500 }]}>Remaining</Text>
                    <Text style={[styles.summaryValue, { color: colors.warning }]}>
                      ${remaining.toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[styles.progressBarContainer, { backgroundColor: colors.gray200 }]}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        backgroundColor: remaining <= 0.01 ? colors.success : colors.primary,
                        width: `${Math.min(100, effectiveOwed > 0 ? (totalPaid / effectiveOwed) * 100 : 0)}%`,
                      },
                    ]}
                  />
                </View>
              </>
            );
          })()}
        </View>

        {/* Web Payments Section */}
        {split.web_payments && split.web_payments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Payments Received</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.gray500 }]}>
                {split.web_payments.length} payment{split.web_payments.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {split.web_payments.map((payment) => (
              <View
                key={payment.id}
                style={[styles.paymentCard, { backgroundColor: colors.surface }]}
              >
                <View style={[styles.paymentIcon, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: colors.gray900 }]}>
                    {payment.payer_name || payment.payer_email}
                  </Text>
                  <Text style={[styles.paymentDate, { color: colors.gray500 }]}>
                    {formatDate(payment.created_at)}
                  </Text>
                </View>
                <Text style={[styles.paymentAmount, { color: colors.success }]}>
                  +${Number(payment.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Participants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>Participants</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.gray500 }]}>
              {(() => {
                // Count participants who owe money (exclude creator)
                const owingParticipants = split.participants.filter((p: any) => p.user_id !== split.creator_id);
                const webPayments = split.web_payments || [];
                const paidCount = owingParticipants.filter((p: any) => {
                  if (p.status === 'paid') return true;
                  if (p.amount_paid > 0) return true;
                  // Check if any web payment matches this participant
                  const participantEmail = p.user?.email?.toLowerCase();
                  const participantName = p.user?.full_name?.toLowerCase();
                  return webPayments.some((wp: any) => {
                    const payerEmail = wp.payer_email?.toLowerCase();
                    const payerName = wp.payer_name?.toLowerCase();
                    if (participantEmail && payerEmail === participantEmail) return true;
                    if (participantName && payerName) {
                      if (payerName === participantName) return true;
                      if (participantName.includes(payerName) || payerName.includes(participantName)) return true;
                    }
                    return false;
                  });
                }).length;
                return `${paidCount} of ${owingParticipants.length} paid`;
              })()}
            </Text>
          </View>

          {/* Creator's Card - highlighted only if current user IS the creator */}
          {creatorShare > 0.01 && (
            <View style={[
              styles.participantCard,
              isCreator
                ? { backgroundColor: colors.primaryLight, borderWidth: 2, borderColor: colors.primary }
                : { backgroundColor: colors.surface }
            ]}>
              <View style={styles.participantInfo}>
                <View style={styles.participantAvatar}>
                  {split.creator?.avatar_url ? (
                    <Image source={{ uri: split.creator.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: isCreator ? colors.primary : colors.gray400 }]}>
                      <Text style={[styles.avatarInitials, { color: colors.surface }]}>
                        {getInitials(split.creator?.full_name || 'Creator')}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.participantDetails}>
                  <Text style={[styles.participantName, { color: colors.gray900 }]}>
                    {isCreator ? 'You' : split.creator?.full_name || 'Creator'}
                  </Text>
                  <Text style={[styles.participantAmount, { color: colors.gray500 }]}>
                    ${creatorShare.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.paidBadge, { backgroundColor: isCreator ? colors.primaryLight : colors.successLight }]}>
                  <Ionicons name={isCreator ? 'person-circle' : 'checkmark-circle'} size={20} color={isCreator ? colors.primary : colors.success} />
                  <Text style={[styles.paidBadgeText, { color: isCreator ? colors.primary : colors.success }]}>
                    {isCreator ? 'You' : 'Creator'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {split.participants
            .filter((p) => p.amount_owed > 0 || p.user_id !== split.creator_id)
            .map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              isCreator={isCreator}
              isCurrentUser={participant.user_id === currentUserId}
              onMarkAsPaid={() => handleMarkAsPaid(participant)}
              colors={colors}
              webPayments={split.web_payments || []}
              claimedItems={(participant.user_id ? itemClaims.get(participant.user_id) : undefined) || itemClaims.get((participant as any).user?.email?.toLowerCase()) || []}
            />
          ))}
        </View>

        <View style={{ height: spacing.xxxl + 60 }} />
      </ScrollView>

      {/* Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Claim Items Button - shown for receipt splits */}
        {canClaimItems && (
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: colors.primary }]}
            onPress={handleClaimItems}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.surface} />
            <Text style={[styles.payButtonText, { color: colors.surface }]}>Claim Items</Text>
          </TouchableOpacity>
        )}

        {/* Pay Button - shown if user owes money and has claimed items */}
        {userOwesMoney && !canClaimItems && (
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: colors.primary }]}
            onPress={handlePayNow}
            activeOpacity={0.7}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color={colors.surface} />
                <Text style={[styles.payButtonText, { color: colors.surface }]}>Pay ${amountOwed.toFixed(2)}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>

        {/* Only creator can delete */}
        {isCreator && (
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Participant Card Component
function ParticipantCard({
  participant,
  isCreator,
  isCurrentUser,
  onMarkAsPaid,
  colors,
  webPayments,
  claimedItems,
}: {
  participant: any;
  isCreator: boolean;
  isCurrentUser: boolean;
  onMarkAsPaid: () => void;
  colors: ThemeColors;
  webPayments: any[];
  claimedItems: any[];
}) {
  const isExternal = !participant.user_id && !!participant.external_name;

  // Check if paid via split_participants OR via web payment (matching email OR name)
  const participantEmail = (participant.user?.email || participant.external_email)?.toLowerCase();
  const participantName = (participant.user?.full_name || participant.external_name)?.toLowerCase();

  // Try to match web payment by email first, then by name as fallback
  const webPayment = webPayments.find((wp) => {
    const payerEmail = wp.payer_email?.toLowerCase();
    const payerName = wp.payer_name?.toLowerCase();
    // Match by email
    if (participantEmail && payerEmail === participantEmail) return true;
    // Match by name (if email doesn't match, check if names are similar)
    if (participantName && payerName) {
      // Exact match or contains match (e.g., "John" matches "John Doe")
      if (payerName === participantName) return true;
      if (participantName.includes(payerName) || payerName.includes(participantName)) return true;
    }
    return false;
  });
  const isPaidViaWeb = !!webPayment;
  const isPaid = participant.status === 'paid' || isPaidViaWeb;
  const paidAmount = isPaidViaWeb ? Number(webPayment.amount) : participant.amount_paid;

  return (
    <View style={[
      styles.participantCard,
      isCurrentUser
        ? { backgroundColor: colors.primaryLight, borderWidth: 2, borderColor: colors.primary }
        : { backgroundColor: colors.surface }
    ]}>
      <View style={styles.participantInfo}>
        {/* Avatar */}
        <View style={styles.participantAvatar}>
          {isExternal ? (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="link" size={22} color="#F57C00" />
            </View>
          ) : participant.user?.avatar_url ? (
            <Image source={{ uri: participant.user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isCurrentUser ? colors.primary : colors.gray400 }]}>
              <Text style={[styles.avatarInitials, { color: colors.surface }]}>
                {getInitials(participant.user?.full_name || 'U')}
              </Text>
            </View>
          )}
        </View>

        {/* Name and Amount */}
        <View style={styles.participantDetails}>
          <Text style={[styles.participantName, { color: colors.gray900 }]}>{isCurrentUser ? 'You' : (participant.external_name || participant.user?.full_name || 'Unknown')}</Text>
          <Text style={[styles.participantAmount, { color: colors.gray500 }]}>
            ${isPaidViaWeb ? paidAmount.toFixed(2) : participant.amount_owed.toFixed(2)}
          </Text>
        </View>

        {/* Status or Button */}
        {isPaid ? (
          <View style={[styles.paidBadge, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.paidBadgeText, { color: colors.success }]}>
              {isPaidViaWeb ? `Paid $${paidAmount.toFixed(2)}` : 'Paid'}
            </Text>
          </View>
        ) : (
          <>
            {isCreator && (
              <TouchableOpacity style={[styles.markPaidButton, { backgroundColor: colors.primary }]} onPress={onMarkAsPaid} activeOpacity={0.7}>
                <Text style={[styles.markPaidButtonText, { color: colors.surface }]}>Mark Paid</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Show claimed items */}
      {claimedItems.length > 0 && (
        <View style={styles.claimedItemsContainer}>
          <View style={[styles.claimedItemsDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.claimedItemsLabel, { color: colors.gray500 }]}>
            Items claimed:
          </Text>
          {claimedItems.map((item, index) => (
            <View key={index} style={styles.claimedItemRow}>
              <Text style={[styles.claimedItemName, { color: colors.gray700 }]}>
                {item.quantity_claimed && item.quantity_claimed > 1
                  ? `${item.quantity_claimed}x `
                  : ''}{item.item_name}
              </Text>
              <Text style={[styles.claimedItemPrice, { color: colors.gray600 }]}>
                ${(Number(item.item_amount) / (item.share_count || 1)).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// Helper Functions
function getSplitMethodLabel(splitType: string): string {
  switch (splitType) {
    case 'equal':
      return 'Equal Split';
    case 'custom':
      return 'Custom Amounts';
    case 'percentage':
      return 'Percentage Split';
    case 'receipt':
      return 'Receipt Scan';
    default:
      return splitType;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.h3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.low,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  receiptImageContainer: {
    margin: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 200,
  },
  summaryCard: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryTitle: {
    ...typography.h2,
    flex: 1,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  settledBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: 4,
  },
  summaryDescription: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  summaryDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.body,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  sectionSubtitle: {
    ...typography.caption,
  },
  participantCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...typography.h3,
    fontWeight: '700',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  participantAmount: {
    ...typography.body,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  paidBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: 4,
  },
  markPaidButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  markPaidButtonText: {
    ...typography.caption,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    ...shadows.medium,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionButtonText: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 4,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    gap: spacing.sm,
    minWidth: 140,
  },
  payButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadows.low,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    ...typography.body,
    fontWeight: '600',
  },
  paymentDate: {
    ...typography.caption,
    marginTop: 2,
  },
  paymentAmount: {
    ...typography.h4,
    fontWeight: '700',
  },
  claimedItemsContainer: {
    marginTop: spacing.sm,
  },
  claimedItemsDivider: {
    height: 1,
    marginBottom: spacing.sm,
  },
  claimedItemsLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  claimedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  claimedItemName: {
    ...typography.caption,
    flex: 1,
  },
  claimedItemPrice: {
    ...typography.caption,
    fontWeight: '500',
  },
});
