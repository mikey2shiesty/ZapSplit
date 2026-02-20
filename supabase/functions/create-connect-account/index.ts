// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function: create-connect-account
// Purpose: Create Stripe Connect Express account for receiving payments
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

// Validate Stripe key is present
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  console.error('CRITICAL: STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(stripeKey || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const { userId, email, refreshUrl, returnUrl } = await req.json();
    console.log('Request received for userId:', userId, 'email:', email);

    // Validate input
    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has a Connect account
    console.log('Fetching profile for user:', userId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not found', details: profileError.message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let accountId = profile.stripe_connect_account_id;
    console.log('Existing account ID:', accountId);

    // Create Connect account if doesn't exist
    if (!accountId) {
      console.log('Creating new Stripe Connect account for:', email);

      try {
        const account = await stripe.accounts.create({
          type: 'express',
          email: email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          metadata: {
            userId: userId,
          },
        });

        accountId = account.id;
        console.log('Successfully created Stripe account:', accountId);

        // Save account ID to profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stripe_connect_account_id: accountId,
            stripe_connect_onboarding_complete: false,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Failed to update profile with account ID:', updateError);
        }
      } catch (stripeError: any) {
        console.error('Stripe account creation failed:', {
          message: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
          statusCode: stripeError.statusCode,
          raw: stripeError.raw,
        });
        throw stripeError;
      }
    }

    // Create Account Link for onboarding
    console.log('Creating account link for:', accountId);
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl || `https://zapsplit.com.au/stripe-refresh`,
        return_url: returnUrl || `https://zapsplit.com.au/stripe-return`,
        type: 'account_onboarding',
      });

      console.log('Successfully created account link, expires:', accountLink.expires_at);

      return new Response(
        JSON.stringify({
          accountId: accountId,
          onboardingUrl: accountLink.url,
          expiresAt: accountLink.expires_at,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (stripeError: any) {
      console.error('Stripe account link creation failed:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
        raw: stripeError.raw,
      });
      throw stripeError;
    }
  } catch (error: any) {
    console.error('Error creating Connect account:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        type: error.type || 'unknown',
        code: error.code || 'unknown',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
