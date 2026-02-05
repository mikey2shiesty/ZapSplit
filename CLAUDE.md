# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZapSplit is a bill-splitting app with two components:
- **Mobile app** (`/zapsplit`) - React Native + Expo for iOS/Android, handles split creation and management
- **Web app** (`/zapsplit-web`) - Next.js payment page where recipients pay their share via shareable links

Both apps share a Supabase backend (PostgreSQL, Auth, Edge Functions) and use Stripe for payments.

## Development Commands

### Mobile App (zapsplit/)
```bash
npm start              # Start Expo dev server
npm run ios            # Build and run on iOS simulator
npm run android        # Build and run on Android emulator
eas build --platform ios   # Production build for App Store
```

### Web App (zapsplit-web/)
```bash
npm run dev            # Start dev server (localhost:3000)
npm run build          # Production build
npm run lint           # Run ESLint
```

### Supabase Edge Functions
Edge functions are in `supabase/functions/`. Deploy with:
```bash
supabase functions deploy <function-name>
```

## Architecture

### Mobile App Structure (`zapsplit/src/`)
- **screens/** - 42 screen components organized by feature (auth, splits, friends, groups, settings, payments, analytics, notifications)
- **services/** - Business logic layer:
  - `splitService.ts` - Split CRUD, calculations, sharing
  - `paymentService.ts` - Payment processing
  - `stripeService.ts` - Stripe Connect integration
  - `receiptService.ts` - Receipt OCR via GPT-4o Vision
  - `friendService.ts`, `groupService.ts` - Social features
  - `notificationService.ts` - Push notifications
  - `supabase.ts` - Supabase client initialization
- **hooks/** - Custom hooks (`useAuth`, `useSplits`, `useSplitCreation`, `useFriends`)
- **navigation/** - React Navigation stacks (Auth, Main, SplitFlow)
- **components/** - Reusable UI components

### Web App Structure (`zapsplit-web/src/`)
- **app/** - Next.js App Router
  - `page.tsx` - Landing page
  - `pay/[code]/page.tsx` - Dynamic payment page (main functionality)
  - `api/payment/create-intent/` - Stripe payment intent API route
- **components/** - UI components (ItemList, PayButton, PaymentSummary, StripeProvider)
- **lib/supabase.ts** - Supabase client + database query functions

### Data Flow
1. Mobile app creates split → stored in Supabase `splits` table
2. Share link generated (e.g., `zapsplit.com.au/pay/ABC123`)
3. Recipient opens web link → loads split data from Supabase
4. Payment processed via Stripe → webhook updates payment status

### Key Database Tables
- `splits` - Bill splits with amount, type, status
- `split_participants` - Who owes what in each split
- `item_claims` - Which items each person claimed (receipt splits)
- `payments` - Payment records
- `friends` - Friend relationships
- `groups` - Group definitions

## Environment Variables

### Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
OPENAI_API_KEY=          # For receipt OCR
```

### Web (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
```

## Deep Linking

Mobile app handles deep links for payment pages:
- Universal links: `https://zapsplit.app/pay/:code`
- Custom scheme: `zapsplit://pay/:code`

Configuration in `app.json` under `ios.associatedDomains` and `android.intentFilters`.

## Stripe Integration

- **Mobile**: Stripe React Native SDK with Apple Pay/Google Pay
- **Web**: Stripe.js with Payment Element
- **Connect**: Creators onboard as connected accounts for payouts
- **Edge Functions**: `create-payment-intent`, `stripe-webhook`, `create-connect-account`, `get-account-status`

## Important Files

- `src/services/splitService.ts:49` - RLS helper functions (SECURITY DEFINER)
- `src/screens/splits/PaymentRequestScreen.tsx` - Payment request flow
- `src/hooks/useSplitCreation.ts` - Split creation state machine
- `zapsplit-web/src/app/pay/[code]/page.tsx` - Web payment page

## Currency & Market

- Currency: AUD (Australian Dollars)
- Platform fee: $0.50 per transaction
- Target market: Australia
- Domain: zapsplit.com.au
