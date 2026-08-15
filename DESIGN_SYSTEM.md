# OrbitSuite Design System

Companion to `CLIENT_BUILD_PROMPT.md`. Follow this for every visual decision so
the UI reads as one system. **Do not invent colours, spacing values, or component
variants outside this file.**

## Direction

OrbitSuite is billing and admin infrastructure — a control plane, not a consumer
product. Restraint reads as competence when money is on screen. Slate neutrals,
one indigo accent, semantic colour reserved for status.

**The rule that makes it feel designed rather than default: indigo appears only on
primary actions.** Buttons, links, active nav. Never on a status, never as
decoration. When a user sees indigo, it always means "this is the thing to click."

---

brand theme

60% white #FCF2E5
30% orange #E37434
20% teal #007979

## 1. Colour tokens

After `npx shadcn@latest init`, append this to `app/globals.css`. Keep shadcn's
generated variables; these sit alongside them.

```css
@theme {
  /* Accent — primary actions only */
  --color-brand-50: #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;

  /* Status — background / foreground / border triples */
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
}
```

Also override shadcn's primary so buttons pick up the accent:

```css
:root {
  --primary: #4f46e5;
  --primary-foreground: #ffffff;
  --ring: #6366f1;
}
```

Neutrals come from Tailwind's built-in **slate** scale — do not redefine them.
Surfaces `slate-50`, borders `slate-200`, muted text `slate-500`, body text
`slate-900`.

---

## 2. Status mapping — all 12 tokens

The backend exposes 18 status values across five Prisma enums, collapsing to 12
unique tokens. This mapping is exhaustive; every status must resolve.

| Token      | Statuses               | Reasoning                                     |
| ---------- | ---------------------- | --------------------------------------------- |
| `success`  | `ACTIVE`, `SUCCESS`    | Healthy terminal state                        |
| `pending`  | `PENDING`              | In flight, not yet resolved                   |
| `failed`   | `FAILED`               | Something went wrong                          |
| `neutral`  | `CANCELLED`, `REMOVED` | Intentional end-state, **not** an error       |
| `warning`  | `SUSPENDED`            | Admin action, distinct from a payment failure |
| `refund`   | `REFUNDED`             | Money returned — reversal, not failure        |
| `rollback` | `ROLLED_BACK`          | Transaction reversed by the system            |
| `info`     | `INVITED`, `TRIAL`     | Provisional, awaiting the user                |
| `brand`    | `EXPIRED`              | Lapsed period — time-based, not a failure     |

Three choices to preserve:

- **`CANCELLED`/`REMOVED` are grey, not red.** They are intentional outcomes. Red
  makes normal churn look like a system fault.
- **`SUSPENDED` (orange) ≠ `FAILED` (red).** One is an admin action, the other a
  payment problem. They appear side by side on the platform-wide table.
- **`ROLLED_BACK` is rose, adjacent to red but distinct.** It is the status that
  demonstrates the rollback logic works, so it must be visible and separate.

---

## 3. StatusBadge — build exactly this

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
  EXPIRED: "brand",
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
  brand: "bg-brand-50 text-brand-700 border-brand-100",
};
```

Render as `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs
font-semibold`. Label is the status string with underscores replaced by spaces.

**Always render the text label.** Never encode meaning in colour alone — a
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
| Table header         | `text-xs font-medium uppercase tracking-wide text-slate-500` |
| Table cell           | `text-sm`                                                    |
| Muted / helper       | `text-xs text-slate-500`                                     |
| Numeric (money, IDs) | add `tabular-nums`                                           |

**Money is `text-slate-900 tabular-nums`, never coloured.** Green revenue and red
failures make a billing table look like a stock ticker. Colour lives in the badge;
amounts stay neutral. `tabular-nums` keeps columns aligned.

---

## 5. Layout and spacing

Use the 4px scale only: `1, 2, 3, 4, 6, 8, 12, 16`. No arbitrary values.

- **App shell**: fixed left sidebar `w-60`, collapsing to a sheet under `md`.
  Content `max-w-7xl mx-auto px-4 md:px-8 py-8`.
- **Page header**: title plus optional action button, `mb-6`, action right-aligned.
- **Card**: `rounded-lg border border-slate-200 bg-white p-6`. No shadow beyond
  `shadow-sm`. No gradients anywhere.
- **Stack rhythm**: `space-y-6` between sections, `space-y-4` inside a card,
  `space-y-2` between a label and its field.
- **Table**: header `bg-slate-50`, rows `border-b border-slate-100`, hover
  `hover:bg-slate-50`, cells `px-4 py-3`. Wrap in `overflow-x-auto` so mobile
  scrolls rather than squashing.

---

## 6. Component conventions

**Buttons** — `default` (indigo) for the single primary action per view;
`outline` for secondary; `ghost` for tertiary and table row actions; `destructive`
only for remove and cancel. Never two indigo buttons in one view.

**Forms** — label above input, helper text below, error text below in
`text-xs text-red-600`. Inputs full width within their container. Submit disabled
while pending, with an inline spinner.

**Dialogs** — for create, edit, invite, and destructive confirmation. Title states
the action, body states the consequence, primary button repeats the verb
("Remove member", not "OK").

**Empty states** — one line on what is missing, one on what to do, plus the
primary action if there is one. No illustrations.

**Toasts** — `sonner`. Success on every mutation; errors show the backend's
`message` field verbatim. Never invent an error string when the API supplied one.

---

## 7. Rules

1. **No colour outside these tokens.** If a value is needed that is not here, ask.
2. **Never encode meaning in colour alone** — always pair with text.
3. **Money is never coloured.**
4. **One primary action per view.**
5. **No gradients, no shadow beyond `shadow-sm`, no animation beyond
   `transition-colors`.** The brief penalises unrequested polish, and dense tables
   need calm surfaces.
6. **Every status renders through `<StatusBadge>`.** A raw status string in JSX is
   a bug.
7. **WCAG AA (4.5:1) minimum.** Every combination above already clears it on
   white — do not substitute lighter foregrounds.
