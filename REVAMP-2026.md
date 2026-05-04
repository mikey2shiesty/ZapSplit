# ZapSplit — 2026 Fintech Revamp Plan (v2)

**Branch:** `revamp-2026`
**Direction:** Friendly Fintech — Coinbase × Public × Uber
**Goal:** Make ZapSplit feel like a saturated, confident, modern consumer fintech — bold rounded type, blue brand floods, soft cards on warm grey, pill buttons, iOS 26 native blur where it earns its keep.

---

## Why we pivoted

The first revamp pass tried "Editorial Mono" — Mercury × Ramp × Bugatti. Wrong lane. The reference set the user actually wants ZapSplit to look like is **Coinbase, Public, Uber, Spotify** — apps that share a completely different design language:

- Bold **sans display** numbers, not mono.
- **Cards are the language** — soft borders, rounded corners, sit on a faint grey canvas.
- The brand colour **floods the screen** — chart fills, button pills, tinted icon circles.
- **Pill shapes everywhere** — search bars, CTAs, time-range chips, filter chips.
- **Standard tab bar** with the active icon in a soft-tinted circle, label below.

Editorial Mono was correct for an enterprise B2B tool. It is wrong for a consumer money app trying to feel friendly and trustworthy.

---

## The Direction — "Friendly Fintech"

> *Confident, saturated, soft on the eyes. Money should feel approachable, not editorial.*

The visual signal is: **bold blue numbers on a warm grey canvas, bordered white cards holding the data, blue-tinted icon circles, pill buttons, generous spacing.** A user opening ZapSplit should feel they're in the same neighbourhood as Coinbase or Public, not Mercury or Stripe Dashboard.

---

## Brand Tokens — locked from the ZapSplit logo

The logo is non-negotiable, so the palette still derives from it. The accent gets used **heavily, not sparingly** — that was the v1 mistake.

### Color palette

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F4F6FB` | Primary background — warm pale grey-blue, the soft canvas Coinbase uses |
| `canvas.dark` | `#0B0F1A` | Dark mode background |
| `surface` | `#FFFFFF` | Card surface — every card sits on canvas with this fill |
| `surface.dark` | `#161B2A` | Dark mode card surface |
| `surfaceTint` | `#EAF1FE` | Soft-blue tinted surface — for icon circles, secondary pill buttons, active tab circle |
| `border` | `#E5E9F2` | 1px card borders — barely-there but present |
| `border.dark` | `#222838` | Dark mode card border |
| `ink` | `#0F1830` | Primary text — near-black with navy undertone |
| `ink.dark` | `#FFFFFF` | Dark mode text |
| `ink.muted` | `#5C6779` | Secondary text — body labels, subtitles |
| `ink.subtle` | `#9098A8` | Tertiary — timestamps, helper text |
| `accent` | **`#2D7EF7`** | The signature blue — pulled from the logo lightning bolt |
| `accent.deep` | `#1F5FCC` | Pressed states |
| `accent.ink` | `#FFFFFF` | Text on accent buttons |
| `accent.soft` | `#EAF1FE` | Soft fill for secondary pill buttons (matches `surfaceTint`) |
| `positive` | `#00B86B` | Owed-to-you, paid status |
| `positive.soft` | `#E1F7EC` | |
| `negative` | `#EF4856` | You-owe, unpaid |
| `negative.soft` | `#FCE7E9` | |
| `warning` | `#F5A524` | Pending |
| `warning.soft` | `#FEF1DA` | |

### Where the brand blue lives

Saturated, **everywhere it can be**:

- All primary CTA pills (filled `accent`)
- Active tab — icon sits inside a 36pt `surfaceTint` circle
- Active filter chip and tab indicator
- Receipt/document icon in every activity row (icon in `surfaceTint` circle, accent-coloured glyph)
- Notification badge dots
- Form field focus underline
- Progress bars
- Selection highlights, link text

The rule from v1 ("one accent, used sparingly") is replaced with: **drown the screen in it the way Coinbase does — but only with this specific blue.** No purples, no greens (except status), no gradients.

---

## Typography — bold rounded sans, mono is dead

Three weights of one system family. **No mono anywhere.** Money is bold display sans, not tabular.

| Family | iOS | Android | Web |
|---|---|---|---|
| **Sans** | `SF Pro Rounded` (display + text) | `Inter` | `Inter` |

Once licensed, swap to **Söhne** or **Inter Display** for production polish.

### Scale

| Token | Size / weight | Use |
|---|---|---|
| `display.hero` | 44pt / 700 | Big balance numbers, like Coinbase's `S$16.58` |
| `display.large` | 32pt / 700 | Page titles ("Get started", "Activity") |
| `display.medium` | 22pt / 700 | Card titles ("Fund your account") |
| `body.large` | 17pt / 600 | List row titles ("Crypto", "Cash") |
| `body` | 15pt / 500 | Default body |
| `body.small` | 13pt / 500 | Card subtitles, metadata |
| `caption` | 12pt / 500 | Timestamps, "2/4" progress text |
| `button` | 16pt / 600 | Pill button labels |
| `chip` | 13pt / 600 | Pill chips, filter labels |

**Rules:**

- Money is **bold sans display**, not mono. `$2,639.25` at 44pt weight 700 — like Coinbase, not like a Bloomberg terminal.
- Headings always 700, body 500–600, never 400.
- Title case for headings (`Get started`, not `GET STARTED`). UPPERCASE was an Editorial Mono affectation; consumer fintech doesn't shout.
- Letter spacing: tight (-0.4 to -0.6) on hero numbers, neutral elsewhere.

---

## Layout language

### Spacing — 8pt grid

```
4   xs   inline gaps
8   sm   inside compact rows
12  base padding inside cards (top/bottom)
16  md   default screen padding, padding inside cards (sides)
20  card vertical padding
24  lg   between cards
32  between sections
48  xl   page-level breathing room
```

### Corners — soft, not square

| Element | Radius |
|---|---|
| Cards | `16pt` |
| Pill buttons | `9999pt` (fully rounded) |
| Pill search bars | `9999pt` |
| Pill filter chips | `9999pt` |
| Soft icon circles | `9999pt` |
| Inputs (non-pill) | `12pt` |
| Sheet modals | `20pt` (top corners only) |

**Hairline dividers are out.** A 1px dividing line is fine inside a card to separate rows, but the structural layout is **white cards on warm grey** — not edge-to-edge hairline rows.

### Shadows — barely there, but present

Coinbase, Public, Uber all use **subtle shadows** to lift cards off the canvas — typically `0 1px 2px rgba(0,0,0,0.03)` plus a 1px border. Editorial Mono killed shadows entirely; that was wrong. We bring back **one** card shadow level and use it on every card.

```
shadow.card = {
  shadowColor: '#0F1830',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
}
```

### Icons

- Switch from outlined Ionicons to **Phosphor Regular** (preferred) or stay on **Ionicons filled variant**.
- Icons inside soft-tinted circles for activity-row leaders (Coinbase pattern):
  - 36pt circle, fill `surfaceTint` (`#EAF1FE`)
  - 18pt accent-coloured glyph centred
- Standalone icons in nav and headers: 22pt, ink colour, no fill.

---

## iOS 26 integration — Liquid Glass where it earns its place

iOS 26 is the runtime, not a visual signature. The reference apps don't use floating glass tab bars — they use the standard tab bar. So Liquid Glass shows up only where iOS 26 native already does it:

1. **Top nav blur on scroll** — when the user scrolls past the top safe area, the nav bar acquires a `BlurView` background (intensity 90, `prominent` tint). Native iOS 26 behaviour.
2. **Modal sheet backdrop** — when a sheet rises, the dimmed background is a `BlurView` instead of a flat `rgba(0,0,0,0.5)` overlay. Subtle, expensive-feeling.
3. **Bottom tab bar background** — the tab bar is the standard layout (label-under-icon, active icon in tinted circle), but its background is a `BlurView` on iOS 26 so the canvas peeks through. This is the *only* iOS 26 signal in the tab bar — no pill, no float.

**No floating Liquid Glass pill tab bar.** That contradicts every reference app.

---

## Component-by-component plan

### Buttons

| Variant | Look |
|---|---|
| **Primary** | Filled `accent` blue pill, white text, 52pt height, weight 600, `radius 9999` |
| **Secondary** | `accent.soft` filled pill, accent-blue text, 52pt height — Coinbase's "Deposit" style |
| **Tertiary** | Text-only, accent blue, weight 600 (used sparingly — "View all", "Add Friends") |
| **Destructive** | `negative.soft` filled pill, negative-coloured text |

Pressed state: scale to 0.98, opacity 0.9. Haptic light on every press.

### Cards

The fundamental container. Every card is:

```
backgroundColor: surface (#FFFFFF)
borderRadius: 16
borderWidth: 1
borderColor: border (#E5E9F2)
shadow: shadow.card
padding: 20 (vertical) / 16 (horizontal)
```

Variants:

- **Default** — the spec above
- **Tinted** — `surfaceTint` background instead of white (used for the "Get started" card on home)
- **Pressable** — same look + scale-to-0.98 on press

### Activity rows

Inside a card. Each row:

- Leading: 36pt circle, `surfaceTint` fill, accent-blue 18pt icon centred
- Title: 17pt weight 600 ink
- Subtitle: 13pt weight 500 muted
- Trailing: amount in 17pt weight 700 (positive green / negative red), then 16pt chevron in subtle ink

Rows separated by a 1px `border` divider inside the card (NOT edge-to-edge hairlines on the canvas).

### Inputs

- Non-pill: 12pt corners, white fill on canvas, 1px `border`, 48pt height
- Pill search: 44pt height, `radius 9999`, fill `surfaceTint`, search glyph at left

### Tab bar

Standard React Navigation. **Not floating.** Specs:

- Background: `BlurView intensity={90}` on iOS, white with 1px top border on Android
- Height: 56pt + bottom safe-area inset
- Each tab: icon 24pt + label 11pt weight 600
- **Active tab: icon sits inside a 36pt `surfaceTint` circle**, icon coloured `accent`, label `accent`
- Inactive tab: icon `ink.subtle`, label `ink.muted`
- 4 tabs: Home, Splits, Scan, Profile

### Numbers

Bold sans display, sized by context:

- Hero balance: 44pt / 700
- Card-level totals: 28pt / 700
- Row amounts: 17pt / 700
- Inline metadata: 13pt / 600

`MoneyText` component:
- `Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`
- Tones: `default | positive | negative | inverse`
- Sizes: `hero | large | row | caption`
- **No `fontVariant: tabular-nums`** — that was a mono affectation; bold sans display reads better proportional.

---

## Screen-level redesigns

### 1. Home

Top → bottom:

1. **Header**: ZapSplit avatar/initials + pill search bar + gift icon + bell icon. iOS 26 blur appears here on scroll.
2. **Hero balance card** (or directly on canvas like Public's `$46.00` if the balance is the only number there): `Net balance` label, big 44pt bold number, `+$2,639.25` style with sign and tone colour.
3. **Get started card** (only for new users): tinted background, `Unlock trading`-style accent label + bold heading + thin progress bar + 2/4 caption + illustrated icon top-right. Tappable, navigates to onboarding flow.
4. **Quick actions row**: two pills side-by-side — `Split a bill` (filled accent) + `Request` (soft-blue secondary).
5. **Activity card**: card title `Activity` weight 700 + `View all` text-tertiary on right, then a list of activity rows separated by inner 1px dividers. Each row: tinted circle + receipt icon, title, `Apr 30 · 4 people · Paid` subtitle, amount, chevron.
6. **Bottom CTA banner** (optional, can come later): "Earn rewards" or referral, in a tinted card with illustration.

The vibe should match Coinbase's home (image 308): pill search at top, big bold heading sections ("Get started", "Explore Coinbase"), bordered cards holding everything.

### 2. Splits

- Pill search at top, full-width, fill `surfaceTint`
- Pill filter chips below: `All / Open / Settled`, accent-filled when active
- Splits in a single card: rows separated by inner dividers
- Top of card: small caption `12 SPLITS · A$2,639.25 OUTSTANDING`

### 3. Scan (Receipt)

- Standard camera screen, not editorial dark
- Capture button: 76pt accent-blue circle, white camera icon, lift shadow
- Detected items appear in a sheet at the bottom — bordered card with rows

### 4. Profile

- Avatar 80pt + name in display.large + email in body.small muted
- Account settings list: in a card, rows separated by dividers, leading tinted icon circle for each row (Coinbase pattern)
- Sign out button: soft red `negative.soft` pill at bottom

### 5. Auth (Welcome / Login / Signup)

- Logo top-left at proper size, no recolouring
- Heading: `Splits made simple.` in display.large weight 700
- Inputs: 12pt-corner boxes (NOT underline-only)
- Apple/Google sign-in: pill buttons with platform logo at left, white fill, 1px border

---

## What we're NOT changing

- Web app — separate concern
- Backend, Supabase, Stripe — UI only
- Feature set
- App architecture, navigation graph, hooks

---

## Execution plan

### Phase 1 — Tokens & primitives (~1 hour)
1. Rewrite `src/constants/theme.ts` for the Friendly Fintech palette + bold sans + soft shadows + 16pt corners
2. Rewrite `src/contexts/ThemeContext.tsx` light/dark palettes
3. Rewrite primitives:
   - `Button.tsx` — pill primary + soft-blue secondary + tertiary text + destructive
   - `Card.tsx` — bring it back: 16pt corners, 1px border, soft shadow, white fill
   - `Input.tsx` — 12pt corner box (not underline), pill `SearchInput` variant
   - `Header.tsx` — title left, actions right, BlurView background on scroll
   - `Badge.tsx` — soft-fill pills with weight-600 inline text (not uppercase)
   - `MoneyText.tsx` — bold sans display, drop tabular-nums
   - `IconCircle.tsx` (new) — 36pt tinted circle wrapping an icon
4. Add `useScrollBlur` hook for iOS 26 nav-bar blur on scroll

### Phase 2 — Tab bar (~30 min)
5. Rewrite `MainNavigator.tsx`: standard tab bar with `BlurView` background (iOS 26), active icon inside 36pt `surfaceTint` circle, label below, NOT floating
6. Replace tab icons with Phosphor Regular (or Ionicons filled)
7. Remove the `TabBarSafeArea` 120pt clearance (no longer floating, standard inset is enough)

### Phase 3 — Core screens (~2 hours)
8. Home — full Friendly Fintech rewrite per spec above
9. Splits — pill search + filter chips + card-of-rows
10. Profile — avatar header + settings card with tinted icon circles
11. Auth flow — display.large headings + boxed inputs + pill social buttons

### Phase 4 — Secondary screens (~2 hours)
12. Settings + sub-screens
13. Friends + Groups
14. Split flow (Create, Review, Pay, Success)
15. Notifications, Analytics, Help
16. Re-skin request modal as a proper bottom sheet with `BlurView` backdrop

### Phase 5 — Polish (~1 hour)
17. Haptics on every primary interaction (light press / medium for nav / success notification)
18. Pressed states: scale to 0.98 + opacity 0.9 on every pressable
19. Empty states: tinted card with illustration + heading + subtext + CTA pill
20. Loading states: subtle shimmer skeletons matching card shape

**Total estimate:** ~6.5 hours focused.

---

## Success criteria

✅ **The Coinbase test** — strip the logo, would a friend mistake the home screen for Coinbase / Public / Uber's home? It should feel like it lives in that neighbourhood.

✅ **The blue test** — does the brand blue appear on every screen, in saturation, drowning the canvas the way Coinbase's blue does? If you can squint and see "blue, blue, blue" — pass.

✅ **The card test** — does every information cluster sit in a soft-bordered, soft-shadowed white card on a warm grey canvas?

✅ **The bold-number test** — does every dollar amount render in bold sans display, never mono? If anything looks like a Bloomberg terminal, fail.

✅ **The pill test** — are CTAs, search, and filter chips all pill-shaped (`radius 9999`)? Are tab bar's active icons in soft circles? Pass = yes.

✅ **The iOS 26 test** — when scrolled, does the top nav blur? Do modal backdrops use `BlurView`? Does the tab bar background blur? These are the only places Liquid Glass should appear.

---

## Decisions locked

✅ **Reference set** — Coinbase + Public + Uber primarily; Spotify and Cash App as secondary signal.
✅ **Accent blue** — `#2D7EF7`, used heavily, not sparingly.
✅ **Type** — bold rounded sans (SF Pro Rounded / Inter), weights 500/600/700. Mono is dead.
✅ **Layout** — soft cards on warm grey canvas. Hairlines are out.
✅ **Tab bar** — standard label-under-icon with active icon in tinted circle. No floating pill.
✅ **iOS 26** — Liquid Glass on nav scroll-blur, modal backdrops, tab bar background only.
✅ **Logo** — non-negotiable, stays as-is.

## Still to confirm

- **Fonts** — ship v1 on `SF Pro Rounded` (free, native) for iOS and `Inter` for Android. License `Söhne` later when revenue justifies it.
- **Icon set** — Phosphor Regular for the friendlier rounded look, or stay on Ionicons filled? Recommend Phosphor.

---

**Next move:** rip out the Editorial Mono primitives I just shipped, rewrite Phase 1 in the Friendly Fintech direction, then mock the Home screen for review before any other screen is touched.
