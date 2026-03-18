// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function: create-payment-intent
// Purpose: Create a Stripe PaymentIntent for peer-to-peer payment
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
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    const { fromUserId, toUserId, amount, splitId, participantCount = 1 } = body;

    // Validate input
    if (!fromUserId || !toUserId || !amount || !splitId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fromUserId, toUserId, amount, splitId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than 0' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get payer's profile (to check Stripe customer ID)
    const { data: payer, error: payerError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', fromUserId)
      .single();

    if (payerError || !payer) {
      return new Response(
        JSON.stringify({ error: 'Payer not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get receiver's profile (to check Stripe Connect account)
    const { data: receiver, error: receiverError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete, full_name')
      .eq('id', toUserId)
      .single();

    if (receiverError || !receiver) {
      return new Response(
        JSON.stringify({ error: 'Receiver not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if receiver has completed Stripe onboarding
    if (!receiver.stripe_connect_account_id || !receiver.stripe_connect_onboarding_complete) {
      return new Response(
        JSON.stringify({
          error: 'Receiver has not set up their payment account yet',
          receiverName: receiver.full_name
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create or get Stripe customer for payer
    let customerId = payer.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: payer.email,
        name: payer.full_name,
        metadata: {
          userId: fromUserId,
        },
      });
      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', fromUserId);
    }

    // Dynamic fee: covers Stripe fees (1.75% + $0.30) and guarantees $0.50 profit
    // Formula: fee = (0.80 + 0.0175 * amount) / 0.9825
    const amountCents = Math.round(amount * 100);
    const fee = (0.80 + 0.0175 * amount) / 0.9825;
    const feeCents = Math.round(fee * 100);
    const payerTotal = amountCents + feeCents;
    const applicationFee = feeCents; // ZapSplit keeps the entire fee (Stripe deducts their cut from it)

    console.log('Creating PaymentIntent:', JSON.stringify({ payerTotal, applicationFee, amountCents, feeCents, connectedAccount: receiver.stripe_connect_account_id }));

    // Create PaymentIntent with destination charge
    // Enable automatic_payment_methods to support Apple Pay, Google Pay, and cards
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payerTotal,
      currency: 'aud',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: receiver.stripe_connect_account_id,
      },
      metadata: {
        splitId,
        fromUserId,
        toUserId,
        originalAmount: amount.toString(),
        instantPayoutAmount: amountCents.toString(), // Amount receiver gets (in cents)
        connectedAccountId: receiver.stripe_connect_account_id,
      },
      description: `Payment for Split #${splitId.substring(0, 8)}`,
    });

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        split_id: splitId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: amount,
        stripe_fee_amount: (feeCents / 100).toFixed(2),
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      // Continue anyway - webhook will create it later if needed
    }

    // Return client secret for frontend
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentId: payment?.id,
        amount: (payerTotal / 100).toFixed(2),
        fee: (feeCents / 100).toFixed(2),
        platformFee: (feeCents / 100).toFixed(2),
        instantPayout: true,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error creating payment intent:', JSON.stringify({
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw?.message,
    }));
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
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
