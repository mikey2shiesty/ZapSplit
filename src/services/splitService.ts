import { supabase } from './supabase';

export interface CreateSplitData {
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  split_method: 'equal' | 'custom' | 'percentage';
  participants: {
    user_id: string;
    amount_owed: number;
  }[];
  image_url?: string;
}

export interface Split {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  image_url?: string;
  status: 'active' | 'settled';
  created_at: string;
  updated_at: string;
}

export interface SplitParticipant {
  id: string;
  split_id: string;
  user_id: string;
  amount_owed: number;
  amount_paid: number;
  status: 'pending' | 'paid';
}

/**
 * Create a new split in the database with participants
 */
export async function createSplit(data: CreateSplitData): Promise<Split> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Insert split record
  const { data: split, error: splitError } = await supabase
    .from('splits')
    .insert({
      creator_id: user.id,
      title: data.title,
      description: data.description,
      total_amount: data.total_amount,
      currency: data.currency,
      split_type: data.split_method, // Map split_method to split_type column
      image_url: data.image_url,
      status: 'active',
    })
    .select()
    .single();

  if (splitError) throw splitError;
  if (!split) throw new Error('Failed to create split');

  // Insert participants (including creator)
  const participantsData = data.participants.map(p => ({
    split_id: split.id,
    user_id: p.user_id,
    amount_owed: p.amount_owed,
    amount_paid: 0,
    status: 'pending' as const,
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
 * Calculate equal split amounts for all participants
 */
export function calculateEqualSplit(
  total: number,
  participantCount: number
): number {
  if (participantCount === 0) return 0;
  return Math.round((total / participantCount) * 100) / 100;
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

/**
 * Get all splits for current user (as creator or participant)
 */
export async function getUserSplits(): Promise<Split[]> {
  const { data: { user } } = await supabase.auth.getUser();
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

  if (participantSplitIds.length === 0) {
    return createdSplits || [];
  }

  const { data: participatedSplits, error: participatedError } = await supabase
    .from('splits')
    .select('*')
    .in('id', participantSplitIds)
    .order('created_at', { ascending: false });

  if (participatedError) throw participatedError;

  // Combine and deduplicate
  const allSplits = [...(createdSplits || []), ...(participatedSplits || [])];
  const uniqueSplits = Array.from(
    new Map(allSplits.map(split => [split.id, split])).values()
  );

  return uniqueSplits;
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
  return data;
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
