import { useState, useEffect, useCallback } from 'react';
import {
  getFriends,
  getIncomingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  Friend,
  FriendRequest,
} from '../services/friendService';
import { useAuth } from './useAuth';

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);

  /**
   * Load friends from database
   */
  const loadFriends = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const friendsList = await getFriends(user.id);
      setFriends(friendsList);
      setFilteredFriends(friendsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Load pending friend requests
   */
  const loadPendingRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      const requests = await getIncomingFriendRequests(user.id);
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error loading pending requests:', err);
    }
  }, [user?.id]);

  /**
   * Search friends by name or email (local filter)
   */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setFilteredFriends(friends);
        return;
      }
      const lowerQuery = query.toLowerCase();
      const results = friends.filter(
        (friend) =>
          friend.full_name?.toLowerCase().includes(lowerQuery) ||
          friend.email?.toLowerCase().includes(lowerQuery)
      );
      setFilteredFriends(results);
    },
    [friends]
  );

  /**
   * Remove a friend
   */
  const handleRemoveFriend = useCallback(
    async (friendshipId: string) => {
      try {
        setError(null);
        await removeFriend(friendshipId);
        await loadFriends(); // Reload friends list
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove friend';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadFriends]
  );

  /**
   * Accept friend request
   */
  const handleAcceptRequest = useCallback(
    async (friendshipId: string) => {
      try {
        await acceptFriendRequest(friendshipId);
        await loadFriends();
        await loadPendingRequests();
      } catch (err) {
        console.error('Error accepting friend request:', err);
      }
    },
    [loadFriends, loadPendingRequests]
  );

  /**
   * Decline friend request
   */
  const handleDeclineRequest = useCallback(
    async (friendshipId: string) => {
      try {
        await declineFriendRequest(friendshipId);
        await loadPendingRequests();
      } catch (err) {
        console.error('Error declining friend request:', err);
      }
    },
    [loadPendingRequests]
  );

  /**
   * Clear search query
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredFriends(friends);
  }, [friends]);

  /**
   * Refresh friends list
   */
  const refresh = useCallback(async () => {
    await loadFriends();
    await loadPendingRequests();
  }, [loadFriends, loadPendingRequests]);

  // Load friends on mount
  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, [loadFriends, loadPendingRequests]);

  return {
    friends: filteredFriends,
    allFriends: friends,
    searchQuery,
    loading,
    error,
    pendingRequests,
    search: handleSearch,
    clearSearch,
    removeFriend: handleRemoveFriend,
    acceptRequest: handleAcceptRequest,
    declineRequest: handleDeclineRequest,
    refresh,
  };
}
