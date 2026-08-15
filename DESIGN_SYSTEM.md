# OrbitSuite Design System

Companion to `CLIENT_BUILD_PROMPT.md`. Follow this for every visual decision so
the UI reads as one system. **Do not invent colours, spacing values, or component
variants outside this file.**

## Source of truth

The visual design already exists: `design/OrbitSuite.dc.html` (every screen) and
`design/DataTable.dc.html` (the table). These are Claude Design exports â€”
templating markup (`<sc-if>`, `<sc-for>`, `{{ }}`), not runnable React. **Read
them for layout, copy and spacing, then implement in React.** Open in a browser to
view; `support.js` must stay beside them.

They live in `design/`, not `public/` â€” `public/` is served verbatim at the site
root, so design source there would ship to end users.

## Brand

```
60%  cream       #FCF2E5   page background
30%  terracotta  #E37434   primary actions, brand presence
10%  teal        #007979   links, secondary actions, active nav
```

**Terracotta and teal never appear on the same element.** Terracotta is "act on
this"; teal is "navigate to this". One primary terracotta button per view.

**The 60/30/10 split applies to the marketing landing page, not the app chrome.**
Thirty percent terracotta across a billing table would be unreadable. Inside the
product: cream page, white cards, terracotta reserved for the single primary
action, teal for links and the active nav item. The brand still reads clearly
because nothing else competes with it.

---

## 1. Colour tokens

Neutrals are **warm** (`stone`, not `slate`) â€” cold greys look dirty against a
cream background. Put the surface variables in `:root` so design markup can be
transcribed using the same `var(--*)` names, and the scales in `@theme` for
Tailwind utilities.

```css
:root {
  --page-bg:     #fcf2e5; /* cream â€” the 60% */
  --surface:     #ffffff; /* cards sit on the cream */
  --surface-alt: #fffbf5;
  --text:        #1c1917;
  --text-soft:   #44403c;
  --text-muted:  #78716c;
  --border:      #ebdfce; /* warm, derived from the cream */
  --border-soft: #f5eadb;
}

/* The design ships a dark variant. Support it via prefers-color-scheme only â€”
   do NOT build a theme toggle, that is unrequested scope. */
@media (prefers-color-scheme: dark) {
  :root {
    --page-bg:     #1c1917;
    --surface:     #292524;
    --surface-alt: #211d1b;
    --text:        #fafaf9;
    --text-soft:   #d6d3d1;
    --text-muted:  #a8a29e;
    --border:      #44403c;
    --border-soft: #292524;
  }
}

@theme {
  /* Terracotta â€” the 30%. Primary actions. */
  --color-brand-50:  #fcf2e5;
  --color-brand-100: #fde8d6;
  --color-brand-200: #fbd8b8;
  --color-brand-300: #f6cba8;
  --color-brand-500: #e37434; /* brand colour: fills, logo, large text */
  --color-brand-600: #b85a24; /* button fill â€” WCAG AA with white text */
  --color-brand-700: #99491c; /* hover / active */

  /* Teal â€” the 10%. Links, secondary actions, active nav. */
  --color-accent-50:  #e6f2f2;
  --color-accent-100: #cce5e5;
  --color-accent-200: #a9d8d6;
  --color-accent-600: #007979;
  --color-accent-700: #005c5c;

  /* Status â€” background / foreground / border triples */
  --color-status-success-bg: #ecfdf5;
  --color-status-success-fg: #047857;
  --color-status-success-border: #a7f3d0;

  --color-status-pending-bg: #fffbeb;
  --color-status-pending-fg: #b45309;
  --color-status-pending-border: #fde68a;

  --color-status-failed-bg: #fef2f2;
  --color-status-failed-fg: #b91c1c;
  --color-status-failed-border: #fecaca;

  --color-status-neutral-bg: #f8fafc;
  --color-status-neutral-fg: #475569;
  --color-status-neutral-border: #cbd5e1;

  --color-status-warning-bg: #fff7ed;
  --color-status-warning-fg: #c2410c;
  --color-status-warning-border: #fed7aa;

  --color-status-refund-bg: #f5f3ff;
  --color-status-refund-fg: #6d28d9;
  --color-status-refund-border: #ddd6fe;

  --color-status-rollback-bg: #fff1f2;
  --color-status-rollback-fg: #9f1239;
  --color-status-rollback-border: #fecdd3;

  --color-status-info-bg: #f0f9ff;
  --color-status-info-fg: #0369a1;
  --color-status-info-border: #bae6fd;

  --color-status-expired-bg: #e6f2f2;
  --color-status-expired-fg: #005c5c;
  --color-status-expired-border: #a9d8d6;
}
```

Also override shadcn's primary and ring:

```css
:root {
  --primary: #b85a24;
  --primary-foreground: #ffffff;
  --ring: #007979;
}
```

### Contrast â€” measured, not assumed

| Combination | Ratio | Verdict |
|---|---|---|
| White on `#e37434` | **3.08:1** | âœ— fails AA for 14px text |
| White on `#b85a24` | **4.67:1** | âœ“ passes AA |
| White on `#007979` | **5.25:1** | âœ“ passes AA |
| `#007979` on cream | **4.75:1** | âœ“ passes AA â€” teal links are safe |
| `#e37434` on cream | **2.79:1** | âœ— never use terracotta as body text |

So: **`#e37434` is the brand colour, `#b85a24` is the button fill.** Use `#e37434`
for the logo, hero headings, illustration blocks, and anything 24px or larger.
Use `#b85a24` wherever white label text sits on top of it. The design files use
`#e37434` for button fills â€” this is the one place to deviate from them.

---

## 2. Status mapping â€” all 12 tokens

The backend exposes 18 status values across five Prisma enums, collapsing to 12
unique tokens. This mapping is exhaustive; every status must resolve.

| Token      | Statuses               | Reasoning                                     |
| ---------- | ---------------------- | --------------------------------------------- |
| `success`  | `ACTIVE`, `SUCCESS`    | Healthy terminal state                        |
| `pending`  | `PENDING`              | In flight, not yet resolved                   |
| `failed`   | `FAILED`               | Something went wrong                          |
| `neutral`  | `CANCELLED`, `REMOVED` | Intentional end-state, **not** an error       |
| `warning`  | `SUSPENDED`            | Admin action, distinct from a payment failure |
| `refund`   | `REFUNDED`             | Money returned â€” reversal, not failure        |
| `rollback` | `ROLLED_BACK`          | Transaction reversed by the system            |
| `info`     | `INVITED`, `TRIAL`     | Provisional, awaiting the user                |
| `expired`  | `EXPIRED`              | Lapsed period â€” time-based, not a failure     |

Three choices to preserve:

- **`CANCELLED`/`REMOVED` are grey, not red.** They are intentional outcomes. Red
  makes normal churn look like a system fault.
- **`SUSPENDED` (orange) â‰  `FAILED` (red).** One is an admin action, the other a
  payment problem. They appear side by side on the platform-wide table.
- **`ROLLED_BACK` is rose, adjacent to red but distinct.** It is the status that
  demonstrates the rollback logic works, so it must be visible and separate.

---

## 3. StatusBadge â€” build exactly this

`components/status-badge.tsx`. One component, one lookup. No per-page colour
decisions anywhere else in the app.

```tsx
const STATUS_TOKENS = {
  ACTIVE: "success",
  SUCCESS: "success",
  PENDING: "pending",
  FAILED: "failed",
  CANCELLED: "neutral",
  REMOVED: "neutral",
  SUSPENDED: "warning",
  REFUNDED: "refund",
  ROLLED_BACK: "rollback",
  INVITED: "info",
  TRIAL: "info",
  EXPIRED: "expired",
} as const;

const TOKEN_CLASSES: Record<string, string> = {
  success:
    "bg-[--color-status-success-bg] text-[--color-status-success-fg] border-[--color-status-success-border]",
  pending:
    "bg-[--color-status-pending-bg] text-[--color-status-pending-fg] border-[--color-status-pending-border]",
  failed:
    "bg-[--color-status-failed-bg] text-[--color-status-failed-fg] border-[--color-status-failed-border]",
  neutral:
    "bg-[--color-status-neutral-bg] text-[--color-status-neutral-fg] border-[--color-status-neutral-border]",
  warning:
    "bg-[--color-status-warning-bg] text-[--color-status-warning-fg] border-[--color-status-warning-border]",
  refund:
    "bg-[--color-status-refund-bg] text-[--color-status-refund-fg] border-[--color-status-refund-border]",
  rollback:
    "bg-[--color-status-rollback-bg] text-[--color-status-rollback-fg] border-[--color-status-rollback-border]",
  info: "bg-[--color-status-info-bg] text-[--color-status-info-fg] border-[--color-status-info-border]",
  expired:
    "bg-[--color-status-expired-bg] text-[--color-status-expired-fg] border-[--color-status-expired-border]",
};
```

`EXPIRED` uses teal rather than terracotta on purpose: terracotta is the primary
action colour and must never appear as a status, or a badge starts looking like a
button. Teal is the only brand hue not otherwise spoken for in the status set.

Render as `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs
font-semibold`. Label is the status string with underscores replaced by spaces.

**Always render the text label.** Never encode meaning in colour alone â€” a
greyscale screenshot of the submission must still be readable.

---

## 4. Typography

Keep the `Geist` font already wired in `layout.tsx`. One scale, no exceptions:

| Use                  | Classes                                                      |
| -------------------- | ------------------------------------------------------------ |
| Page title           | `text-2xl font-semibold tracking-tight`                      |
| Section heading      | `text-lg font-semibold`                                      |
| Card title           | `text-sm font-semibold`                                      |
| Body                 | `text-sm`                                                    |
| Table header         | `text-xs font-medium uppercase tracking-wide text-[--text-muted]` |
| Table cell           | `text-sm`                                                    |
| Muted / helper       | `text-xs text-[--text-muted]`                                     |
| Numeric (money, IDs) | add `tabular-nums`                                           |

**Money is `text-[--text] tabular-nums`, never coloured.** Green revenue and red
failures make a billing table look like a stock ticker. Colour lives in the badge;
amounts stay neutral. `tabular-nums` keeps columns aligned.

---

## 5. Layout and spacing

Use the 4px scale only: `1, 2, 3, 4, 6, 8, 12, 16`. No arbitrary values.

- **App shell**: fixed left sidebar `w-60`, collapsing to a sheet under `md`.
  Content `max-w-7xl mx-auto px-4 md:px-8 py-8`.
- **Page header**: title plus optional action button, `mb-6`, action right-aligned.
- **Card**: `rounded-lg border border-[--border] bg-[--surface] p-6`. No shadow beyond
  `shadow-sm`. No gradients anywhere.
- **Stack rhythm**: `space-y-6` between sections, `space-y-4` inside a card,
  `space-y-2` between a label and its field.
- **Table**: header `bg-[--page-bg]`, rows `border-b border-[--border-soft]`, hover
  `hover:bg-[--page-bg]`, cells `px-4 py-3`. Wrap in `overflow-x-auto` so mobile
  scrolls rather than squashing.

---

## 6. Component conventions

**Buttons** â€” `default` (indigo) for the single primary action per view;
`outline` for secondary; `ghost` for tertiary and table row actions; `destructive`
only for remove and cancel. Never two indigo buttons in one view.

**Forms** â€” label above input, helper text below, error text below in
`text-xs text-red-600`. Inputs full width within their container. Submit disabled
while pending, with an inline spinner.

**Dialogs** â€” for create, edit, invite, and destructive confirmation. Title states
the action, body states the consequence, primary button repeats the verb
("Remove member", not "OK").

**Empty states** â€” one line on what is missing, one on what to do, plus the
primary action if there is one. No illustrations.

**Toasts** â€” `sonner`. Success on every mutation; errors show the backend's
`message` field verbatim. Never invent an error string when the API supplied one.

---

## 7. Rules

1. **No colour outside these tokens.** If a value is needed that is not here, ask.
2. **Never encode meaning in colour alone** â€” always pair with text.
3. **Money is never coloured.**
4. **One primary action per view.**
5. **No gradients, no shadow beyond `shadow-sm`, no animation beyond
   `transition-colors`.** The brief penalises unrequested polish, and dense tables
   need calm surfaces.
6. **Every status renders through `<StatusBadge>`.** A raw status string in JSX is
   a bug.
7. **WCAG AA (4.5:1) minimum.** Every combination above already clears it on
   white â€” do not substitute lighter foregrounds.

