import { supabase } from './supabase';

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

/**
 * Get all accepted friends for the current user
 */
export async function getFriends(userId?: string): Promise<Friend[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = userId || user?.id;

  if (!currentUserId) throw new Error('User not authenticated');

  // Get friendships where current user is either user_id or friend_id
  const { data: friendships, error: friendshipsError } = await supabase
    .from('friendships')
    .select('*')
    .eq('status', 'accepted')
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

  if (friendshipsError) throw friendshipsError;

  if (!friendships || friendships.length === 0) {
    return [];
  }

  // Extract friend IDs (the other person in each friendship)
  const friendIds = friendships.map(friendship =>
    friendship.user_id === currentUserId ? friendship.friend_id : friendship.user_id
  );

  // Fetch user profiles for all friends
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', friendIds);

  if (profilesError) throw profilesError;

  // Map to Friend interface
  const friends: Friend[] = (profiles || []).map(profile => ({
    id: profile.id,
    name: profile.full_name || profile.email.split('@')[0],
    email: profile.email,
    avatar_url: profile.avatar_url,
  }));

  return friends;
}

/**
 * Search friends by name or email
 */
export function searchFriends(friends: Friend[], query: string): Friend[] {
  if (!query.trim()) return friends;

  const lowerQuery = query.toLowerCase();

  return friends.filter(friend =>
    friend.name.toLowerCase().includes(lowerQuery) ||
    friend.email.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Send a friend request to another user
 */
export async function addFriend(friendEmail: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Find user by email
  const { data: friendProfile, error: searchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', friendEmail)
    .single();

  if (searchError || !friendProfile) {
    throw new Error('User not found');
  }

  if (friendProfile.id === user.id) {
    throw new Error('Cannot add yourself as a friend');
  }

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendProfile.id}),and(user_id.eq.${friendProfile.id},friend_id.eq.${user.id})`)
    .single();

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('Already friends');
    } else {
      throw new Error('Friend request already sent');
    }
  }

  // Create friendship
  const { error: insertError } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendProfile.id,
      status: 'accepted', // Auto-accept for MVP (no friend request flow yet)
    });

  if (insertError) throw insertError;
}

/**
 * Remove a friend (delete friendship)
 */
export async function removeFriend(friendId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

  if (error) throw error;
}

/**
 * Get pending friend requests for current user
 */
export async function getPendingFriendRequests(): Promise<Friend[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get friendships where current user is friend_id and status is pending
  const { data: friendships, error: friendshipsError } = await supabase
    .from('friendships')
    .select('user_id')
    .eq('friend_id', user.id)
    .eq('status', 'pending');

  if (friendshipsError) throw friendshipsError;

  if (!friendships || friendships.length === 0) {
    return [];
  }

  const requestorIds = friendships.map(f => f.user_id);

  // Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', requestorIds);

  if (profilesError) throw profilesError;

  return (profiles || []).map(profile => ({
    id: profile.id,
    name: profile.full_name || profile.email.split('@')[0],
    email: profile.email,
    avatar_url: profile.avatar_url,
  }));
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requestorId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('user_id', requestorId)
    .eq('friend_id', user.id)
    .eq('status', 'pending');

  if (error) throw error;
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(requestorId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', requestorId)
    .eq('friend_id', user.id)
    .eq('status', 'pending');

  if (error) throw error;
}
