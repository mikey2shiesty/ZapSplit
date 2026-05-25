import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface StripeAccountState {
  loading: boolean;
  hasAccount: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
  currentlyDue: string[];
  refresh: () => Promise<void>;
}

/**
 * Reactive view over the current user's Stripe payout readiness, sourced from
 * the profiles row (kept up to date by edge functions + webhook). Cheap to
 * re-render — no Stripe API calls from the client.
 */
export function useStripeAccountStatus(): StripeAccountState {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<StripeAccountState, 'refresh'>>({
    loading: true,
    hasAccount: false,
    payoutsEnabled: false,
    onboardingComplete: false,
    currentlyDue: [],
  });

  const load = useCallback(async () => {
    // If we don't have a user yet, auth is still resolving. Keep loading=true
    // so consumers (e.g. the verification gate in CreateSplitScreen) don't
    // misinterpret pre-auth nulls as "user can't receive payments".
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_payouts_enabled, stripe_requirements_currently_due'
      )
      .eq('id', user.id)
      .single();
    if (error) {
      // Network / RLS error — leave the previous state intact rather than
      // flipping to a definite "no payouts" answer that fires the gate.
      console.warn('useStripeAccountStatus: profile fetch failed:', error.message);
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    setState({
      loading: false,
      hasAccount: !!data?.stripe_connect_account_id,
      payoutsEnabled: data?.stripe_payouts_enabled === true,
      onboardingComplete: data?.stripe_connect_onboarding_complete === true,
      currentlyDue: data?.stripe_requirements_currently_due ?? [],
    });
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { ...state, refresh: load };
}
