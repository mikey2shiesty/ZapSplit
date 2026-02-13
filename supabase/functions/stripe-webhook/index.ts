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

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { status: 200 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    // Use async version for Deno (WebCrypto API)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);

        // Update payment record to completed
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
          console.error('Failed to update payment:', updateError);
        }

        // Trigger instant payout to the split creator
        const instantPayoutAmount = paymentIntent.metadata?.instantPayoutAmount;
        const connectedAccountId = paymentIntent.metadata?.connectedAccountId;

        if (instantPayoutAmount && connectedAccountId) {
          try {
            const payout = await stripe.payouts.create(
              {
                amount: parseInt(instantPayoutAmount),
                currency: 'aud',
                method: 'instant',
                description: `ZapSplit payment - ${paymentIntent.metadata?.splitId?.substring(0, 8)}`,
              },
              { stripeAccount: connectedAccountId }
            );
            console.log('Instant payout created:', payout.id);
          } catch (payoutError: any) {
            console.error('Instant payout failed, falling back to standard:', payoutError.message);
          }
        }

        // Update split_participant status
        const { data: payment } = await supabase
          .from('payments')
          .select('from_user_id, split_id, amount')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (payment) {
          // Get participant's amount_owed to set as amount_paid
          const { data: participant } = await supabase
            .from('split_participants')
            .select('amount_owed')
            .eq('split_id', payment.split_id)
            .eq('user_id', payment.from_user_id)
            .single();

          await supabase
            .from('split_participants')
            .update({
              status: 'paid',
              amount_paid: participant?.amount_owed || payment.amount,
              payment_method: 'stripe',
            })
            .eq('split_id', payment.split_id)
            .eq('user_id', payment.from_user_id);

          // Check if all participants paid -> mark split as settled
          const { data: participants } = await supabase
            .from('split_participants')
            .select('status, user_id')
            .eq('split_id', payment.split_id);

          // Get the split to know the creator_id
          const { data: splitData } = await supabase
            .from('splits')
            .select('creator_id')
            .eq('id', payment.split_id)
            .single();

          // All non-creator participants are paid
          const nonCreatorParticipants = participants?.filter(p => p.user_id !== splitData?.creator_id);
          const allPaid = nonCreatorParticipants?.every((p) => p.status === 'paid');
          if (allPaid && nonCreatorParticipants && nonCreatorParticipants.length > 0) {
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
          .eq('stripe_payment_intent_id', paymentIntent.id);

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment canceled:', paymentIntent.id);

        await supabase
          .from('payments')
          .update({ status: 'cancelled' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        console.log('Connect account updated:', account.id);

        const onboardingComplete = account.details_submitted && account.charges_enabled;

        await supabase
          .from('profiles')
          .update({ stripe_connect_onboarding_complete: onboardingComplete })
          .eq('stripe_connect_account_id', account.id);

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', charge.id);

        await supabase
          .from('payments')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
