# ZapSplit — 2026 Fintech Revamp Plan

**Branch:** `revamp-2026` (new — branched off `main`, not `github-revamp2`)
**Direction:** Hyper-minimal mono / editorial fintech — Mercury × Ramp × iOS 26
**Goal:** Make ZapSplit look like a 2026 fintech, not a 2019 Splitwise clone.

---

## The Problem (brutally honest)

The current app looks generic. Stock Tailwind blue, rounded white cards on grey, outlined icons in tinted squares — it could be Splitwise, Tab, Beem It, or any of 50 other split apps. There is no visual identity. No one would describe ZapSplit's design in one sentence.

Modern fintechs **own a visual language**:
- Mercury → off-white + serif headlines + mono numerals
- Ramp → near-black + electric green accent + monospace data
- Cash App → saturated brand green floods the screen
- Linear → off-white + perfect spacing + zero ornament
- Robinhood → pure black + neon green + glass
- Revolut → gradients + bold type

ZapSplit needs its own lane. Pick one and commit.

---

## The Direction — "Editorial Mono"

A hybrid lane that sits between **Mercury's editorial calm** and **Ramp's data-dense seriousness**, with **iOS 26's Liquid Glass** for native polish. The result reads as:

> *Serious about money, friendly to humans, native to iOS 26.*

### Why this lane

- **Bill splitting is emotional** — friends, debts, awkwardness. Pure editorial (Bugatti) feels too cold. Pure Cash App feels too playful.
- **Australian market is conservative-cool** — they trust Up, Wise, Macquarie. Not Robinhood-loud.
- **It scales to features we don't have yet** — analytics, business splits, group treasuries — without redesign.

---

## Brand Tokens — locked from the ZapSplit logo

The logo is non-negotiable, so the entire palette is **derived from it**. Three blues do all the work: the **electric blue from the lightning bolt** (energy), the **deep navy from the wordmark** (trust), and a **pale lavender** that informs the canvas. One brand, one feeling — logo and app speak the same language.

### Color palette

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#FAFAFE` | Primary background — warm off-white with a hint of blue undertone |
| `canvas.dark` | `#0A0E1A` | Dark mode background — near-black with navy undertone |
| `surface` | `#FFFFFF` | Elevated surface (only when truly elevated) |
| `surface.dark` | `#141826` | Dark mode surface |
| `ink` | `#1A3F6E` | **Primary text — your logo's deep navy wordmark** |
| `ink.dark` | `#FAFAFE` | Dark mode text |
| `ink.muted` | `#6B7280` | Secondary text — muted blue-grey |
| `ink.subtle` | `#9AA3B5` | Tertiary / metadata |
| `hairline` | `#E5E9F2` | All dividers, borders — 1px pale blue-grey only |
| `accent` | **`#2D7EF7`** | **The signature — your logo's electric lightning blue** |
| `accent.ink` | `#FFFFFF` | Text on accent buttons (white on blue) |
| `positive` | `#0A6E2A` | "Owed to you" — deep emerald, no clash with blue |
| `negative` | `#A8232C` | "You owe" — burgundy, no clash with blue |
| `warning` | `#B8860B` | Pending / waiting — antique gold |

**The accent (`#2D7EF7`)** is the single signature. It appears on:
- Primary CTA buttons (filled, not outlined)
- Active tab indicator
- Progress bars on completed splits
- Selection highlights
- Notification dots
- Active form field underlines

That's it. **One accent. Used sparingly. Owned aggressively.**

**The ink (`#1A3F6E` navy)** is the secret weapon. Every body label, every heading, every list item title is rendered in your logo's navy. That means *the brand color is on every screen, every word* — the way Stripe makes purple feel inevitable.

### Why this palette works

- **Brand coherence** — the logo, the app, the marketing site, the social posts all live in the same blue family. No mismatch.
- **Trust + Energy** — navy ink says "we handle money seriously," electric accent says "we're new and fast." Both your logo, both the app.
- **Australian fintech fit** — Up is orange, Wise is green, Macquarie is red. **Electric blue is wide open in AU fintech.** You're not fighting for a color slot.
- **Two-blue duotone** — Mercury, Stripe Dashboard, and Linear all use a deep ink + bright accent of the same family. It's a proven 2026 fintech signal.
- **Emerald + burgundy for positive/negative** — restrained, editorial, never shouting in your face the way Splitwise's bright red/green does.

---

## Typography — three-family system

| Family | Use | Stack |
|---|---|---|
| **Display** | Hero numbers, large balances | `Söhne` / `Inter Display` / `SF Pro Display` |
| **Text** | Body copy, friendly UI labels | `Söhne` / `Inter` / `SF Pro Text` |
| **Mono** | All numerals over $X, captions, metadata, timestamps | `Berkeley Mono` / `JetBrains Mono` / `SF Mono` |

**Rules:**
- Money is ALWAYS mono. `$2,639.25` is mono everywhere it appears.
- Display sizes: 56pt (hero balance), 32pt (page titles), 22pt (section heads)
- Text sizes: 17pt (body), 15pt (label), 13pt (button label)
- Mono caption: 11pt with 1.5px letter-spacing, UPPERCASE for category labels
- One weight per family — Display 500, Text 400, Mono 400. **No 600/700/800/900 anywhere.**

---

## Layout language

### Spacing — 8pt grid

```
4   xs   – tight inline spacing
8   sm   – inside compact rows
16  md   – default padding
24  lg   – between unrelated blocks
40  xl   – section breaks
72  2xl  – top-of-page breathing room
```

### Corners

- `0px` on most elements (cards, rows, inputs)
- `12px` on the floating tab bar pills and primary buttons
- `9999px` (pill) on small chip elements (filters, status dots)

### No more

- ❌ Cards everywhere — replaced with full-bleed sections + hairline dividers
- ❌ Drop shadows — replaced with hairline borders or nothing
- ❌ Tinted icon squares — replaced with bare 24pt monoline icons
- ❌ Outlined buttons as primary — primary is filled accent, secondary is text-only
- ❌ Progress bars at 4-8px — replaced with 1px hairline progress

---

## iOS 26 Liquid Glass Tab Bar

**Yes, implementing it.** This is the single biggest "looks like 2026" signal we can ship.

### Specs
- **Floating** — 16pt inset from screen edges, 28pt from bottom
- **Pill-shaped** — fully rounded (`borderRadius: 9999`)
- **Translucent BlurView** — iOS native blur at intensity 80, dark/light tint follows theme
- **Hairline border** — `StyleSheet.hairlineWidth` for the glass edge
- **64pt height** — compact, doesn't dominate
- **Icons** — Phosphor Duotone or SF Symbols at 22pt
- **Labels** — UPPERCASE mono caption, 9pt, 1.5px tracking
- **Active state** — accent blue pill behind the icon (subtle), label switches to `ink` navy
- **Haptic** — light impact on tab change

### Content respects the bar
Every screen gets `paddingBottom: 120` on its scroll content so the floating bar never covers data. Implemented via a `<TabBarSafeArea>` wrapper component once, applied everywhere.

---

## Component-by-component plan

### Buttons

```
Primary    → filled accent (#2D7EF7 electric blue) + white text + 12px corners + 52pt height
Secondary  → text-only navy ink with hairline underline on press
Tertiary   → mono caption with chevron, no border
Destructive → text-only in burgundy negative, no fill
```

**Gone:** outlined buttons, ghost buttons, icon buttons in circles.

### Cards / Rows

Cards are **mostly deleted**. What replaces them:

- **Section blocks** — full-bleed, separated by 40pt vertical space + optional hairline
- **List rows** — 64pt tall, hairline divider between, no surrounding card
- **Hero blocks** — full-bleed colored sections (rare, only for the home balance)

Only thing that stays a card: **payment confirmation cards** (Stripe receipt feel).

### Inputs

- Underline-only — 1px hairline border-bottom, no fill
- Label sits above in mono caption UPPERCASE
- Active state — underline thickens to 2px in electric blue accent
- Error state — underline turns burgundy, helper text in mono

### Numbers

Every dollar amount becomes:
```
$2,639.25
^^ Mono ^^
```
With tabular figures so digits don't dance when balance updates.

### Icons

- Switch from Ionicons (rounded, generic) to **Phosphor Duotone** or **Lucide**
- All icons 24pt monoline, weight 1.5px stroke
- No tinted square backgrounds — icons sit bare on canvas

---

## Screen-level redesigns

### 1. Home

- Kill the search bar at top (move to Splits screen where it belongs)
- Top bar: just notification bell + analytics chart icon, both bare 22pt
- Hero: full-bleed balance section with NO card
  - Mono `$2,639.25` at 56pt
  - Below: two-column "YOU OWE / OWED TO YOU" in mono caption + mono numbers, separated by hairline
- CTAs: filled accent "Split Bill" + text-only "Request" — same row
- Recent splits: flat rows with hairline dividers, no cards, no tinted icon squares
  - Title in Text 17pt
  - Metadata in Mono caption (`APR 30 · $0.60 OF $31.50`)
  - 1px progress hairline at bottom of row
  - Right side: mono amount + chevron

### 2. Splits

- Search bar moves here, full-width, underline-only
- Filter pills: mono caption, hairline border, accent fill on active
- Rows match Home rows
- Top: summary block (TOTAL OWED / TOTAL OWING / NET) in mono, hairline above + below

### 3. Scan (camera receipt)

- Full-screen near-black canvas (`#0A0E1A`)
- Capture button: 76pt electric blue accent circle, mono "CAPTURE" label in white
- Detected items: drawer that slides up, mono prices in navy

### 4. Profile

- Avatar at top, name in Display 32pt, email in Mono caption
- Settings list: hairline-divided rows, no cards, mono caption labels
- Sign out: text-only at bottom in mono

### 5. Auth (Welcome / Login / Signup)

- ZapSplit logo top-left at proper size (no recolouring — the existing blue logo on `#FAFAFE` canvas)
- Editorial copy: *"Splits made simple."* in Display, navy ink
- Inputs underline-only, navy ink, blue accent on focus
- Primary CTA filled electric blue with white text
- Apple/Google buttons: text-only with platform glyph at left, hairline divider between

---

## What we're NOT changing

- Web app (`zapsplit-web/`) — separate concern, can revisit later
- Backend / Supabase / Stripe integration — UI only
- Feature set — no new features in this revamp, just the visual language
- App architecture — same screens, same navigation, same hooks

---

## Execution plan

### Phase 1 — Tokens & primitives (~1 hour)
1. Update `src/constants/theme.ts` with new color palette, typography, spacing
2. Update `src/contexts/ThemeContext.tsx` with light/dark editorial-mono palettes
3. Rewrite core components: `Button`, `Card` (mostly delete), `Input`, `Header`, `Badge`
4. Add `MoneyText` component — automatically mono, tabular, currency-formatted
5. Add `TabBarSafeArea` wrapper for floating tab bar clearance

### Phase 2 — Tab bar (~30 min)
6. Implement iOS 26 Liquid Glass tab bar in `MainNavigator.tsx`
7. Replace tab icons with Phosphor / Lucide
8. Apply `TabBarSafeArea` to all screens

### Phase 3 — Core screens (~2 hours)
9. Home — full editorial rewrite
10. Splits — full editorial rewrite
11. Profile — full editorial rewrite
12. Auth flow — full editorial rewrite

### Phase 4 — Secondary screens (~2 hours)
13. Settings + sub-screens
14. Friends + Groups screens
15. Split flow (Create, Review, Pay, Success)
16. Notifications, Analytics, Help

### Phase 5 — Polish (~1 hour)
17. Haptics on every primary interaction
18. Subtle motion: 200ms ease-out on tab change, 150ms on press states
19. Empty states with editorial copy
20. Loading states (mono skeleton lines, not spinning circles)

**Total estimate:** ~6.5 hours of focused work. Achievable in one session.

---

## Success criteria

After the revamp, ZapSplit should pass these tests:

✅ **The blink test** — strip the logo, would someone confuse this with Splitwise / Tab / Beem? If yes, we failed.

✅ **The accent test** — does the electric blue accent feel inevitable (because it lives in the logo), or bolted on? If it could be swapped for any other color without changing the feel, we failed.

✅ **The logo coherence test** — open the App Store screenshot, then open the app. Do they feel like the same brand? If the app feels like a different product than the logo, we failed.

✅ **The 2026 test** — does the floating glass tab bar make this feel native to iOS 26? Does it pair well with the editorial type?

✅ **The Mercury test** — does the Home screen feel as calm and considered as Mercury's dashboard? If it feels busier, simplify.

✅ **The mono numerals test** — does every dollar amount in the entire app render in mono? No exceptions.

---

## Decisions locked

✅ **Accent color** — `#2D7EF7` electric blue (pulled directly from the logo lightning bolt)
✅ **Ink color** — `#1A3F6E` deep navy (pulled directly from the logo wordmark)
✅ **Logo** — non-negotiable, stays exactly as-is. The whole palette is derived from it.
✅ **Branch strategy** — fresh branch `revamp-2026` off `main`. Bugatti work stays preserved on `github-revamp2` as a reference.

## Still to confirm

- **Fonts** — system fallbacks (SF Pro / SF Mono — free, ships immediately) for v1, or licensed `Söhne` / `Berkeley Mono` (~$800 one-time total) for production? Recommendation: ship v1 with system fonts, license the custom fonts only once revenue starts coming in.

---

**Greenlight given. Starting Phase 1: create `revamp-2026` branch off `main`, rewrite tokens + core primitives, then mock up the Home screen so you can see the direction in 30 minutes before I touch any other screens.**
