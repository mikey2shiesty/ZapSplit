// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function: create-payment-intent
// Purpose: Create a Stripe PaymentIntent for peer-to-peer payment
// ═══════════════════════════════════════════════════════════════
//
// IMPORTANT: This function ALWAYS asks Stripe for the live account state
// before deciding whether to allow a charge. Our DB cache lags behind the
// account.updated webhook (and the webhook can miss events entirely if it
// times out or 5xxs), so trusting the cache was producing false rejections
// where verified recipients couldn't receive payments. Live retrieve is
// the authoritative source — we use it to decide, then write the result
// back to our cache so other surfaces (UI banners, dashboard) reflect
// reality.

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
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    const { fromUserId, toUserId, amount, splitId, participantCount = 1 } = body;

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

    if (fromUserId === toUserId) {
      return new Response(
        JSON.stringify({ error: "You can't pay yourself for a split you created." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { data: receiver, error: receiverError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_payouts_enabled, full_name')
      .eq('id', toUserId)
      .single();

    if (receiverError || !receiver) {
      return new Response(
        JSON.stringify({ error: 'Receiver not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // No Connect account at all → nothing we can do until they onboard.
    if (!receiver.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({
          error: `${receiver.full_name || 'The recipient'} hasn't set up their payment account yet.`,
          receiverName: receiver.full_name,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Ask Stripe what the truth is — don't trust the cache. The webhook can
    // miss account.updated events; this is the only way to be sure.
    let liveCharges = false;
    let livePayouts = false;
    let liveDetailsSubmitted = false;
    let liveDue: string[] = [];
    let stripeRetrieveOk = false;

    try {
      const liveAccount = await stripe.accounts.retrieve(receiver.stripe_connect_account_id);
      liveCharges = !!liveAccount.charges_enabled;
      livePayouts = !!liveAccount.payouts_enabled;
      liveDetailsSubmitted = !!liveAccount.details_submitted;
      liveDue = (liveAccount.requirements?.currently_due as string[]) ?? [];
      stripeRetrieveOk = true;

      const fullyComplete = liveDetailsSubmitted && liveCharges && livePayouts;
      await supabase
        .from('profiles')
        .update({
          stripe_payouts_enabled: livePayouts,
          stripe_connect_onboarding_complete: fullyComplete,
          stripe_requirements_currently_due: liveDue,
        })
        .eq('id', toUserId);
      console.log('Synced live Stripe state:', JSON.stringify({
        toUserId,
        liveCharges,
        livePayouts,
        liveDetailsSubmitted,
        liveDue,
        fullyComplete,
      }));
    } catch (e) {
      // Stripe unreachable or returned an error. Fall back to cached values
      // so a transient failure doesn't lock all payments. The cache is the
      // floor, not the ceiling.
      console.warn('Stripe retrieve failed, falling back to cache:', (e as any)?.message);
      liveCharges = receiver.stripe_payouts_enabled === true; // best-effort proxy
      livePayouts = receiver.stripe_payouts_enabled === true;
      liveDetailsSubmitted = receiver.stripe_connect_onboarding_complete === true;
    }

    // Gate on the LIVE state, not the cached one. We accept a charge as
    // long as Stripe will accept it (charges_enabled). Payouts may still be
    // disabled — in that case the money sits in Stripe's pending balance
    // and the stripe-webhook auto-retries the payout once payouts_enabled
    // flips true.
    if (!liveCharges) {
      return new Response(
        JSON.stringify({
          error: `${receiver.full_name || 'The recipient'} needs to finish setting up their Stripe account before they can be paid.`,
          receiverName: receiver.full_name,
          code: 'charges_disabled',
          requirements: liveDue,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

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

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', fromUserId);
    }

    const amountCents = Math.round(amount * 100);
    // Platform service fee: $1.05 fixed + 1.75% of the split amount, grossed
    // up by /0.9825 to offset the 1.75% Stripe takes on the fee portion too.
    // After Stripe's processing fee (1.75% + $0.30) this nets the platform a
    // flat ~$0.75 per transaction, which covers Connect per-account/payout
    // costs. (Was $0.80 fixed -> ~$0.50 net, too thin to cover the $2/active
    // account fee without many splits per user.)
    const fee = (1.05 + 0.0175 * amount) / 0.9825;
    const feeCents = Math.round(fee * 100);
    const payerTotal = amountCents + feeCents;
    const applicationFee = feeCents;

    console.log('Creating PaymentIntent:', JSON.stringify({
      payerTotal,
      applicationFee,
      amountCents,
      feeCents,
      connectedAccount: receiver.stripe_connect_account_id,
      livePayouts,
      stripeRetrieveOk,
    }));

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
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
          instantPayoutAmount: amountCents.toString(),
          connectedAccountId: receiver.stripe_connect_account_id,
        },
        description: `Payment for Split #${splitId.substring(0, 8)}`,
      });
    } catch (stripeErr: any) {
      console.error('Stripe paymentIntents.create failed:', JSON.stringify({
        message: stripeErr.message,
        type: stripeErr.type,
        code: stripeErr.code,
        decline_code: stripeErr.decline_code,
        param: stripeErr.param,
        statusCode: stripeErr.statusCode,
        raw: stripeErr.raw?.message,
        connectedAccount: receiver.stripe_connect_account_id,
      }));
      return new Response(
        JSON.stringify({
          error: stripeErr.message || 'Stripe rejected the payment intent',
          stripeCode: stripeErr.code,
          stripeType: stripeErr.type,
          stripeParam: stripeErr.param,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

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
    }

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
