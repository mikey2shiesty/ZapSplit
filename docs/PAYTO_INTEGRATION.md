# ZapSplit PayTo Integration

## The Solution: Direct Bank-to-Bank Payments

**No Stripe. No middleman. Money goes directly from friend's bank to your bank.**

---

## What is PayTo?

PayTo is Australia's real-time payment system that lets apps initiate bank transfers directly.

```
Friend taps "Pay $52"
        ↓
Their banking app: "Approve $52 to Mike?"
        ↓
They tap approve (Face ID)
        ↓
Money instantly in YOUR bank account
        ↓
Done. No middleman.
```

---

## Why PayTo is Perfect for ZapSplit

| Feature | PayTo | Stripe |
|---------|-------|--------|
| **Money flow** | Bank → Bank (direct) | Bank → Stripe → Bank |
| **Fees** | Flat cents (~$0.10-0.50) | 2.9% + $0.30 |
| **Settlement** | Under 5 seconds | 1-2 days (or 1% for instant) |
| **Chargebacks** | None | Yes (risk) |
| **Conversion rate** | 99.03% | ~95% |
| **Money held by middleman** | No | Yes |

---

## Top PayTo Providers

### 1. Zepto (Recommended)
- First non-bank connected directly to NPP
- 1 million+ PayTo transactions processed
- $612 million in payments
- Flat fee per transaction

**Website:** [zepto.com.au](https://zepto.com.au/solutions/payto)

### 2. Azupay
- First PayTo transaction in Australia (2022)
- Good API documentation
- Quick integration

**Website:** [azupay.com.au/payto](https://azupay.com.au/payto)
**Developer Docs:** [developer.azupay.com.au](https://developer.azupay.com.au/docs/payto-integration-guide)

### 3. Monoova
- Most experienced PayTo provider
- Low fixed fee
- Virtual accounts available

**Website:** [monoova.com/payto](https://www.monoova.com/payto)

---

## How It Works (Technical Flow)

### Step 1: User Sets Up Payment Agreement (One Time)

When a friend first uses ZapSplit, they create a "payment agreement":

```
Friend clicks payment link
        ↓
"To pay, connect your bank account"
        ↓
They select their bank
        ↓
Banking app opens: "Authorize ZapSplit to request payments?"
        ↓
They approve (sets maximum amount, e.g., $500)
        ↓
Agreement is now ACTIVE
```

### Step 2: Making a Payment

Once the agreement exists, paying is instant:

```
Friend selects their items ($52 total)
        ↓
Taps "Pay $52"
        ↓
Banking app: "Approve $52 to Mike Chen?"
        ↓
Face ID / PIN
        ↓
Money sent instantly
        ↓
Mike's bank account: +$52
```

---

## API Integration Flow (Azupay Example)

### 1. Create Payment Agreement

```javascript
// POST /paymentAgreement
{
  "payerName": "Sarah Smith",
  "payerEmail": "sarah@email.com",
  "payerId": "sarah_phone_or_email",  // Their PayID
  "maximumAmount": 500.00,
  "frequency": "ADHOC",
  "description": "ZapSplit Payments",
  "clientTransactionId": "unique_id_123"
}

// Response
{
  "agreementId": "agr_abc123",
  "status": "CREATED",
  "approvalUrl": "https://bank.com.au/approve/..."  // Send user here
}
```

### 2. User Approves in Banking App

User is redirected to their banking app to approve. You receive webhook:

```javascript
// Webhook: Agreement Approved
{
  "agreementId": "agr_abc123",
  "status": "ACTIVE",
  "payerName": "Sarah Smith"
}
```

### 3. Initiate Payment

```javascript
// POST /paymentInitiation
{
  "agreementId": "agr_abc123",
  "amount": 52.00,
  "description": "Dinner at Nobu - Split",
  "recipientPayId": "mike@email.com",  // Bill payer's PayID
  "clientTransactionId": "payment_456"
}

// Response
{
  "paymentId": "pay_xyz789",
  "status": "PENDING"
}
```

### 4. Payment Settles (Webhook)

```javascript
// Webhook: Payment Settled
{
  "paymentId": "pay_xyz789",
  "status": "SETTLED",
  "amount": 52.00,
  "settledAt": "2025-01-08T12:00:05Z"  // Under 5 seconds!
}
```

---

## What Friends See (Web Page)

```
┌────────────────────────────────────────┐
│                                        │
│        ⚡ ZapSplit                      │
│                                        │
│   ┌────────────────────────────────┐   │
│   │      Dinner at Nobu            │   │
│   │      Pay Mike Chen             │   │
│   └────────────────────────────────┘   │
│                                        │
│   YOUR ITEMS:                          │
│   ☑ Salmon Sashimi         $32.00     │
│   ☑ Green Tea               $4.00     │
│   ☑ Tax/Tip share          $16.37     │
│   ─────────────────────────────────   │
│   TOTAL:                   $52.37     │
│                                        │
│   ┌────────────────────────────────┐   │
│   │                                │   │
│   │    Pay $52.37 with PayTo      │   │
│   │    (Instant bank transfer)     │   │
│   │                                │   │
│   └────────────────────────────────┘   │
│                                        │
│   First time? You'll connect your      │
│   bank account (takes 30 seconds)      │
│                                        │
│   ✓ No fees                            │
│   ✓ Instant transfer                   │
│   ✓ Money goes directly to Mike        │
│                                        │
└────────────────────────────────────────┘
```

When they tap "Pay":

```
┌────────────────────────────────────────┐
│                                        │
│   ┌────────────────────────────────┐   │
│   │                                │   │
│   │      🏦 Select Your Bank       │   │
│   │                                │   │
│   │   ┌──────────────────────┐    │   │
│   │   │  Commonwealth Bank   │    │   │
│   │   └──────────────────────┘    │   │
│   │   ┌──────────────────────┐    │   │
│   │   │  Westpac             │    │   │
│   │   └──────────────────────┘    │   │
│   │   ┌──────────────────────┐    │   │
│   │   │  ANZ                 │    │   │
│   │   └──────────────────────┘    │   │
│   │   ┌──────────────────────┐    │   │
│   │   │  NAB                 │    │   │
│   │   └──────────────────────┘    │   │
│   │                                │   │
│   └────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

Then their banking app handles approval:

```
┌────────────────────────────────────────┐
│                                        │
│         Commonwealth Bank              │
│                                        │
│   ┌────────────────────────────────┐   │
│   │                                │   │
│   │   Approve payment?             │   │
│   │                                │   │
│   │   Amount: $52.37               │   │
│   │   To: Mike Chen                │   │
│   │   From: Everyday Account       │   │
│   │   Reference: Nobu Dinner       │   │
│   │                                │   │
│   │   ┌────────────────────────┐   │   │
│   │   │      Approve ✓         │   │   │
│   │   └────────────────────────┘   │   │
│   │                                │   │
│   │   ┌────────────────────────┐   │   │
│   │   │       Decline          │   │   │
│   │   └────────────────────────┘   │   │
│   │                                │   │
│   └────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

---

## Requirements to Get Started

### 1. Business Registration
- ABN required
- Business bank account

### 2. Sign Up with Provider
- Contact Zepto, Azupay, or Monoova
- Complete KYC/verification
- Get API credentials

### 3. Technical Integration
- Implement API calls
- Set up webhooks
- Build web payment page

### 4. Testing
- Use sandbox/UAT environment
- Test with real bank accounts in UAT

---

## Pricing (Estimated)

Providers don't publish exact prices, but based on research:

| Provider | Estimated Cost |
|----------|----------------|
| Zepto | Flat fee per transaction (contact for quote) |
| Azupay | ~$0.10-0.50 per transaction |
| Monoova | Low fixed fee (contact for quote) |

**Key point:** Fees are FLAT, not percentage. A $10 payment costs the same as a $500 payment.

---

## Comparison: Old Plan vs New Plan

### OLD: Stripe (What we were going to do)
```
Friend pays $52.37
        ↓
Stripe takes 2.9% + $0.30 = $1.82
        ↓
You receive $50.55
        ↓
Money sits in Stripe account
        ↓
Transfer to bank (1-2 days, or 1% for instant)
```

### NEW: PayTo (What we're doing now)
```
Friend pays $52.37
        ↓
PayTo fee ~$0.20 (paid by you or friend)
        ↓
You receive $52.17
        ↓
Money is ALREADY in your bank
        ↓
Done. Instant.
```

---

## Implementation Plan

### Phase 1: Choose Provider & Sign Up
- [ ] Research Zepto, Azupay, Monoova
- [ ] Request quotes/demos
- [ ] Complete business verification
- [ ] Get API credentials

### Phase 2: Database Updates
- [ ] Add payment_agreements table
- [ ] Add payto_payments table
- [ ] Store user PayIDs

### Phase 3: Edge Functions
- [ ] create-payment-agreement
- [ ] initiate-payment
- [ ] payment-webhook-handler

### Phase 4: Web Payment Page
- [ ] Build item selection UI
- [ ] Bank selection flow
- [ ] Payment confirmation

### Phase 5: App Updates
- [ ] Share payment links
- [ ] Real-time payment notifications
- [ ] Payment history

---

## Next Steps

1. **Choose a provider** - Recommend starting with Zepto or Azupay
2. **Contact them** - Get pricing and API access
3. **Set up business account** - ABN, bank account verification
4. **Start building** - Once you have API credentials

---

## Sources

- [Zepto PayTo](https://zepto.com.au/solutions/payto)
- [Azupay PayTo Integration Guide](https://developer.azupay.com.au/docs/payto-integration-guide)
- [Monoova PayTo](https://www.monoova.com/payto)
- [PayTo Official (Australian Payments Plus)](https://www.auspayplus.com.au/solutions/payto)
- [Zepto Reviews - Capterra](https://www.capterra.com.au/software/1044045/zepto)
