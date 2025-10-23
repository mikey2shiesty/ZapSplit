import { useState, useEffect, useCallback } from 'react';
import {
  getFriends,
  searchFriends,
  addFriend,
  removeFriend,
  getPendingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  Friend,
} from '../services/friendService';

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);

  /**
   * Load friends from database
   */
  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const friendsList = await getFriends();
      setFriends(friendsList);
      setFilteredFriends(friendsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load pending friend requests
   */
  const loadPendingRequests = useCallback(async () => {
    try {
      const requests = await getPendingFriendRequests();
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error loading pending requests:', err);
    }
  }, []);

  /**
   * Search friends by name or email
   */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      const results = searchFriends(friends, query);
      setFilteredFriends(results);
    },
    [friends]
  );

  /**
   * Add a new friend by email
   */
  const handleAddFriend = useCallback(
    async (email: string) => {
      try {
        setError(null);
        await addFriend(email);
        await loadFriends(); // Reload friends list
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add friend';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadFriends]
  );

  /**
   * Remove a friend
   */
  const handleRemoveFriend = useCallback(
    async (friendId: string) => {
      try {
        setError(null);
        await removeFriend(friendId);
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
    async (requestorId: string) => {
      try {
        await acceptFriendRequest(requestorId);
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
    async (requestorId: string) => {
      try {
        await declineFriendRequest(requestorId);
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
    addFriend: handleAddFriend,
    removeFriend: handleRemoveFriend,
    acceptRequest: handleAcceptRequest,
    declineRequest: handleDeclineRequest,
    refresh,
  };
}
