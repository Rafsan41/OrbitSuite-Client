# OrbitSuite Design System

Companion to `CLIENT_BUILD_PROMPT.md`. This describes the system **as built** —
every value here is transcribed from `app/globals.css` and the components that
use it, so it can be trusted as a reference rather than an intention.

**Do not invent colours, spacing values, or component variants outside this file.**

## Source of truth

The visual design exists as `design/OrbitSuite.dc.html` (every screen) and
`design/DataTable.dc.html` (the table). These are Claude Design exports —
templating markup (`<sc-if>`, `<sc-for>`, `{{ }}`), not runnable React. **Read
them for layout, copy and spacing, then implement in React.** Open in a browser
to view; `support.js` must stay beside them.

They live in `design/`, not `public/` — `public/` is served verbatim at the site
root, so design source there would ship to end users.

Where the implementation departs from the export, the departure is recorded in
[§8](#8-deviations-from-the-design-export) with its reason. Nothing has drifted
silently.

## Brand

```
60%  page       #f8fafc   application background
30%  burnt sienna  #e97451   primary actions, brand presence
10%  teal       #007979   links, secondary actions, active nav
```

**Sienna and teal never appear on the same element.** Sienna is "act on this";
teal is "navigate to this". One primary sienna button per view.

**The 60/30/10 split applies to the marketing landing page, not the app chrome.**
Thirty percent sienna across a billing table would be unreadable. Inside the
product: page background, white cards, sienna reserved for the single primary
action, teal for links and the active nav item. The brand still reads clearly
because nothing else competes with it.

---

## 1. Colour tokens

Two vocabularies share one palette. The design export names its surfaces
`--surface` / `--text` / `--border`; shadcn's components are written against
`--background` / `--foreground` / `--primary` and cannot be restyled without
forking every one of them. So **the design tokens hold the actual values, and
shadcn's names are declared as aliases of them.** `shadcn add` then drops a
component in unmodified and it renders in this palette, in both themes, with
nothing to patch by hand.

Custom properties resolve lazily, so an alias may reference a token declared
later in the file — including the `@theme` ramps.

### Surfaces

```css
:root {
  --surface: #ffffff;
  --page-bg: #f8fafc;
  --text: #0f172a;
  --text-soft: #334155;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --border-soft: #f1f5f9;
  --scrim-light: rgba(255, 255, 255, 0.65);
  --scrim-strong: rgba(255, 255, 255, 0.92);
  --glass-border: rgba(255, 255, 255, 0.6);
}
```

Neutrals are **cool slate**, matching the design export. (An earlier revision of
this document specified warm stone; the export is the authority and the
implementation follows it.)

### Dark theme

The design ships an explicit toggle, so the dark variant follows a **class**, not
`prefers-color-scheme`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Only the design tokens are restated under `.dark`. Every shadcn alias is defined
in terms of them and follows for free; the handful listed after them need a
genuinely different value on a dark ground.

```css
.dark {
  --surface: #1e293b;
  --page-bg: #0f172a;
  --text: #f1f5f9;
  --text-soft: #cbd5e1;
  --text-muted: #94a3b8;
  --border: #334155;
  --border-soft: #334155;
  --scrim-light: rgba(15, 23, 42, 0.55);
  --scrim-strong: rgba(30, 41, 59, 0.92);
  --glass-border: rgba(148, 163, 184, 0.25);

  /* The pale teal wash inverts to the deep teal, and the failed-status red
     has to lift to stay legible. */
  --accent: var(--color-accent-700);
  --accent-foreground: var(--color-accent-100);
  --destructive: #f87171;
}
```

Theme state is managed by `next-themes` with `attribute="class"`.

### Brand and accent ramps

```css
@theme {
  /* Burnt sienna. */
  --color-brand-50: #fcf2e5; /* cream — base of the landing gradient, not a tint */
  --color-brand-100: #fceeea;
  --color-brand-200: #fadcd4;
  --color-brand-300: #f6c7b9;
  --color-brand-500: #e97451; /* the brand colour */
  --color-brand-600: #b85a3c; /* the button fill */
  --color-brand-700: #99492f; /* hover / active */

  /* Teal. */
  --color-accent-50: #e6f2f2;
  --color-accent-100: #cce5e5;
  --color-accent-200: #a9d8d6;
  --color-accent-600: #007979;
  --color-accent-700: #005c5c;
}
```

### Status triples

Nine tokens, each a background / foreground / border set:

```css
--color-status-success-bg: #ecfdf5;   --color-status-success-fg: #047857;   --color-status-success-border: #a7f3d0;
--color-status-pending-bg: #fffbeb;   --color-status-pending-fg: #b45309;   --color-status-pending-border: #fde68a;
--color-status-failed-bg: #fef2f2;    --color-status-failed-fg: #b91c1c;    --color-status-failed-border: #fecaca;
--color-status-neutral-bg: #f8fafc;   --color-status-neutral-fg: #475569;   --color-status-neutral-border: #cbd5e1;
--color-status-warning-bg: #fff7ed;   --color-status-warning-fg: #c2410c;   --color-status-warning-border: #fed7aa;
--color-status-refund-bg: #f5f3ff;    --color-status-refund-fg: #6d28d9;    --color-status-refund-border: #ddd6fe;
--color-status-rollback-bg: #fff1f2;  --color-status-rollback-fg: #9f1239;  --color-status-rollback-border: #fecdd3;
--color-status-info-bg: #f0f9ff;      --color-status-info-fg: #0369a1;      --color-status-info-border: #bae6fd;
--color-status-expired-bg: #e6f2f2;   --color-status-expired-fg: #005c5c;   --color-status-expired-border: #a9d8d6;
```

### shadcn aliases

Declared, never hardcoded — so changing `--color-brand-600` moves every primary
surface at once:

```css
--primary: var(--color-brand-600); /* 600, not 500: this fill carries white text */
--primary-foreground: #ffffff;
--ring: var(--color-accent-600);   /* teal owns focus, so a ring never collides
                                      with a sienna button fill */
--destructive: var(--color-status-failed-fg);
--radius: 0.5rem;                  /* 8px — the design's card radius */
```

### Contrast — measured, not assumed

| Combination        | Ratio      | Verdict                                  |
| ------------------ | ---------- | ---------------------------------------- |
| White on `#e97451` | **2.78:1** | ✗ fails AA — cannot carry text           |
| White on `#b85a3c` | **4.60:1** | ✓ passes AA — the button fill            |
| White on `#99492f` | **6.27:1** | ✓ passes AA — hover, more contrast still |
| White on `#007979` | **5.25:1** | ✓ passes AA                              |
| `#007979` on white | **5.25:1** | ✓ passes AA — teal links are safe        |

So: **`#e97451` is the brand colour, `#b85a3c` is the button fill.** Use
`#e97451` for the logo, hero headings, illustration blocks and anything 24px or
larger. Use `#b85a3c` wherever white label text sits on it. The design export
uses the brand colour for button fills — [§8](#8-deviations-from-the-design-export)
records why that one is overridden.

---

## 2. Status mapping

Five Prisma enums carry statuses — `OrgStatus`, `UserStatus`,
`SubscriptionStatus`, `PaymentStatus`, `TransactionStatus` — 22 members in all,
**12 distinct values**, collapsing to **9 colour tokens**. The mapping is
exhaustive; every status resolves.

| Token      | Statuses               | Reasoning                                     |
| ---------- | ---------------------- | --------------------------------------------- |
| `success`  | `ACTIVE`, `SUCCESS`    | Healthy terminal state                        |
| `pending`  | `PENDING`              | In flight, not yet resolved                   |
| `failed`   | `FAILED`               | Something went wrong                          |
| `neutral`  | `CANCELLED`, `REMOVED` | Intentional end-state, **not** an error       |
| `warning`  | `SUSPENDED`            | Admin action, distinct from a payment failure |
| `refund`   | `REFUNDED`             | Money returned — a reversal, not a failure    |
| `rollback` | `ROLLED_BACK`          | Transaction reversed by the system            |
| `info`     | `INVITED`, `TRIAL`     | Provisional, awaiting the user                |
| `expired`  | `EXPIRED`              | Lapsed period — time-based, not a failure     |

Three choices to preserve:

- **`CANCELLED` / `REMOVED` are grey, not red.** They are intended outcomes. Red
  makes ordinary churn look like a system fault.
- **`SUSPENDED` (orange) ≠ `FAILED` (red).** One is an admin action, the other a
  payment problem, and they sit side by side on the platform-wide table.
- **`ROLLED_BACK` is rose** — adjacent to red but distinct, because it is the
  status that shows the rollback logic worked. It must be visible and separate.

`EXPIRED` uses teal rather than sienna on purpose: sienna is the primary action
colour and must never appear as a status, or a badge starts looking like a
button. Teal is the only brand hue not otherwise spoken for in the status set.

---

## 3. StatusBadge

`components/status-badge.tsx`. One component, one lookup, no per-page colour
decisions anywhere else in the app.

It wraps shadcn's `Badge` for shape, sizing and icon handling, overriding
`variant` because shadcn's four variants are semantically neutral while these
nine carry meaning that has to survive a greyscale print.

```tsx
const TOKEN_CLASSES: Record<StatusToken, string> = {
  success:
    "bg-status-success-bg text-status-success-fg border-status-success-border",
  // …one row per token
};
```

Classes are **utilities generated from the `@theme` tokens**
(`bg-status-success-bg`), not arbitrary-value syntax (`bg-[--color-…]`) — the
tokens live in `@theme`, so Tailwind emits real utilities for them.

Rendered as `rounded-full border px-2.5 py-0.5 text-[11px] font-medium`. The
label is the status string humanised: `ROLLED_BACK` → `Rolled back`.

An unmapped status falls back to `neutral` rather than rendering unstyled — a new
backend enum value should look odd, not vanish.

**Always render the text label.** Never encode meaning in colour alone.

---

## 4. Typography

`Geist`, wired in `layout.tsx` and pointed at by `--font-sans`. One scale:

| Use                  | Classes                                        |
| -------------------- | ---------------------------------------------- |
| Page title           | `text-2xl font-semibold tracking-tight`        |
| Section heading      | `text-lg font-semibold tracking-tight`         |
| Card title           | `text-sm font-semibold`                        |
| Body                 | `text-sm`                                      |
| Table header         | `text-[11px] font-semibold uppercase tracking-wide` |
| Table cell           | `text-sm`                                      |
| Muted / helper       | `text-[13px] text-muted-foreground`            |
| Numeric (money, IDs) | add `tabular-nums`                             |

Muted text uses the **`text-muted-foreground`** utility, not
`text-[--text-muted]` — the alias exists so shadcn components and ours read the
same.

**Money is never coloured.** Green revenue and red failures make a billing table
look like a stock ticker. Colour lives in the badge; amounts stay neutral, with
`tabular-nums` keeping columns aligned.

Every amount routes through `formatMoney()` in `lib/format.ts`. The API returns
integer cents, and no component may render a raw amount.

---

## 5. Layout and spacing

Use the 4px scale: `1, 2, 3, 4, 6, 8, 12, 16`.

- **App shell** — fixed left sidebar `w-64`, collapsing to a `Sheet` under `md`.
  Content `mx-auto w-full max-w-7xl px-6 py-8 md:px-8`.
- **Page header** — `PageHeader` in `components/patterns.tsx`: title, optional
  description, optional right-aligned action, `mb-6`.
- **Card** — `rounded-xl bg-card ring-1 ring-foreground/10`. A ring rather than a
  border, so it does not occupy layout space and stays even on both themes.
- **Stack rhythm** — `gap-4` between cards, `mb-6` between sections, `gap-1.5`
  between a label and its field.
- **Table** — header `bg-muted`, wrapped in `overflow-x-auto rounded-xl` with
  `min-w-160` inside, so mobile scrolls rather than squashing.

---

## 6. Component conventions

**Buttons** — `default` (sienna `#b85a3c`) for the single primary action per
view; `outline` for secondary; `ghost` for tertiary and table row actions;
`destructive` only for remove, cancel and suspend. Never two sienna buttons in
one view.

Two local patches to shadcn's `Button`, both in `components/ui/button.tsx`: it
defaults to `type="button"` (unpatched, it submits any form it sits in), and
carries `text-foreground` in its base classes (without it, an unlayered `a`
colour rule beat the variant and painted button text teal).

**Forms** — `FormField` in `components/patterns.tsx` places label, control, hint
and error consistently. The hint is *replaced* by the error rather than stacked
above it. Errors are `text-xs text-destructive` with `role="alert"`. Submit is
disabled while pending.

Forms use `react-hook-form` with `zodResolver`, against the schemas in
`lib/schemas.ts`, which mirror the backend's rules exactly. The server remains
the authority — the client copy only saves a round trip and puts the message
against the field.

**Dialogs** — `ConfirmDialog` for every irreversible action. Title states the
action, body states the consequence, primary button repeats the verb ("Remove
member", not "OK"). Dismissal is blocked while the request is in flight.

**Empty states** — one line on what is missing, one on what to do. `DataTable`
distinguishes the empty set from the filtered-empty set, because "no results"
and "no data yet" need different advice.

**Toasts** — `sonner`. Success on every mutation; errors show the backend's
`message` verbatim. Never invent an error string when the API supplied one.

---

## 7. Rules

1. **No colour outside these tokens.** If a value is needed that is not here, ask.
2. **Never encode meaning in colour alone** — always pair with text.
3. **Money is never coloured**, and always goes through `formatMoney()`.
4. **One primary action per view.**
5. **Every status renders through `<StatusBadge>`.** A raw status string in JSX
   is a bug.
6. **WCAG AA (4.5:1) minimum.** Every combination in §1 clears it — do not
   substitute lighter foregrounds.
7. **Motion respects `prefers-reduced-motion`.** Every animation is guarded.

---

## 8. Deviations from the design export

Each of these is deliberate. Nothing else departs from `design/`.

**Button fills use `#b85a3c`, not the brand `#e97451`.** White on the brand
colour measures 2.78:1 and fails AA. The brand colour is retained for the logo,
hero and anything 24px or larger.

**A theme toggle exists.** The export ships a dark variant, and the toggle drives
it by class rather than leaving it to the OS setting.

**Motion is richer than a plain `transition-colors`.** Lenis smooth scrolling,
GSAP with ScrollTrigger for section reveals and count-ups, a CSS 3D cube, and a
four-layer animated gradient with a dot pattern — all added at explicit request,
and all guarded by `prefers-reduced-motion`.

**The landing newsletter field routes to `/register`** with the address
prefilled, and **the contact form composes a `mailto:` draft.** No endpoint backs
either, and a control that silently does nothing is worse than its absence.

**No card-entry screen was built.** The export includes one; real Stripe Checkout
is hosted on Stripe's own domain, so card details never touch this application.
