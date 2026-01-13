# ZapSplit Web Payment System

## Overview

The web payment system allows friends without the app to pay their share via a simple web link using Apple Pay, Google Pay, or card.

## Payment Flow

```
1. User scans receipt in app
2. User creates split → generates link (zapsplit.com/pay/ABC123)
3. User shares link to group chat
4. Friends open link in browser
5. Friends select their items
6. Friends pay via Apple Pay / Google Pay / Card
7. Money goes instantly to user's bank via Stripe
```

## Technology Stack

- **Frontend**: Next.js (zapsplit-web)
- **Payments**: Stripe Connect + Instant Payouts
- **Database**: Supabase (shared with mobile app)
- **Hosting**: Vercel

## Stripe Connect Flow

### Bill Creator (One-time setup)
1. User signs up in app
2. Goes through Stripe Connect Express onboarding
3. Links debit card for instant payouts
4. Stripe creates connected account (acct_xxx)

### Friend Paying (Each payment)
1. Opens payment link
2. Selects items they ordered
3. Sees total + processing fee
4. Taps Apple Pay / Google Pay
5. Payment processed by Stripe
6. Money routed to bill creator's connected account
7. Instant payout to bill creator's debit card

## Fee Structure

- **Stripe fee**: 1.75% + 30c (standard) or 2.75% + 30c (instant)
- **ZapSplit fee**: $0.50 per transaction
- **Paid by**: The person paying (friend), not the bill creator
- **Bill creator receives**: Full amount owed

### Example ($100 share)
```
$100.00 - Share owed
 +$3.05 - Stripe fee (2.75% + 30c)
 +$0.50 - ZapSplit fee
────────
$103.55 - Friend pays
$100.00 - Bill creator receives
```

## Database Tables

### payment_links
- id, split_id, short_code, creator_id, created_at, expires_at

### item_claims
- id, payment_link_id, item_index, claimed_by_name, claimed_by_email

### web_payments
- id, payment_link_id, stripe_payment_intent_id, amount, status, payer_name, payer_email

## API Endpoints Needed

1. `GET /api/split/[code]` - Get split details by short code
2. `POST /api/payment/create-intent` - Create Stripe payment intent
3. `POST /api/payment/webhook` - Handle Stripe webhooks
4. `POST /api/claims` - Save item claims

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```
