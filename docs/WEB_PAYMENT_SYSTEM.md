# ZapSplit Web Payment System

## The Big Idea

**Friends don't need the app. They just need a web browser.**

The "app" for friends is actually just a **website** (a web page). When they click your link, it opens in Safari/Chrome - not an app. That web page connects to the same database and lets them select items and pay.

---

## Two Payment Options (User's Choice)

| Option | How It Works | Fees | Speed |
|--------|--------------|------|-------|
| **Apple/Google Pay** | One tap, instant | 2.9% + $0.30 | Instant |
| **PayID (Bank Transfer)** | Manual transfer via banking app | FREE | 1-2 mins |

**Let users decide:** Pay for convenience OR save money with extra steps.

---

## How It Works (Simple Version)

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOU (App User)                           │
│                                                                 │
│   1. Open ZapSplit app                                          │
│   2. Scan receipt at restaurant                                 │
│   3. AI extracts all items                                      │
│   4. You pay the full bill with YOUR card (get those points!)   │
│   5. Tap "Share" → App creates a unique link                    │
│   6. Send link to group chat                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Link: zapsplit.app/pay/abc123
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR FRIENDS (No App)                       │
│                                                                 │
│   1. Click link in group chat                                   │
│   2. Opens in their phone's browser (Safari/Chrome)             │
│   3. See the itemized receipt                                   │
│   4. Tap the items THEY ordered                                 │
│   5. Their total is calculated automatically                    │
│   6. Tap "Pay with Apple Pay" or "Pay with Google Pay"          │
│   7. Face ID / fingerprint → DONE                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Money flows via Stripe
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACK TO YOU                              │
│                                                                 │
│   - Money goes to YOUR connected Stripe account                 │
│   - App shows real-time: "Sarah paid $27.50 ✓"                  │
│   - Push notification: "You received $27.50 from Sarah"         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Friends See (The Web Page)

This is just a website that looks like an app:

```
┌────────────────────────────────────────┐
│ ←                          Safari    │
├────────────────────────────────────────┤
│                                        │
│        ⚡ ZapSplit                      │
│                                        │
│   ┌────────────────────────────────┐   │
│   │                                │   │
│   │      Dinner at Nobu            │   │
│   │      Hosted by Mike            │   │
│   │      Dec 15, 2024              │   │
│   │                                │   │
│   └────────────────────────────────┘   │
│                                        │
│   TAP WHAT YOU HAD:                    │
│                                        │
│   ┌────────────────────────────────┐   │
│   │ □ Wagyu Beef         $45.00    │   │
│   ├────────────────────────────────┤   │
│   │ □ Salmon Sashimi     $32.00    │   │
│   ├────────────────────────────────┤   │
│   │ □ Chicken Katsu      $28.00    │   │
│   ├────────────────────────────────┤   │
│   │ □ Vegetable Tempura  $18.00    │   │
│   ├────────────────────────────────┤   │
│   │ □ Miso Soup          $6.00     │   │
│   ├────────────────────────────────┤   │
│   │ □ Edamame            $8.00     │   │
│   ├────────────────────────────────┤   │
│   │ □ Green Tea          $4.00     │   │
│   ├────────────────────────────────┤   │
│   │ □ Sake (carafe)      $24.00    │   │
│   └────────────────────────────────┘   │
│                                        │
│   ┌────────────────────────────────┐   │
│   │ ☑ Tax (split equally)  $4.12   │   │
│   │ ☑ Tip (split equally)  $8.25   │   │
│   └────────────────────────────────┘   │
│                                        │
│   ──────────────────────────────────   │
│                                        │
│   Your Items:              $0.00       │
│   + Shared (tax/tip):      $0.00       │
│   ══════════════════════════════════   │
│   YOUR TOTAL:              $0.00       │
│                                        │
│   ┌────────────────────────────────┐   │
│   │                                │   │
│   │    Select items to continue    │   │
│   │                                │   │
│   └────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

**After they tap their items:**

```
┌────────────────────────────────────────┐
│                                        │
│   TAP WHAT YOU HAD:                    │
│                                        │
│   ┌────────────────────────────────┐   │
│   │ □ Wagyu Beef         $45.00    │   │
│   ├────────────────────────────────┤   │
│   │ ☑ Salmon Sashimi     $32.00  ← │   │  YOU
│   ├────────────────────────────────┤   │
│   │ □ Chicken Katsu      $28.00    │   │
│   ├────────────────────────────────┤   │
│   │ □ Vegetable Tempura  $18.00    │   │
│   ├────────────────────────────────┤   │
│   │ □ Miso Soup          $6.00     │   │
│   ├────────────────────────────────┤   │
│   │ ☑ Edamame (shared÷2) $4.00   ← │   │  SHARED
│   ├────────────────────────────────┤   │
│   │ ☑ Green Tea          $4.00   ← │   │  YOU
│   ├────────────────────────────────┤   │
│   │ □ Sake (carafe)      $24.00    │   │
│   └────────────────────────────────┘   │
│                                        │
│   ┌────────────────────────────────┐   │
│   │ ☑ Tax (your share)     $4.12   │   │
│   │ ☑ Tip (your share)     $8.25   │   │
│   └────────────────────────────────┘   │
│                                        │
│   ──────────────────────────────────   │
│                                        │
│   Your Items:             $40.00       │
│   + Shared (tax/tip):     $12.37       │
│   ══════════════════════════════════   │
│   YOUR TOTAL:             $52.37       │
│                                        │
│   ┌────────────────────────────────┐   │
│   │                                │   │
│   │        Pay $52.37            │   │
│   │                                │   │
│   └────────────────────────────────┘   │
│                                        │
│   ┌────────────────────────────────┐   │
│   │                                │   │
│   │        Pay $52.37            │   │
│   │                                │   │
│   └────────────────────────────────┘   │
│                                        │
│         or pay with card              │
│                                        │
└────────────────────────────────────────┘
```

---

## The Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                           YOUR PHONE                                    │
│                        (ZapSplit App)                                   │
│                                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│   │   Scan      │    │   Create    │    │   Share     │                │
│   │  Receipt    │───▶│   Split     │───▶│   Link      │                │
│   └─────────────┘    └─────────────┘    └─────────────┘                │
│                                                │                        │
└────────────────────────────────────────────────│────────────────────────┘
                                                 │
                                                 │ Creates link:
                                                 │ zapsplit.app/pay/abc123
                                                 │
                      ┌──────────────────────────┴──────────────────────────┐
                      │                                                     │
                      │                   SUPABASE                          │
                      │              (Your Database)                        │
                      │                                                     │
                      │   ┌─────────────────────────────────────────────┐   │
                      │   │ splits table                                │   │
                      │   │ ├── id: "abc123"                            │   │
                      │   │ ├── title: "Dinner at Nobu"                 │   │
                      │   │ ├── total: 165.00                           │   │
                      │   │ ├── created_by: "mike_user_id"              │   │
                      │   │ └── items: [...]                            │   │
                      │   └─────────────────────────────────────────────┘   │
                      │                                                     │
                      │   ┌─────────────────────────────────────────────┐   │
                      │   │ item_claims table                           │   │
                      │   │ ├── split_id: "abc123"                      │   │
                      │   │ ├── item_id: "salmon_123"                   │   │
                      │   │ ├── claimed_by: "sarah@email.com"           │   │
                      │   │ └── amount: 32.00                           │   │
                      │   └─────────────────────────────────────────────┘   │
                      │                                                     │
                      │   ┌─────────────────────────────────────────────┐   │
                      │   │ payments table                              │   │
                      │   │ ├── split_id: "abc123"                      │   │
                      │   │ ├── payer_email: "sarah@email.com"          │   │
                      │   │ ├── amount: 52.37                           │   │
                      │   │ ├── status: "completed"                     │   │
                      │   │ └── stripe_payment_id: "pi_xxx"             │   │
                      │   └─────────────────────────────────────────────┘   │
                      │                                                     │
                      └──────────────────────────┬──────────────────────────┘
                                                 │
                                                 │
                      ┌──────────────────────────┴──────────────────────────┐
                      │                                                     │
                      │              WEB PAYMENT PAGE                       │
                      │         (Hosted on Vercel/Netlify)                  │
                      │                                                     │
                      │   - Reads split data from Supabase                  │
                      │   - Shows itemized receipt                          │
                      │   - Lets user select items                          │
                      │   - Calculates their total                          │
                      │   - Connects to Stripe for payment                  │
                      │                                                     │
                      └──────────────────────────┬──────────────────────────┘
                                                 │
                                                 │
                      ┌──────────────────────────┴──────────────────────────┐
                      │                                                     │
                      │                    STRIPE                           │
                      │            (Payment Processor)                      │
                      │                                                     │
                      │   - Handles Apple Pay / Google Pay                  │
                      │   - Processes credit cards                          │
                      │   - Sends money to split creator's account          │
                      │   - Sends webhook when payment completes            │
                      │                                                     │
                      └─────────────────────────────────────────────────────┘
```

---

## How Money Flows

```
FRIEND'S BANK          STRIPE              YOUR STRIPE ACCOUNT       YOUR BANK
     │                    │                        │                     │
     │   Pays $52.37      │                        │                     │
     │ ──────────────────▶│                        │                     │
     │   (Apple Pay)      │                        │                     │
     │                    │   Sends $50.75         │                     │
     │                    │   (minus 2.9% + 30¢)   │                     │
     │                    │ ──────────────────────▶│                     │
     │                    │                        │                     │
     │                    │                        │   Transfer to bank  │
     │                    │                        │ ───────────────────▶│
     │                    │                        │   (instant or 2 days)
     │                    │                        │                     │
```

**Stripe fees:** 2.9% + 30¢ per transaction
- Friend pays: $52.37
- Stripe fee: $1.82
- You receive: $50.55

---

## What We Need to Build

### 1. Database Tables (Supabase)

```sql
-- Store payment links
CREATE TABLE payment_links (
    id UUID PRIMARY KEY,
    split_id UUID REFERENCES splits(id),
    short_code TEXT UNIQUE,  -- "abc123" part of the URL
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Track who claimed which items
CREATE TABLE item_claims (
    id UUID PRIMARY KEY,
    split_id UUID REFERENCES splits(id),
    item_index INTEGER,
    claimed_by_email TEXT,
    claimed_by_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Track payments
CREATE TABLE web_payments (
    id UUID PRIMARY KEY,
    split_id UUID REFERENCES splits(id),
    payer_email TEXT,
    payer_name TEXT,
    amount DECIMAL(10,2),
    stripe_payment_intent TEXT,
    status TEXT,  -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Edge Functions (Supabase)

```
/functions/create-payment-link
    - Called when user taps "Share" in app
    - Creates short URL for the split
    - Returns: zapsplit.app/pay/abc123

/functions/get-split-details
    - Called by web page to load split data
    - Returns items, who claimed what, amounts

/functions/claim-items
    - Called when friend selects their items
    - Saves their selections to database

/functions/create-checkout-session
    - Called when friend taps "Pay"
    - Creates Stripe Checkout session
    - Returns URL to Stripe payment page

/functions/stripe-webhook
    - Called by Stripe when payment succeeds
    - Updates database with payment status
    - Triggers push notification to app user
```

### 3. Web Payment Page (Next.js on Vercel)

```
zapsplit-web/
├── app/
│   └── pay/
│       └── [code]/
│           └── page.tsx    ← The main payment page
├── components/
│   ├── ItemList.tsx        ← Checkboxes for items
│   ├── PaymentSummary.tsx  ← Shows calculated total
│   └── CheckoutButton.tsx  ← Apple/Google Pay buttons
└── lib/
    ├── supabase.ts         ← Database connection
    └── stripe.ts           ← Stripe connection
```

### 4. App Updates (React Native)

```
- New "Share" button on split detail screen
- Calls create-payment-link function
- Opens share sheet with link
- Real-time listener for payments
- Push notifications when paid
```

---

## Step-by-Step Build Order

### Phase 1: Stripe Setup (Manual - 30 mins)
- [ ] Create Stripe account
- [ ] Enable Stripe Connect
- [ ] Enable Apple Pay
- [ ] Enable Google Pay
- [ ] Get API keys
- [ ] Add keys to Supabase secrets

### Phase 2: Database (30 mins)
- [ ] Create payment_links table
- [ ] Create item_claims table
- [ ] Create web_payments table
- [ ] Set up RLS policies

### Phase 3: Edge Functions (2-3 hours)
- [ ] create-payment-link
- [ ] get-split-details
- [ ] claim-items
- [ ] create-checkout-session
- [ ] stripe-webhook

### Phase 4: Web Payment Page (3-4 hours)
- [ ] Set up Next.js project
- [ ] Build item selection UI
- [ ] Integrate Stripe Checkout
- [ ] Deploy to Vercel
- [ ] Connect custom domain (pay.zapsplit.app)

### Phase 5: App Integration (1-2 hours)
- [ ] Add share button
- [ ] Real-time payment updates
- [ ] Push notifications

---

## Why This Works Without an App

The key insight is that **Apple Pay and Google Pay work in web browsers**, not just apps.

When someone clicks your link:
1. Safari/Chrome opens (not an app)
2. They see a web page (just a website)
3. They tap Apple Pay button
4. Safari shows the Apple Pay sheet (built into iOS)
5. They authenticate with Face ID
6. Payment is processed

**No app download. No account creation. No typing card numbers.**

The web page is just HTML/CSS/JavaScript that:
- Fetches data from your Supabase database
- Shows the receipt items
- Calculates totals
- Calls Stripe to process payment

It's the same technology that any website uses - nothing special needed on the friend's phone.

---

## Example URLs

```
Production:
https://pay.zapsplit.app/s/abc123

What happens:
1. Browser requests pay.zapsplit.app/s/abc123
2. Server looks up split with code "abc123"
3. Returns HTML page with that split's data
4. User interacts with the page
5. Stripe handles payment
```

---

## Questions?

The main concept: **The "app" for friends is just a website.**

Websites can:
- Show interactive content (the checklist)
- Connect to databases (Supabase)
- Process payments (Stripe)
- Use Apple Pay / Google Pay (built into browsers)

Your friends don't need to download anything - they just click a link and pay.
