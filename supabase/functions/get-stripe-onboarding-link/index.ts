// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function: get-stripe-onboarding-link
// Purpose: Return the right Stripe link for any account state.
//   - No account yet         → create one + return onboarding URL
//   - Account exists, action required → account_links scoped to currently_due
//   - Account fully verified → Express dashboard login link
// Always syncs our DB columns with live Stripe state as a side effect,
// so the next request hits warm data.
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const REFRESH_URL = 'https://zapsplit.com.au/stripe-refresh';
const RETURN_URL = 'https://zapsplit.com.au/stripe-return';

serve(async (req) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: corsHeaders,
      });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    let accountId = profile.stripe_connect_account_id;

    // No account yet — create one with sensible defaults so we don't ask the
    // user any business-flavored questions Stripe could otherwise default to.
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'AU',
        email: profile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          mcc: '7299',
          url: 'https://zapsplit.com.au',
          product_description: 'Receiving peer-to-peer bill split payments via ZapSplit',
        },
        metadata: { userId },
      });
      accountId = account.id;

      await supabase
        .from('profiles')
        .update({
          stripe_connect_account_id: accountId,
          stripe_connect_onboarding_complete: false,
          stripe_payouts_enabled: false,
          stripe_requirements_currently_due: [],
        })
        .eq('id', userId);

      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: REFRESH_URL,
        return_url: RETURN_URL,
        type: 'account_onboarding',
      });

      return new Response(
        JSON.stringify({
          accountId,
          url: link.url,
          expiresAt: link.expires_at,
          state: 'new_account',
          currentlyDue: [],
          payoutsEnabled: false,
          chargesEnabled: false,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch live account state.
    const account = await stripe.accounts.retrieve(accountId);
    const currentlyDue = account.requirements?.currently_due ?? [];
    const pastDue = account.requirements?.past_due ?? [];
    const errors = account.requirements?.errors ?? [];
    const payoutsEnabled = !!account.payouts_enabled;
    const chargesEnabled = !!account.charges_enabled;
    const detailsSubmitted = !!account.details_submitted;
    const fullyComplete = detailsSubmitted && chargesEnabled && payoutsEnabled;

    await supabase
      .from('profiles')
      .update({
        stripe_payouts_enabled: payoutsEnabled,
        stripe_connect_onboarding_complete: fullyComplete,
        stripe_requirements_currently_due: currentlyDue,
      })
      .eq('id', userId);

    // Fully verified — give them a login link to their Express dashboard so they
    // can update bank details, see payouts, etc.
    if (fullyComplete && currentlyDue.length === 0) {
      const login = await stripe.accounts.createLoginLink(accountId);
      return new Response(
        JSON.stringify({
          accountId,
          url: login.url,
          expiresAt: null,
          state: 'verified',
          currentlyDue: [],
          payoutsEnabled: true,
          chargesEnabled: true,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Something's outstanding — generate a fresh account link scoped to currently_due.
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: REFRESH_URL,
      return_url: RETURN_URL,
      type: 'account_onboarding',
      collection_options: { fields: 'currently_due' },
    });

    // Decide a state tag the app can use to choose UX copy.
    let state: 'needs_id' | 'needs_info' | 'incomplete';
    if (currentlyDue.some((r: string) => r.startsWith('individual.verification.document'))) {
      state = 'needs_id';
    } else if (currentlyDue.length > 0) {
      state = 'needs_info';
    } else {
      state = 'incomplete';
    }

    return new Response(
      JSON.stringify({
        accountId,
        url: link.url,
        expiresAt: link.expires_at,
        state,
        currentlyDue,
        pastDue,
        errors: errors.map((e: any) => ({
          code: e.code,
          reason: e.reason,
          requirement: e.requirement,
        })),
        payoutsEnabled,
        chargesEnabled,
        detailsSubmitted,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('get-stripe-onboarding-link error:', JSON.stringify({
      message: error.message,
      type: error.type,
      code: error.code,
    }));
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
