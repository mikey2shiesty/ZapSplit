// ═══════════════════════════════════════════════════════════════
// Friend Service - Manage friendships and friend requests
// ═══════════════════════════════════════════════════════════════

import { supabase } from './supabase';

export interface Friend {
  id: string;
  friendship_id: string;
  email: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  nickname: string | null;
  favorite: boolean;
  created_at: string;
  accepted_at: string | null;
}

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  sender?: {
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
}

export interface UserSearchResult {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

export interface FriendProfile {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  friendship_id: string;
  is_favorite: boolean;
  splits_together: number;
  total_you_owe: number;
  total_they_owe: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Get Friends
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getFriends(userId: string): Promise<Friend[]> {
  try {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status, nickname, favorite, created_at, accepted_at')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) throw error;
    if (!friendships || friendships.length === 0) return [];

    // Deduplicate: if there are bidirectional records, only keep one per friend
    const seenFriendIds = new Set<string>();
    const uniqueFriendships = friendships.filter(f => {
      const friendId = f.user_id === userId ? f.friend_id : f.user_id;
      if (seenFriendIds.has(friendId)) {
        return false;
      }
      seenFriendIds.add(friendId);
      return true;
    });

    const friendUserIds = uniqueFriendships.map(f => f.user_id === userId ? f.friend_id : f.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, username, avatar_url, phone_number')
      .in('id', friendUserIds);

    if (profileError) throw profileError;

    const friends: Friend[] = uniqueFriendships.map(friendship => {
      const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
      const profile = profiles?.find(p => p.id === friendId);
      return {
        id: friendId,
        friendship_id: friendship.id,
        email: profile?.email || '',
        full_name: profile?.full_name || 'Unknown',
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null,
        phone_number: profile?.phone_number || null,
        status: friendship.status,
        nickname: friendship.nickname,
        favorite: friendship.favorite,
        created_at: friendship.created_at,
        accepted_at: friendship.accepted_at,
      };
    });

    return friends.sort((a, b) => a.full_name.localeCompare(b.full_name));
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Friend Requests
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status, created_at, sender:user_id (id, email, full_name, avatar_url)')
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting incoming friend requests:', error);
    return [];
  }
}

export async function getOutgoingFriendRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status, created_at, receiver:friend_id (id, email, full_name, avatar_url)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting outgoing friend requests:', error);
    return [];
  }
}

export async function sendFriendRequest(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') return { success: false, error: 'Already friends' };
      if (existing.status === 'pending') return { success: false, error: 'Friend request already pending' };
      if (existing.status === 'blocked') return { success: false, error: 'Unable to send request' };
    }

    const { error } = await supabase
      .from('friendships')
      .insert({ user_id: userId, friend_id: friendId, status: 'pending' });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message || 'Failed to send request' };
  }
}

export async function acceptFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: error.message || 'Failed to accept request' };
  }
}

export async function declineFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'declined' })
      .eq('id', friendshipId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error declining friend request:', error);
    return { success: false, error: error.message || 'Failed to decline request' };
  }
}

export async function removeFriend(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error removing friend:', error);
    return { success: false, error: error.message || 'Failed to remove friend' };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Search Users
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function searchUsers(query: string, currentUserId: string): Promise<UserSearchResult[]> {
  try {
    if (!query || query.length < 2) return [];

    const searchQuery = query.toLowerCase();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, username, avatar_url')
      .neq('id', currentUserId)
      .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
      .limit(20);

    if (error) throw error;
    if (!profiles || profiles.length === 0) return [];

    const { data: friendships, error: friendError } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status')
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

    if (friendError) throw friendError;

    return profiles.map(profile => {
      const friendship = friendships?.find(f =>
        (f.user_id === currentUserId && f.friend_id === profile.id) ||
        (f.friend_id === currentUserId && f.user_id === profile.id)
      );
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || 'Unknown',
        username: profile.username,
        avatar_url: profile.avatar_url,
        isFriend: friendship?.status === 'accepted',
        hasPendingRequest: friendship?.status === 'pending',
      };
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Friend Profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getFriendProfile(userId: string, friendId: string): Promise<FriendProfile | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, username, avatar_url')
      .eq('id', friendId)
      .single();

    if (profileError) throw profileError;

    const { data: friendships, error: friendshipError } = await supabase
      .from('friendships')
      .select('id, favorite')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .eq('status', 'accepted')
      .limit(1);

    if (friendshipError) throw friendshipError;
    if (!friendships || friendships.length === 0) throw new Error('Friendship not found');

    const friendship = friendships[0];

    const { data: userSplits } = await supabase
      .from('split_participants')
      .select('split_id')
      .eq('user_id', userId);

    const userSplitIds = userSplits?.map(s => s.split_id) || [];
    let splitsTogether = 0;
    let totalYouOwe = 0;
    let totalTheyOwe = 0;

    if (userSplitIds.length > 0) {
      const { data: friendSplits } = await supabase
        .from('split_participants')
        .select('split_id')
        .eq('user_id', friendId)
        .in('split_id', userSplitIds);

      splitsTogether = friendSplits?.length || 0;
    }

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || 'Unknown',
      username: profile.username,
      avatar_url: profile.avatar_url,
      friendship_id: friendship.id,
      is_favorite: friendship.favorite,
      splits_together: splitsTogether,
      total_you_owe: totalYouOwe,
      total_they_owe: totalTheyOwe,
    };
  } catch (error) {
    console.error('Error getting friend profile:', error);
    return null;
  }
}

export async function toggleFavorite(friendshipId: string, isFavorite: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('friendships')
      .update({ favorite: isFavorite })
      .eq('id', friendshipId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling favorite:', error);
    return { success: false, error: error.message || 'Failed to update favorite' };
  }
}
