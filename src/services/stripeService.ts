// ═══════════════════════════════════════════════════════════════
// Stripe Service - Client-side wrapper for Stripe payments
// ═══════════════════════════════════════════════════════════════

import { supabase } from './supabase';
// Note: Stripe functions (initPaymentSheet, presentPaymentSheet) should be
// accessed via useStripe() hook in components, not imported directly here

export interface PaymentFeeBreakdown {
  amount: number;
  stripeFee: number;
  userFee: number;
  instantPayoutFee: number;
  platformFee: number;
  total: number;
}

export interface CreatePaymentResult {
  success: boolean;
  paymentIntentId?: string;
  paymentId?: string;
  error?: string;
}

export interface ConnectAccountStatus {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

export interface Payment {
  id: string;
  split_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  stripe_fee_amount: number | null;
  payment_method: string;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  created_at: string;
  completed_at: string | null;
  // Nested relationship data returned by Supabase queries
  payer?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
  split?: {
    id: string;
    title: string;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Fee Calculation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Calculate all fees for a payment, split fairly among ALL participants:
 * 1. Stripe processing fee: 2.9% + $0.30 AUD (split equally among all participants)
 * 2. Instant payout fee: 1.5% (split equally among all participants)
 * 3. Platform fee: $0.50 AUD ZapSplit fee (split equally among all participants)
 *
 * @param amount - The amount this payer owes
 * @param participantCount - Total number of participants in the split (including receiver)
 */
export function calculateFees(amount: number, participantCount: number = 2): PaymentFeeBreakdown {
  const stripeFee = amount * 0.029 + 0.3; // Stripe's fee for this transaction
  const instantPayoutFee = amount * 0.015; // 1.5% instant payout fee
  const platformFee = 0.5 / participantCount; // $0.50 split among all participants
  const userFee = stripeFee / participantCount; // Each person's share of Stripe fee
  const userInstantFee = instantPayoutFee / participantCount; // Each person's share of instant fee
  const total = amount + userFee + userInstantFee + platformFee;

  return {
    amount: parseFloat(amount.toFixed(2)),
    stripeFee: parseFloat(stripeFee.toFixed(2)),
    userFee: parseFloat((userFee + userInstantFee + platformFee).toFixed(2)), // Total fee this payer pays
    instantPayoutFee: parseFloat(userInstantFee.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Connect Account Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Create a Stripe Connect account for a user to receive payments
 */
export async function createConnectAccount(
  userId: string,
  email: string,
  refreshUrl?: string,
  returnUrl?: string
): Promise<{ onboardingUrl: string; accountId: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-connect-account', {
      body: { userId, email, refreshUrl, returnUrl },
    });

    if (error) {
      console.error('Error creating Connect account:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error data response:', data);
      throw new Error(error.message);
    }

    return {
      onboardingUrl: data.onboardingUrl,
      accountId: data.accountId,
    };
  } catch (error) {
    console.error('Failed to create Connect account:', error);
    return null;
  }
}

/**
 * Check the status of a user's Stripe Connect account
 */
export async function checkAccountStatus(userId: string): Promise<ConnectAccountStatus | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-account-status', {
      body: { userId },
    });

    if (error) {
      console.error('Error checking account status:', error);
      throw new Error(error.message);
    }

    return data as ConnectAccountStatus;
  } catch (error) {
    console.error('Failed to check account status:', error);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Payment Processing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Create a payment intent and present the Stripe payment sheet
 */
export async function createPayment(
  fromUserId: string,
  toUserId: string,
  amount: number,
  splitId: string,
  initPaymentSheet: any, // Pass from useStripe() hook
  presentPaymentSheet: any, // Pass from useStripe() hook
  participantCount: number = 2
): Promise<CreatePaymentResult> {
  try {
    // Call Edge Function to create payment intent
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        fromUserId,
        toUserId,
        amount,
        splitId,
        participantCount,
      },
    });

    if (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment',
      };
    }

    const { clientSecret, paymentIntentId, paymentId } = data;

    // Initialize payment sheet with Apple Pay and Google Pay
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'ZapSplit',
      paymentIntentClientSecret: clientSecret,
      defaultBillingDetails: {},
      allowsDelayedPaymentMethods: false,
      // Enable Apple Pay
      applePay: {
        merchantCountryCode: 'AU',
      },
      // Enable Google Pay
      googlePay: {
        merchantCountryCode: 'AU',
        testEnv: __DEV__, // Use test environment in development
      },
    });

    if (initError) {
      console.error('Error initializing payment sheet:', initError);
      return {
        success: false,
        error: initError.message,
      };
    }

    // Present payment sheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      console.error('Error presenting payment sheet:', presentError);
      return {
        success: false,
        error: presentError.message,
      };
    }

    // Payment successful!
    return {
      success: true,
      paymentIntentId,
      paymentId,
    };
  } catch (error: any) {
    console.error('Payment failed:', error);
    return {
      success: false,
      error: error.message || 'Payment failed',
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Payment History
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get payment history for a user (sent and received)
 */
export async function getPaymentHistory(userId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        payer:from_user_id (id, email, full_name, avatar_url),
        receiver:to_user_id (id, email, full_name, avatar_url),
        split:split_id (id, title)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch payment history:', error);
    return [];
  }
}

/**
 * Get payments sent by a user
 */
export async function getPaymentsSent(userId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        receiver:to_user_id (id, email, full_name, avatar_url),
        split:split_id (id, title)
      `)
      .eq('from_user_id', userId)
      .neq('to_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sent payments:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch sent payments:', error);
    return [];
  }
}

/**
 * Get payments received by a user
 */
export async function getPaymentsReceived(userId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        payer:from_user_id (id, email, full_name, avatar_url),
        split:split_id (id, title)
      `)
      .eq('to_user_id', userId)
      .neq('from_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received payments:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch received payments:', error);
    return [];
  }
}

/**
 * Get a specific payment by ID
 */
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        payer:from_user_id (id, email, full_name, avatar_url),
        receiver:to_user_id (id, email, full_name, avatar_url),
        split:split_id (id, title)
      `)
      .eq('id', paymentId)
      .single();

    if (error) {
      console.error('Error fetching payment:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch payment:', error);
    return null;
  }
}
