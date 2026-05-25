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
    errors?: Array<{ code: string; reason: string; requirement: string }>;
  };
}

export type StripeOnboardingState =
  | 'new_account'
  | 'needs_id'
  | 'needs_info'
  | 'incomplete'
  | 'verified';

export interface StripeOnboardingLink {
  accountId: string;
  url: string;
  expiresAt: number | null;
  state: StripeOnboardingState;
  currentlyDue: string[];
  pastDue?: string[];
  errors?: Array<{ code: string; reason: string; requirement: string }>;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted?: boolean;
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
 * Calculate dynamic fee per payer that guarantees $0.50 profit after Stripe fees.
 * Formula: fee = (0.80 + 0.0175 * amount) / 0.9825
 * This covers Stripe processing (1.75% + $0.30) and nets $0.50 per transaction.
 *
 * @param amount - The amount this payer owes
 * @param participantCount - Not used anymore (kept for backwards compat)
 */
export function calculateFees(amount: number, participantCount: number = 1): PaymentFeeBreakdown {
  const fee = amount > 0 ? (0.80 + 0.0175 * amount) / 0.9825 : 0;
  const total = amount + fee;

  return {
    amount: parseFloat(amount.toFixed(2)),
    stripeFee: 0,
    userFee: parseFloat(fee.toFixed(2)),
    instantPayoutFee: 0,
    platformFee: parseFloat(fee.toFixed(2)),
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
 * Get the right Stripe link for the user's current state.
 * Server decides whether to return a new-account onboarding URL, a currently_due
 * account_links URL, or an Express dashboard login link — caller just opens it.
 */
export async function getOnboardingLink(userId: string): Promise<StripeOnboardingLink | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-stripe-onboarding-link', {
      body: { userId },
    });
    if (error) {
      console.error('Error getting Stripe onboarding link:', error);
      return null;
    }
    return data as StripeOnboardingLink;
  } catch (err) {
    console.error('Failed to fetch Stripe onboarding link:', err);
    return null;
  }
}

/**
 * Translate a Stripe requirement key into a short human-readable label.
 * Falls back to a cleaned-up version of the key if we don't have a mapping yet.
 */
export function describeRequirement(req: string): string {
  const map: Record<string, string> = {
    'individual.verification.document': 'Upload a government ID (passport or driver’s licence)',
    'individual.verification.document.front': 'Upload the front of your ID',
    'individual.verification.document.back': 'Upload the back of your ID',
    'individual.verification.additional_document': 'Upload an additional ID document',
    'individual.dob.day': 'Confirm your date of birth',
    'individual.dob.month': 'Confirm your date of birth',
    'individual.dob.year': 'Confirm your date of birth',
    'individual.first_name': 'Confirm your legal first name',
    'individual.last_name': 'Confirm your legal last name',
    'individual.address.line1': 'Confirm your home address',
    'individual.address.postal_code': 'Confirm your postcode',
    'individual.address.city': 'Confirm your city',
    'individual.address.state': 'Confirm your state',
    'individual.phone': 'Confirm your phone number',
    'individual.email': 'Confirm your email',
    'individual.id_number': 'Provide your tax / ID number',
    'external_account': 'Add your bank account details (BSB + account number)',
    'tos_acceptance.date': 'Accept Stripe’s terms of service',
    'tos_acceptance.ip': 'Accept Stripe’s terms of service',
  };
  if (map[req]) return map[req];
  // Strip prefix + tidy: 'individual.dob.day' -> 'Dob day'
  const tail = req.split('.').slice(-1)[0].replace(/_/g, ' ');
  return tail.charAt(0).toUpperCase() + tail.slice(1);
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
  participantCount: number = 1
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
      // Supabase wraps non-2xx responses with a generic message,
      // but the actual error details are in the data object
      let errorMessage = data?.error || error.message || 'Failed to create payment';
      if (data?.receiverName && errorMessage.includes('payment account')) {
        errorMessage = `${data.receiverName} hasn't set up their payment account yet. They need to connect Stripe in Settings before you can pay them.`;
      }
      return {
        success: false,
        error: errorMessage,
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
      // Note: testEnv must be false for Google Pay to appear in the payment sheet.
      // In dev mode (Stripe test keys), Google Pay will show but can't complete payment.
      // In production (live Stripe keys), Google Pay works fully.
      googlePay: {
        merchantCountryCode: 'AU',
        testEnv: false,
        currencyCode: 'AUD',
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
    // Fetch in-app payments
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

    // Fetch web payments received by this user
    const { data: webPayments } = await supabase
      .from('web_payments')
      .select('*, split:split_id (id, title)')
      .eq('recipient_user_id', userId)
      .eq('status', 'settled')
      .order('created_at', { ascending: false });

    // Convert web payments to Payment format
    const webAsPayments: Payment[] = (webPayments || []).map((wp: any) => ({
      id: wp.id,
      split_id: wp.split_id,
      from_user_id: '',
      to_user_id: userId,
      amount: wp.amount,
      stripe_fee_amount: null,
      payment_method: 'web',
      stripe_payment_intent_id: null,
      status: 'completed' as const,
      created_at: wp.created_at,
      completed_at: wp.created_at,
      payer: {
        id: '',
        email: wp.payer_email || '',
        full_name: wp.payer_name || 'Web Payment',
        avatar_url: null,
      },
      split: wp.split,
    }));

    // Merge and sort by date
    const all = [...(data || []), ...webAsPayments];
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all;
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

    // Also fetch web payments
    const { data: webPayments } = await supabase
      .from('web_payments')
      .select('*, split:split_id (id, title)')
      .eq('recipient_user_id', userId)
      .eq('status', 'settled')
      .order('created_at', { ascending: false });

    const webAsPayments: Payment[] = (webPayments || []).map((wp: any) => ({
      id: wp.id,
      split_id: wp.split_id,
      from_user_id: '',
      to_user_id: userId,
      amount: wp.amount,
      stripe_fee_amount: null,
      payment_method: 'web',
      stripe_payment_intent_id: null,
      status: 'completed' as const,
      created_at: wp.created_at,
      completed_at: wp.created_at,
      payer: {
        id: '',
        email: wp.payer_email || '',
        full_name: wp.payer_name || 'Web Payment',
        avatar_url: null,
      },
      split: wp.split,
    }));

    const all = [...(data || []), ...webAsPayments];
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all;
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
