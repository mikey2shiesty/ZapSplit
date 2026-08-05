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

        const instantPayoutAmount = paymentIntent.metadata?.instantPayoutAmount;
        const connectedAccountId = paymentIntent.metadata?.connectedAccountId;

        if (instantPayoutAmount && connectedAccountId) {
          let payoutOk = false;
          let payoutId: string | null = null;
          let payoutMethod: 'instant' | 'standard' | null = null;
          let payoutError: string | null = null;

          // KILL SWITCH: instant payouts are disabled while transaction volume is
          // low. Each instant payout costs a per-payout fee (~1% + the standard
          // 0.25%+$0.25) that wipes out our ~$0.75/txn margin and keeps pushing
          // the platform balance negative. With standard (free, next-business-day)
          // payouts, Stripe batches everything into one daily payout and there is
          // no instant fee to leak. Flip this back to `true` once volume is high
          // enough that the ~1% instant fee is comfortably covered.
          const INSTANT_PAYOUTS_ENABLED = false;

          // Instant payouts cost a per-payout fee (~$0.50-$1.50) that wipes out
          // our margin on small splits and pushes the platform balance negative.
          // Only pay the instant fee when the payout is large enough to justify
          // it; below the threshold use the free standard (next business day)
          // payout instead. The money still reaches the bank, just not instantly.
          const INSTANT_PAYOUT_THRESHOLD_CENTS = 2500; // A$25
          const payoutAmountCents = parseInt(instantPayoutAmount);

          // FRAUD GUARD: instant payouts are exactly how stolen-card cash-out
          // works — the money leaves to the fraudster's bank before the real
          // cardholder's chargeback surfaces, and then we eat the loss. A
          // brand-new connected account hasn't earned trust, so for its first
          // week we force the (free) standard payout, which settles with enough
          // delay for a dispute to reverse the funds while they're still in
          // Stripe. Established accounts keep instant payouts as normal. If we
          // can't determine the account's age, we fail safe (no instant).
          const NEW_ACCOUNT_INSTANT_HOLD_DAYS = 7;
          let accountIsEstablished = false;
          try {
            const acct = await stripe.accounts.retrieve(connectedAccountId);
            if (acct.created) {
              const ageDays = (Date.now() / 1000 - acct.created) / 86400;
              accountIsEstablished = ageDays >= NEW_ACCOUNT_INSTANT_HOLD_DAYS;
            }
          } catch (ageErr: any) {
            console.warn('Could not check account age, defaulting to standard payout:', ageErr?.message);
          }

          const eligibleForInstant =
            INSTANT_PAYOUTS_ENABLED &&
            accountIsEstablished &&
            Number.isFinite(payoutAmountCents) &&
            payoutAmountCents >= INSTANT_PAYOUT_THRESHOLD_CENTS;

          const createPayout = async (method: 'instant' | 'standard') =>
            stripe.payouts.create(
              {
                amount: payoutAmountCents,
                currency: 'aud',
                method,
                description: `ZapSplit payment - ${paymentIntent.metadata?.splitId?.substring(0, 8)}`,
              },
              { stripeAccount: connectedAccountId }
            );

          if (eligibleForInstant) {
            // Large payout: try instant, fall back to standard if instant fails.
            try {
              const payout = await createPayout('instant');
              payoutOk = true;
              payoutId = payout.id;
              payoutMethod = 'instant';
              console.log('Instant payout created:', payout.id);
            } catch (instantErr: any) {
              console.warn('Instant payout failed, falling back to standard:', instantErr.message);
              payoutError = instantErr.message;
              try {
                const payout = await createPayout('standard');
                payoutOk = true;
                payoutId = payout.id;
                payoutMethod = 'standard';
                payoutError = null;
                console.log('Standard payout created:', payout.id);
              } catch (stdErr: any) {
                console.error('Standard payout also failed:', stdErr.message);
                payoutError = `instant: ${instantErr.message} | standard: ${stdErr.message}`;
              }
            }
          } else {
            // Standard payout: either below the instant threshold, or the
            // account is too new to be trusted with an instant cash-out.
            try {
              const payout = await createPayout('standard');
              payoutOk = true;
              payoutId = payout.id;
              payoutMethod = 'standard';
              console.log('Standard payout created (below threshold or new account):', payout.id, JSON.stringify({ accountIsEstablished, payoutAmountCents }));
            } catch (stdErr: any) {
              console.error('Standard payout failed:', stdErr.message);
              payoutError = `standard: ${stdErr.message}`;
            }
          }

          await supabase
            .from('payments')
            .update({
              payout_status: payoutOk ? `paid_${payoutMethod}` : 'failed',
              payout_id: payoutId,
              payout_error: payoutError,
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          if (!payoutOk) {
            try {
              const recipientId = paymentIntent.metadata?.toUserId;
              try {
                const acct = await stripe.accounts.retrieve(connectedAccountId);
                const due = acct.requirements?.currently_due ?? [];
                await supabase
                  .from('profiles')
                  .update({
                    stripe_payouts_enabled: !!acct.payouts_enabled,
                    stripe_connect_onboarding_complete:
                      !!acct.details_submitted && !!acct.charges_enabled && !!acct.payouts_enabled,
                    stripe_requirements_currently_due: due,
                  })
                  .eq('stripe_connect_account_id', connectedAccountId);
              } catch (e) {
                console.warn('Failed to refresh account status after payout failure:', (e as any)?.message);
              }

              if (recipientId) {
                await supabase.from('notifications').insert({
                  user_id: recipientId,
                  type: 'verification_required',
                  title: 'Verify your ID to receive your payment',
                  body: 'Stripe is holding your payout until you upload a government ID. Tap to finish verification.',
                  data: {
                    paymentIntentId: paymentIntent.id,
                    connectedAccountId,
                    payoutError,
                  },
                  action_url: '/settings/stripe',
                  channels: ['in_app', 'push'],
                });
              }
            } catch (notifErr) {
              console.warn('Failed to insert verification_required notification:', notifErr);
            }
          }
        }

        const { data: payment } = await supabase
          .from('payments')
          .select('from_user_id, split_id, amount')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (payment) {
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

          const { data: participants } = await supabase
            .from('split_participants')
            .select('status, user_id')
            .eq('split_id', payment.split_id);

          const { data: splitData } = await supabase
            .from('splits')
            .select('creator_id, title')
            .eq('id', payment.split_id)
            .single();

          const nonCreatorParticipants = participants?.filter(p => p.user_id !== splitData?.creator_id);
          const allPaid = nonCreatorParticipants?.every((p) => p.status === 'paid');
          if (allPaid && nonCreatorParticipants && nonCreatorParticipants.length > 0) {
            await supabase
              .from('splits')
              .update({ status: 'settled' })
              .eq('id', payment.split_id);
          }

          try {
            const [{ data: payerProfile }, { data: recipientProfile }] = await Promise.all([
              supabase.from('profiles').select('full_name').eq('id', payment.from_user_id).single(),
              splitData?.creator_id
                ? supabase.from('profiles').select('full_name').eq('id', splitData.creator_id).single()
                : Promise.resolve({ data: null }),
            ]);

            const payerName = payerProfile?.full_name || 'Someone';
            const recipientName = recipientProfile?.full_name || 'someone';
            const splitTitle = splitData?.title || 'a split';
            const amount = payment.amount;

            const rows: Array<Record<string, unknown>> = [];
            if (splitData?.creator_id && splitData.creator_id !== payment.from_user_id) {
              rows.push({
                user_id: splitData.creator_id,
                type: 'payment_received',
                title: 'Payment Received',
                body: `${payerName} paid you $${amount.toFixed(2)} for "${splitTitle}"`,
                data: { splitId: payment.split_id, amount },
                action_url: `/splits/${payment.split_id}`,
                channels: ['in_app', 'push'],
              });
            }
            rows.push({
              user_id: payment.from_user_id,
              type: 'payment_sent',
              title: 'Payment Sent',
              body: `You paid ${recipientName} $${amount.toFixed(2)} for "${splitTitle}"`,
              data: { splitId: payment.split_id, amount },
              action_url: `/splits/${payment.split_id}`,
              channels: ['in_app', 'push'],
            });

            await supabase.from('notifications').insert(rows);
          } catch (notifErr) {
            console.warn('Failed to insert payment notifications:', notifErr);
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

        // Onboarding is only "complete" when payouts can actually leave the account.
        // charges_enabled lets them receive money, but payouts_enabled means they can
        // withdraw it. We require all three so trapped-balance bugs can't recur.
        const onboardingComplete =
          !!account.details_submitted &&
          !!account.charges_enabled &&
          !!account.payouts_enabled;

        const currentlyDue = account.requirements?.currently_due ?? [];

        await supabase
          .from('profiles')
          .update({
            stripe_connect_onboarding_complete: onboardingComplete,
            stripe_payouts_enabled: !!account.payouts_enabled,
            stripe_requirements_currently_due: currentlyDue,
          })
          .eq('stripe_connect_account_id', account.id);

        // If a previously trapped payout's recipient just got payouts_enabled, retry.
        if (account.payouts_enabled) {
          const { data: blocked } = await supabase
            .from('payments')
            .select('id, stripe_payment_intent_id, amount, to_user_id')
            .eq('payout_status', 'failed');
          for (const row of blocked ?? []) {
            try {
              const pi = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id);
              if (pi.metadata?.connectedAccountId !== account.id) continue;
              const amt = parseInt(pi.metadata.instantPayoutAmount || '0');
              if (!amt) continue;
              // Match the live payout policy: instant only above the threshold
              // AND for accounts past the new-account hold window; otherwise the
              // free standard payout. (Fraud guard — see payment_intent.succeeded.)
              // KILL SWITCH: instant payouts are disabled while volume is low —
              // keep this in sync with INSTANT_PAYOUTS_ENABLED in the
              // payment_intent.succeeded handler above.
              const INSTANT_PAYOUTS_ENABLED = false;
              const INSTANT_PAYOUT_THRESHOLD_CENTS = 2500; // A$25
              const NEW_ACCOUNT_INSTANT_HOLD_DAYS = 7;
              const ageDays = account.created ? (Date.now() / 1000 - account.created) / 86400 : 0;
              const accountIsEstablished = ageDays >= NEW_ACCOUNT_INSTANT_HOLD_DAYS;
              const preferInstant = INSTANT_PAYOUTS_ENABLED && accountIsEstablished && amt >= INSTANT_PAYOUT_THRESHOLD_CENTS;
              let payout: Stripe.Payout | null = null;
              if (preferInstant) {
                try {
                  payout = await stripe.payouts.create(
                    { amount: amt, currency: 'aud', method: 'instant', description: 'ZapSplit retry' },
                    { stripeAccount: account.id }
                  );
                } catch {
                  payout = await stripe.payouts.create(
                    { amount: amt, currency: 'aud', method: 'standard', description: 'ZapSplit retry' },
                    { stripeAccount: account.id }
                  );
                }
              } else {
                payout = await stripe.payouts.create(
                  { amount: amt, currency: 'aud', method: 'standard', description: 'ZapSplit retry' },
                  { stripeAccount: account.id }
                );
              }
              await supabase
                .from('payments')
                .update({
                  payout_status: `paid_${payout.method}`,
                  payout_id: payout.id,
                  payout_error: null,
                })
                .eq('id', row.id);
              console.log('Retried payout for', row.id, '→', payout.id);
            } catch (retryErr: any) {
              console.warn('Payout retry failed for', row.id, retryErr.message);
            }
          }
        }

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
