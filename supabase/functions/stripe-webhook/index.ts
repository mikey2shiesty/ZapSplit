// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function: stripe-webhook
// Purpose: Handle Stripe webhook events (payment success, failure, etc.)
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    // Handle CORS preflight (not needed for webhooks, but good practice)
    if (req.method === 'OPTIONS') {
      return new Response('ok', { status: 200 });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Get raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);

        // Update payment record
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_payment_id', paymentIntent.id);

        if (updateError) {
          console.error('Failed to update payment:', updateError);
        }

        // Update split_participant status
        const { data: payment } = await supabase
          .from('payments')
          .select('payer_id, split_id')
          .eq('stripe_payment_id', paymentIntent.id)
          .single();

        if (payment) {
          await supabase
            .from('split_participants')
            .update({
              status: 'paid',
              amount_paid: supabase.raw('amount_owed'),
              payment_method: 'stripe',
            })
            .eq('split_id', payment.split_id)
            .eq('user_id', payment.payer_id);

          // Check if all participants paid → mark split as settled
          const { data: participants } = await supabase
            .from('split_participants')
            .select('status')
            .eq('split_id', payment.split_id);

          const allPaid = participants?.every((p) => p.status === 'paid');
          if (allPaid) {
            await supabase
              .from('splits')
              .update({ status: 'settled' })
              .eq('id', payment.split_id);
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);

        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_id', paymentIntent.id);

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment canceled:', paymentIntent.id);

        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_id', paymentIntent.id);

        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        console.log('Connect account updated:', account.id);

        // Update profile with onboarding status
        const onboardingComplete = account.details_submitted && account.charges_enabled;

        await supabase
          .from('profiles')
          .update({
            stripe_onboarding_complete: onboardingComplete,
          })
          .eq('stripe_account_id', account.id);

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', charge.id);

        // Find payment by payment_intent
        await supabase
          .from('payments')
          .update({ status: 'refunded' })
          .eq('stripe_payment_id', charge.payment_intent as string);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
