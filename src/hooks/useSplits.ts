import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserSplits, SplitWithParticipants } from '../services/splitService';
import { useAuth } from './useAuth';
import { supabase } from '../services/supabase';

export interface SplitStats {
  totalBalance: number;
  youOwe: number;
  owedToYou: number;
  recentActivityCount: number;
}

export function useSplits() {
  const { user } = useAuth();
  const [splits, setSplits] = useState<SplitWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);
  const [stats, setStats] = useState<SplitStats>({
    totalBalance: 0,
    youOwe: 0,
    owedToYou: 0,
    recentActivityCount: 0,
  });

  const calculateStats = useCallback((splitsData: SplitWithParticipants[]) => {
    if (!user) {
      return {
        totalBalance: 0,
        youOwe: 0,
        owedToYou: 0,
        recentActivityCount: 0,
      };
    }

    let youOwe = 0;
    let owedToYou = 0;

    splitsData.forEach(split => {
      // Only count active splits
      if (split.status !== 'active') return;

      // Find current user's participant record
      const userParticipant = split.participants.find(p => p.user_id === user.id);

      if (userParticipant) {
        // Calculate what user owes (amount_owed - amount_paid)
        const userOwes = userParticipant.amount_owed - userParticipant.amount_paid;
        if (userOwes > 0) {
          youOwe += userOwes;
        }
      }

      // If user is the creator, calculate what's owed to them
      if (split.creator_id === user.id) {
        // Use amount_remaining which accounts for both participant payments AND web payments
        const remaining = split.amount_remaining ?? (split.total_amount - (split.total_paid || 0));
        if (remaining > 0) {
          owedToYou += remaining;
        }
      }
    });

    const totalBalance = owedToYou - youOwe;

    return {
      totalBalance,
      youOwe,
      owedToYou,
      recentActivityCount: splitsData.filter(s => s.status === 'active').length,
    };
  }, [user]);

  const loadSplits = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Only show full loading spinner on initial load (no data yet)
      if (!initialLoadDone.current) {
        setLoading(true);
      }
      setError(null);

      const splitsData = await getUserSplits();
      setSplits(splitsData);
      initialLoadDone.current = true;

      // Calculate stats
      const calculatedStats = calculateStats(splitsData);
      setStats(calculatedStats);
    } catch (err) {
      console.error('Error loading splits:', err);
      setError(err instanceof Error ? err.message : 'Failed to load splits');
    } finally {
      setLoading(false);
    }
  }, [user, calculateStats]);

  useEffect(() => {
    loadSplits();
  }, [loadSplits]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('splits-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'splits' },
        () => { loadSplits(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'split_participants' },
        () => { loadSplits(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'web_payments' },
        () => { loadSplits(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadSplits]);

  return {
    splits,
    loading,
    error,
    stats,
    refresh: loadSplits,
    hasRecentSplits: splits.length > 0,
    isNewUser: splits.length === 0 && !loading,
  };
}
