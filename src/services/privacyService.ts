// ═══════════════════════════════════════════════════════════════
// Privacy Service - Block users, report, delete account
// ═══════════════════════════════════════════════════════════════

import { supabase } from './supabase';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BlockedUser {
  id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
  profile?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface UserReport {
  id: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface DeletionRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  requested_at: string;
  scheduled_for: string;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'fraud'
  | 'impersonation'
  | 'other';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Block Users
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function blockUser(
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (user.id === userId) {
      return { success: false, error: 'Cannot block yourself' };
    }

    const { error } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: user.id,
        blocked_id: userId,
        reason: reason || null,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'User already blocked' };
      }
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error blocking user:', error);
    return { success: false, error: error.message || 'Failed to block user' };
  }
}

export async function unblockUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    return { success: false, error: error.message || 'Failed to unblock user' };
  }
}

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_blocks')
      .select(`
        id,
        blocked_id,
        reason,
        created_at,
        profile:blocked_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${user.id})`)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking if user blocked:', error);
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Report Users
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function reportUser(
  userId: string,
  reason: ReportReason,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (user.id === userId) {
      return { success: false, error: 'Cannot report yourself' };
    }

    const { error } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: user.id,
        reported_id: userId,
        reason,
        description: description || null,
      });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error reporting user:', error);
    return { success: false, error: error.message || 'Failed to submit report' };
  }
}

export async function getMyReports(): Promise<UserReport[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting reports:', error);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Account Deletion (GDPR Compliance)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function requestAccountDeletion(
  reason?: string
): Promise<{ success: boolean; scheduledFor?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check for existing request
    const { data: existing } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return {
        success: false,
        error: 'You already have a pending deletion request',
        scheduledFor: existing.scheduled_for,
      };
    }

    const { data, error } = await supabase
      .from('deletion_requests')
      .insert({
        user_id: user.id,
        reason: reason || null,
      })
      .select('scheduled_for')
      .single();

    if (error) throw error;

    return {
      success: true,
      scheduledFor: data?.scheduled_for,
    };
  } catch (error: any) {
    console.error('Error requesting account deletion:', error);
    return { success: false, error: error.message || 'Failed to request deletion' };
  }
}

export async function cancelAccountDeletion(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('deletion_requests')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling deletion:', error);
    return { success: false, error: error.message || 'Failed to cancel deletion' };
  }
}

export async function getDeletionRequest(): Promise<DeletionRequest | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error getting deletion request:', error);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Privacy Settings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PrivacySettings {
  profile_visible: boolean;
  share_statistics: boolean;
  allow_friend_requests: boolean;
  show_online_status: boolean;
}

const DEFAULT_PRIVACY: PrivacySettings = {
  profile_visible: true,
  share_statistics: false,
  allow_friend_requests: true,
  show_online_status: true,
};

export async function getPrivacySettings(): Promise<PrivacySettings> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_PRIVACY;

    const { data, error } = await supabase
      .from('profiles')
      .select('privacy_settings')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return { ...DEFAULT_PRIVACY, ...(data?.privacy_settings || {}) };
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    return DEFAULT_PRIVACY;
  }
}

export async function updatePrivacySettings(
  settings: Partial<PrivacySettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const current = await getPrivacySettings();
    const updated = { ...current, ...settings };

    const { error } = await supabase
      .from('profiles')
      .update({ privacy_settings: updated })
      .eq('id', user.id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating privacy settings:', error);
    return { success: false, error: error.message || 'Failed to update settings' };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Data Export (GDPR Compliance)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function exportUserData(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Gather all user data
    const [
      profileResult,
      splitsResult,
      participantsResult,
      paymentsResult,
      friendshipsResult,
      notificationsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('splits').select('*').or(`created_by.eq.${user.id},creator_id.eq.${user.id}`),
      supabase.from('split_participants').select('*').eq('user_id', user.id),
      supabase.from('payments').select('*').or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`),
      supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
      supabase.from('notifications').select('*').eq('user_id', user.id),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profileResult.data,
      splits: splitsResult.data || [],
      split_participations: participantsResult.data || [],
      payments: paymentsResult.data || [],
      friendships: friendshipsResult.data || [],
      notifications: notificationsResult.data || [],
    };

    return { success: true, data: exportData };
  } catch (error: any) {
    console.error('Error exporting user data:', error);
    return { success: false, error: error.message || 'Failed to export data' };
  }
}
