import { supabase } from './supabase';

export interface CreateSplitParticipant {
  user_id?: string;
  amount_owed: number;
  external_name?: string;
  external_email?: string;
  external_phone?: string;
}

export interface CreateSplitData {
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  split_method: 'equal' | 'custom' | 'percentage' | 'receipt';
  participants: CreateSplitParticipant[];
  image_url?: string;
  receipt_data?: {
    subtotal: number;
    tax: number;
    tip: number;
  };
  group_id?: string;
}

export interface Split {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  total_amount: number;
  tax_amount?: number;
  tip_amount?: number;
  currency: string;
  image_url?: string;
  split_type?: 'equal' | 'custom' | 'percentage' | 'receipt';
  status: 'active' | 'settled';
  receipt_parsed_data?: {
    tax?: number;
    tip?: number;
    subtotal?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface SplitParticipant {
  id: string;
  split_id: string;
  user_id: string | null;
  amount_owed: number;
  amount_paid: number;
  status: 'pending' | 'paid';
  external_name?: string | null;
  external_email?: string | null;
  external_phone?: string | null;
}

/**
 * Create a new split in the database with participants
 *
 * RLS is enabled with proper non-recursive policies using SECURITY DEFINER functions.
 * Users can only see/modify splits they created or participate in.
 */
export async function createSplit(data: CreateSplitData): Promise<Split> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Prepare split data for insertion (handle undefined values)
  const splitData = {
    creator_id: user.id,
    title: data.title,
    description: data.description || null,
    total_amount: data.total_amount,
    currency: data.currency,
    split_type: data.split_method, // Map split_method to split_type column
    image_url: data.image_url || null,
    group_id: data.group_id || null,
    status: 'active' as const,
  };

  // Insert split record
  const { data: split, error: splitError} = await supabase
    .from('splits')
    .insert(splitData)
    .select()
    .single();

  if (splitError) throw splitError;
  if (!split) throw new Error('Failed to create split');

  // Insert participants (including creator and external participants)
  const participantsData = data.participants.map(p => ({
    split_id: split.id,
    user_id: p.user_id || null,
    amount_owed: p.amount_owed,
    amount_paid: 0,
    status: 'pending' as const,
    external_name: p.external_name || null,
    external_email: p.external_email || null,
    external_phone: p.external_phone || null,
  }));

  const { error: participantsError } = await supabase
    .from('split_participants')
    .insert(participantsData);

  if (participantsError) {
    // Rollback: delete the split if participants insertion fails
    await supabase.from('splits').delete().eq('id', split.id);
    throw participantsError;
  }

  return split;
}

/**
 * Calculate equal split amount per person (base amount)
 * Note: Use calculateEqualSplitAmounts() for accurate distribution
 */
export function calculateEqualSplit(
  total: number,
  participantCount: number
): number {
  if (participantCount === 0) return 0;
  // Use floor to avoid exceeding total, remainder goes to first participant
  return Math.floor((total / participantCount) * 100) / 100;
}

/**
 * Calculate equal split amounts for all participants
 * Ensures the sum exactly matches the total by giving remainder cents to first participant
 */
export function calculateEqualSplitAmounts(
  total: number,
  participantIds: string[]
): { [participantId: string]: number } {
  const count = participantIds.length;
  if (count === 0) return {};

  // Calculate base amount (floor to avoid exceeding total)
  const baseAmount = Math.floor((total / count) * 100) / 100;

  // Calculate what we've assigned so far
  const assignedTotal = baseAmount * count;

  // Calculate remainder (in cents to avoid floating point issues)
  const remainderCents = Math.round((total - assignedTotal) * 100);

  const amounts: { [participantId: string]: number } = {};

  participantIds.forEach((id, index) => {
    if (index < remainderCents) {
      // Give 1 extra cent to first N participants where N = remainder cents
      amounts[id] = Math.round((baseAmount + 0.01) * 100) / 100;
    } else {
      amounts[id] = baseAmount;
    }
  });

  return amounts;
}

/**
 * Calculate percentage-based split amounts
 */
export function calculatePercentageSplit(
  total: number,
  percentages: { [participantId: string]: number }
): { [participantId: string]: number } {
  const amounts: { [participantId: string]: number } = {};

  Object.entries(percentages).forEach(([participantId, percentage]) => {
    amounts[participantId] = Math.round((total * percentage / 100) * 100) / 100;
  });

  return amounts;
}

/**
 * Validate custom split amounts (must equal total)
 */
export function validateCustomSplit(
  amounts: { [participantId: string]: number },
  total: number
): { valid: boolean; difference: number } {
  const sum = Object.values(amounts).reduce((acc, val) => acc + val, 0);
  const difference = Math.round((sum - total) * 100) / 100;

  // Allow for small floating point errors (< 1 cent)
  const valid = Math.abs(difference) < 0.01;

  return { valid, difference };
}

/**
 * Upload split receipt image to Supabase Storage
 */
export async function uploadSplitImage(uri: string, splitId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Convert URI to blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // Generate unique filename
  const fileExt = uri.split('.').pop();
  const fileName = `${user.id}/${splitId}-${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('split-receipts')
    .upload(fileName, blob);

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('split-receipts')
    .getPublicUrl(fileName);

  return publicUrl;
}

export interface WebPayment {
  id: string;
  split_id: string;
  payer_email: string;
  payer_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface SplitWithParticipants extends Split {
  participants: SplitParticipant[];
  participant_count: number;
  paid_count: number;
  web_payments?: WebPayment[];
  total_paid?: number;
  amount_remaining?: number;
  creator_claimed_amount?: number;
  amount_owed_by_others?: number;
  creator?: {
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Get all splits for current user (as creator or participant) with participant data
 */
export async function getUserSplits(): Promise<SplitWithParticipants[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[getUserSplits] Auth error:', authError);
    throw new Error('Authentication error');
  }
  if (!user) throw new Error('User not authenticated');

  // Get splits where user is creator
  const { data: createdSplits, error: createdError } = await supabase
    .from('splits')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  if (createdError) throw createdError;

  // Get splits where user is participant
  const { data: participantSplits, error: participantError } = await supabase
    .from('split_participants')
    .select('split_id')
    .eq('user_id', user.id);

  if (participantError) throw participantError;

  const participantSplitIds = participantSplits?.map(p => p.split_id) || [];

  let participatedSplits: Split[] = [];
  if (participantSplitIds.length > 0) {
    const { data, error: participatedError } = await supabase
      .from('splits')
      .select('*')
      .in('id', participantSplitIds)
      .order('created_at', { ascending: false });

    if (participatedError) throw participatedError;
    participatedSplits = data || [];
  }

  // Combine and deduplicate
  const allSplits = [...(createdSplits || []), ...participatedSplits];
  const uniqueSplits = Array.from(
    new Map(allSplits.map(split => [split.id, split])).values()
  );

  // Fetch creator profiles for all splits
  const creatorIds = [...new Set(uniqueSplits.map(s => s.creator_id))];
  const { data: creatorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', creatorIds);
  const creatorMap = new Map(
    (creatorProfiles || []).map(p => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
  );

  // Fetch participants and web payments for each split
  const splitsWithParticipants = await Promise.all(
    uniqueSplits.map(async (split) => {
      const { data: participants, error } = await supabase
        .from('split_participants')
        .select('*')
        .eq('split_id', split.id);

      if (error) throw error;

      // Also get web payments (to know who has paid)
      const { data: webPayments } = await supabase
        .from('web_payments')
        .select('id, amount, status, payer_email')
        .eq('split_id', split.id)
        .eq('status', 'settled');

      // Get creator's claims (they don't pay themselves)
      const { data: creatorClaims } = await supabase
        .from('item_claims')
        .select('item_amount, share_count')
        .eq('split_id', split.id)
        .eq('claimed_by_user_id', split.creator_id);

      // Get all claims for this split to calculate totals
      const { data: allClaims } = await supabase
        .from('item_claims')
        .select('item_amount, share_count, claimed_by_email, claimed_by_user_id')
        .eq('split_id', split.id);

      // Get ACTUAL total items value from split_items (not from claims)
      const { data: splitItems } = await supabase
        .from('split_items')
        .select('total_price')
        .eq('split_id', split.id);

      const totalItemsValue = splitItems?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;

      const paidCount = participants?.filter(p => p.status === 'paid').length || 0;

      // Calculate creator's claimed items
      const creatorClaimedItems = creatorClaims?.reduce((sum, claim) => {
        const shareCount = claim.share_count || 1;
        return sum + (Number(claim.item_amount) / shareCount);
      }, 0) || 0;

      // Calculate tax/tip using actual items value (not just claimed items)
      const taxTipAmount = Math.max(0, split.total_amount - totalItemsValue);

      // Calculate proportional tax/tip for creator
      const creatorTaxTipShare = totalItemsValue > 0
        ? (creatorClaimedItems / totalItemsValue) * taxTipAmount
        : 0;
      const creatorClaimedAmount = creatorClaimedItems + creatorTaxTipShare;

      // Calculate total paid - use ITEM amounts from claims plus proportional tax/tip
      const paidEmails = new Set(
        (webPayments || []).map((wp: any) => wp.payer_email?.toLowerCase())
      );
      const participantsPaid = participants?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

      // Sum item amounts for users who have paid (excluding creator)
      const paidClaimsItems = (allClaims || []).reduce((sum, claim) => {
        if (claim.claimed_by_user_id === split.creator_id) return sum;
        const email = claim.claimed_by_email?.toLowerCase();
        if (email && paidEmails.has(email)) {
          const shareCount = claim.share_count || 1;
          return sum + (Number(claim.item_amount) / shareCount);
        }
        return sum;
      }, 0);

      // Add proportional tax/tip to paid claims based on total items value
      const paidTaxTipShare = totalItemsValue > 0
        ? (paidClaimsItems / totalItemsValue) * taxTipAmount
        : 0;
      const paidClaimsTotal = paidClaimsItems + paidTaxTipShare;

      const totalPaid = participantsPaid + paidClaimsTotal;

      // Amount owed by others depends on split type
      // For receipt splits: use item claims to determine creator's share
      // For manual splits: use sum of participant amounts (they are the ones who owe)
      const isReceiptSplit = split.split_type === 'receipt';
      const participantAmountsTotal = participants?.reduce((sum, p) => sum + (p.amount_owed || 0), 0) || 0;

      const amountOwedByOthers = isReceiptSplit
        ? split.total_amount - creatorClaimedAmount
        : participantAmountsTotal;

      // For manual splits, creator's share is total minus what participants owe
      const creatorShareAmount = isReceiptSplit
        ? creatorClaimedAmount
        : split.total_amount - participantAmountsTotal;

      return {
        ...split,
        participants: participants || [],
        participant_count: participants?.length || 0,
        paid_count: paidCount,
        total_paid: totalPaid,
        creator_claimed_amount: creatorShareAmount,
        amount_owed_by_others: amountOwedByOthers,
        amount_remaining: Math.max(0, amountOwedByOthers - totalPaid),
        creator: creatorMap.get(split.creator_id),
      };
    })
  );

  // Sort by created_at descending to ensure newest first
  const sortedSplits = splitsWithParticipants.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return sortedSplits;
}

/**
 * Get split participants with user details
 */
export async function getSplitParticipants(splitId: string) {
  const { data, error } = await supabase
    .from('split_participants')
    .select(`
      *,
      user:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('split_id', splitId);

  if (error) throw error;

  // For external participants (no user_id), populate user-like fields from external_ columns
  return (data || []).map(p => {
    if (!p.user_id && p.external_name) {
      return {
        ...p,
        user: {
          id: p.id,
          email: p.external_email || '',
          full_name: p.external_name,
          avatar_url: null,
        },
      };
    }
    return p;
  });
}

/**
 * Validation: Amount must be > 0
 */
export function validateAmount(amount: number): boolean {
  return amount > 0;
}

/**
 * Validation: At least 2 participants (including creator)
 */
export function validateParticipantCount(count: number): boolean {
  return count >= 2;
}

/**
 * Validation: Title is required (max 50 chars)
 */
export function validateTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Title must be 50 characters or less' };
  }

  return { valid: true };
}

/**
 * Create a receipt-based split with items and assignments
 *
 * This is a convenience function that:
 * 1. Creates the split record
 * 2. Creates split items
 * 3. Creates item assignments
 *
 * @param data - Split creation data
 * @param items - Receipt items
 * @param assignments - Item assignments
 * @returns Created split
 */
export async function createReceiptSplit(
  data: CreateSplitData,
  receiptItems: any[],
  itemAssignments: any[]
): Promise<Split> {
  // Import itemService functions (avoid circular dependency)
  const { createSplitItems, createUserItemAssignments } = require('./itemService');

  // Create the split record first
  const split = await createSplit(data);

  try {
    // Create split items (if provided)
    if (receiptItems && receiptItems.length > 0) {
      await createSplitItems(split.id, receiptItems);
    }

    // Note: Item assignments are created separately by each user
    // when they mark their items, so we don't create them here

    return split;
  } catch (error) {
    // Rollback: delete the split if items/assignments creation fails
    await supabase.from('splits').delete().eq('id', split.id);
    throw error;
  }
}

// ============================================================================
// PHASE 7: SPLIT DETAIL & MANAGEMENT
// ============================================================================

/**
 * Get split by ID with full details (participants, creator, items)
 *
 * @param splitId - Split ID
 * @returns Split with participants and creator details
 */
export async function getSplitById(splitId: string): Promise<SplitWithParticipants | null> {
  // Get the split
  const { data: split, error: splitError } = await supabase
    .from('splits')
    .select('*')
    .eq('id', splitId)
    .single();

  if (splitError) throw splitError;
  if (!split) return null;

  // Get participants with user details
  const { data: rawParticipants, error: participantsError } = await supabase
    .from('split_participants')
    .select(`
      *,
      user:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('split_id', splitId);

  if (participantsError) throw participantsError;

  // For external participants (no user_id), populate user-like fields
  const participants = (rawParticipants || []).map(p => {
    if (!p.user_id && p.external_name) {
      return {
        ...p,
        user: {
          id: p.id,
          email: p.external_email || '',
          full_name: p.external_name,
          avatar_url: null,
        },
      };
    }
    return p;
  });

  // Get web payments for this split
  const { data: webPayments } = await supabase
    .from('web_payments')
    .select('id, split_id, payer_email, payer_name, amount, status, created_at')
    .eq('split_id', splitId)
    .eq('status', 'settled')
    .order('created_at', { ascending: false });

  // Get creator's profile
  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', split.creator_id)
    .single();

  // Get creator's claims (creator doesn't pay themselves)
  const { data: creatorClaims } = await supabase
    .from('item_claims')
    .select('item_amount, share_count')
    .eq('split_id', splitId)
    .eq('claimed_by_user_id', split.creator_id);

  const paidCount = participants?.filter(p => p.status === 'paid').length || 0;

  // Calculate creator's claimed total (they don't need to pay themselves)
  const creatorClaimedItems = creatorClaims?.reduce((sum, claim) => {
    const shareCount = claim.share_count || 1;
    return sum + (Number(claim.item_amount) / shareCount);
  }, 0) || 0;

  // Get all item claims to calculate total claimed items value
  const { data: allClaims } = await supabase
    .from('item_claims')
    .select('item_amount, share_count, claimed_by_email, claimed_by_user_id')
    .eq('split_id', splitId);

  const totalClaimedItems = allClaims?.reduce((sum, claim) => {
    const shareCount = claim.share_count || 1;
    return sum + (Number(claim.item_amount) / shareCount);
  }, 0) || 0;

  // Get ACTUAL total items value from split_items (not from claims)
  // This is needed for accurate tax/tip calculation when not all items are claimed
  const { data: splitItems } = await supabase
    .from('split_items')
    .select('total_price')
    .eq('split_id', splitId);

  const totalItemsValue = splitItems?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;

  // Calculate tax/tip as difference between total and actual items subtotal
  // Use totalItemsValue (from receipt), NOT totalClaimedItems (only what's been claimed)
  const taxTipAmount = Math.max(0, split.total_amount - totalItemsValue);

  // Calculate proportional tax/tip for creator's items
  const creatorTaxTipShare = totalItemsValue > 0
    ? (creatorClaimedItems / totalItemsValue) * taxTipAmount
    : 0;
  const creatorClaimedAmount = creatorClaimedItems + creatorTaxTipShare;

  // Calculate total paid - use ITEM amounts from claims plus proportional tax/tip
  // This represents what the creator will actually receive (excluding service fees which go to platform)
  const paidEmails = new Set(
    (webPayments || []).map((wp: any) => wp.payer_email?.toLowerCase())
  );
  const participantsPaid = participants?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

  // Sum item amounts for users who have paid (excluding creator)
  const paidClaimsItems = (allClaims || []).reduce((sum, claim) => {
    // Skip creator's claims
    if (claim.claimed_by_user_id === split.creator_id) return sum;
    // Check if this user has paid via web payment
    const email = claim.claimed_by_email?.toLowerCase();
    if (email && paidEmails.has(email)) {
      const shareCount = claim.share_count || 1;
      return sum + (Number(claim.item_amount) / shareCount);
    }
    return sum;
  }, 0);

  // Add proportional tax/tip to paid claims based on total items value (not just claimed)
  const paidTaxTipShare = totalItemsValue > 0
    ? (paidClaimsItems / totalItemsValue) * taxTipAmount
    : 0;
  const paidClaimsTotal = paidClaimsItems + paidTaxTipShare;

  const totalPaid = participantsPaid + paidClaimsTotal;

  // Amount owed by others depends on split type
  // For receipt splits: use item claims to determine creator's share
  // For manual splits: use sum of participant amounts (they are the ones who owe)
  const isReceiptSplit = split.split_type === 'receipt';
  const participantAmountsTotal = participants?.reduce((sum, p) => sum + (p.amount_owed || 0), 0) || 0;

  const amountOwedByOthers = isReceiptSplit
    ? split.total_amount - creatorClaimedAmount
    : participantAmountsTotal;

  // For manual splits, creator's share is total minus what participants owe
  const creatorShareAmount = isReceiptSplit
    ? creatorClaimedAmount
    : split.total_amount - participantAmountsTotal;

  const amountRemaining = Math.max(0, amountOwedByOthers - totalPaid);

  return {
    ...split,
    participants: participants || [],
    participant_count: participants?.length || 0,
    paid_count: paidCount,
    web_payments: webPayments || [],
    total_paid: totalPaid,
    amount_remaining: amountRemaining,
    creator_claimed_amount: creatorShareAmount,
    amount_owed_by_others: amountOwedByOthers,
    creator: creatorProfile || undefined,
  };
}

/**
 * Mark a participant as paid
 *
 * @param participantId - Participant ID from split_participants table
 * @param splitId - Split ID (for checking if all paid)
 * @returns Updated participant
 */
export async function markParticipantAsPaid(
  participantId: string,
  splitId: string
): Promise<SplitParticipant> {
  // First get the participant to know their amount_owed
  const { data: existingParticipant, error: fetchError } = await supabase
    .from('split_participants')
    .select('amount_owed')
    .eq('id', participantId)
    .single();

  if (fetchError) throw fetchError;

  // Update participant to paid with amount_paid = amount_owed
  const { data: participant, error } = await supabase
    .from('split_participants')
    .update({
      status: 'paid',
      amount_paid: existingParticipant.amount_owed,
    })
    .eq('id', participantId)
    .select()
    .single();

  if (error) throw error;

  // Check if all participants are now paid
  await checkIfSplitSettled(splitId);

  return participant;
}

/**
 * Check if all participants have paid, and mark split as settled
 *
 * @param splitId - Split ID
 * @returns True if split is now settled
 */
export async function checkIfSplitSettled(splitId: string): Promise<boolean> {
  // Get all participants for this split
  const { data: participants, error } = await supabase
    .from('split_participants')
    .select('status')
    .eq('split_id', splitId);

  if (error) throw error;

  // Check if all are paid
  const allPaid = participants?.every(p => p.status === 'paid') || false;

  if (allPaid) {
    // Update split status to settled
    await supabase
      .from('splits')
      .update({ status: 'settled' })
      .eq('id', splitId);
  }

  return allPaid;
}

/**
 * Update split (title, description, amount)
 * Only basic fields for MVP
 *
 * @param splitId - Split ID
 * @param updates - Fields to update
 * @returns Updated split
 */
export async function updateSplit(
  splitId: string,
  updates: {
    title?: string;
    description?: string;
    total_amount?: number;
  }
): Promise<Split> {
  const { data, error } = await supabase
    .from('splits')
    .update(updates)
    .eq('id', splitId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete split with cascade (items, assignments, participants, storage)
 *
 * @param splitId - Split ID
 */
export async function deleteSplit(splitId: string): Promise<void> {
  // Get split to check for receipt image
  const { data: split } = await supabase
    .from('splits')
    .select('image_url, split_type')
    .eq('id', splitId)
    .single();

  // If receipt split, delete related items and assignments
  if (split?.split_type === 'receipt') {
    // Import itemService functions
    const { deleteSplitItems, deleteItemAssignments } = require('./itemService');

    // Delete item assignments
    await deleteItemAssignments(splitId);

    // Delete split items
    await deleteSplitItems(splitId);
  }

  // Delete receipt image from storage if exists
  if (split?.image_url) {
    try {
      // Extract file path from URL
      // URL format: https://.../storage/v1/object/public/split-receipts/path/to/file.jpg
      const urlParts = split.image_url.split('/split-receipts/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('split-receipts').remove([filePath]);
      }
    } catch (storageError) {
      console.error('Error deleting receipt image:', storageError);
      // Continue with split deletion even if image deletion fails
    }
  }

  // Delete participants
  await supabase
    .from('split_participants')
    .delete()
    .eq('split_id', splitId);

  // Delete split
  const { error } = await supabase
    .from('splits')
    .delete()
    .eq('id', splitId);

  if (error) throw error;
}

/**
 * Generate shareable message for a split
 *
 * @param split - Split with participants
 * @param currentUserId - Current user ID (to personalize message)
 * @returns Shareable text message
 */
export function generateShareMessage(
  split: SplitWithParticipants,
  currentUserId: string
): string {
  // Find current user's participant record
  const userParticipant = split.participants.find(p => p.user_id === currentUserId);

  let message = `💸 Split: ${split.title}\n\n`;
  message += `Total: $${split.total_amount.toFixed(2)} AUD\n`;

  if (userParticipant) {
    message += `You owe: $${userParticipant.amount_owed.toFixed(2)}\n`;
    if (userParticipant.status === 'paid') {
      message += `Status: ✅ Paid\n`;
    } else {
      message += `Status: ⏳ Pending\n`;
    }
  }

  if (split.description) {
    message += `\n${split.description}\n`;
  }

  message += `\n${split.participant_count} people • `;
  message += `${split.paid_count} paid • `;
  message += `${split.participant_count - split.paid_count} pending`;

  message += `\n\nShared via ZapSplit 🇦🇺`;

  return message;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Payment Link Generation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WEB_BASE_URL = 'https://zapsplit.com.au';

/**
 * Generate a random short code for payment links
 */
function generateShortCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: 0, O, I, 1
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface PaymentLink {
  id: string;
  split_id: string;
  short_code: string;
  creator_id: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

/**
 * Get or create a payment link for a split
 * If a link already exists, return it. Otherwise, create a new one.
 */
export async function getOrCreatePaymentLink(
  splitId: string,
  creatorId: string
): Promise<{ link: PaymentLink; url: string } | null> {
  try {
    // Check if a payment link already exists for this split
    const { data: existingLink, error: fetchError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('split_id', splitId)
      .eq('is_active', true)
      .single();

    if (existingLink && !fetchError) {
      return {
        link: existingLink,
        url: `${WEB_BASE_URL}/pay/${existingLink.short_code}`,
      };
    }

    // Generate a unique short code
    let shortCode = generateShortCode();
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('payment_links')
        .select('id')
        .eq('short_code', shortCode)
        .single();

      if (!existing) break;
      shortCode = generateShortCode();
      attempts++;
    }

    // Create new payment link
    const { data: newLink, error: createError } = await supabase
      .from('payment_links')
      .insert({
        split_id: splitId,
        short_code: shortCode,
        created_by: creatorId,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating payment link:', createError);
      throw createError;
    }

    return {
      link: newLink,
      url: `${WEB_BASE_URL}/pay/${newLink.short_code}`,
    };
  } catch (error) {
    console.error('Failed to get or create payment link:', error);
    return null;
  }
}

/**
 * Generate a shareable message with payment link
 */
export function generateShareMessageWithLink(
  split: SplitWithParticipants,
  paymentUrl: string
): string {
  let message = `💸 ${split.title}\n\n`;
  message += `Total: $${split.total_amount.toFixed(2)} AUD\n`;
  message += `Split between ${split.participant_count} people\n\n`;
  message += `Tap to select your items and pay:\n`;
  message += `${paymentUrl}\n\n`;
  message += `Powered by ZapSplit ⚡`;

  return message;
}
