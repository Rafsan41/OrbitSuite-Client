# OrbitSuite Client — Route Manifest & Build Plan

Third companion file. Read with `CLIENT_BUILD_PROMPT.md` (API contract) and
`DESIGN_SYSTEM.md` (visual rules).

**22 routes. 8 steps. ~7 hours.** Build shared components before pages — that
ordering is what makes the page count achievable.

---

## Route manifest

### Public — `app/(public)`

| Route | File | Purpose | API |
|---|---|---|---|
| `/` | `(public)/page.tsx` | Landing: name, one line of copy, plan cards, login/register links | `GET /plans` |
| `/login` | `(public)/login/page.tsx` | Email + password | `POST /auth/login` |
| `/register` | `(public)/register/page.tsx` | Org name, admin name, email, password, plan pick → auto-redirect to Stripe | `GET /plans`, `POST /auth/register`, `POST /checkout/session` |
| `/forgot-password` | `(public)/forgot-password/page.tsx` | Request a reset link | `POST /auth/forgot-password` |
| `/reset-password` | `(public)/reset-password/page.tsx` | Reads `?token=`, sets new password | `POST /auth/reset-password` |
| `/accept-invite` | `(public)/accept-invite/page.tsx` | Reads `?token=`, sets password, → login | `POST /users/accept-invite` |

### Checkout — `app/checkout`

| Route | File | Purpose | API |
|---|---|---|---|
| `/checkout/success` | `checkout/success/page.tsx` | **Polls until the webhook confirms** — never trusts the redirect | `GET /checkout/status` |
| `/checkout/cancel` | `checkout/cancel/page.tsx` | Payment abandoned, offer retry | — |
| `/checkout/retry` | `checkout/retry/page.tsx` | Landing spot for a `PENDING` org; recreates a session | `GET /checkout/status`, `POST /checkout/session` |

### Platform Admin — `app/(platform)` · role `PLATFORM_ADMIN`

| Route | File | Purpose | API |
|---|---|---|---|
| `/admin` | `(platform)/admin/page.tsx` | Stats: orgs, users, active subs, revenue, failed payments, recent signups, subscribers per plan | `GET /stats` |
| `/admin/organizations` | `(platform)/admin/organizations/page.tsx` | Table + search + status/plan filters | `GET /organizations` |
| `/admin/organizations/[id]` | `(platform)/admin/organizations/[id]/page.tsx` | Profile, members, subscription, payments, transactions; suspend/reactivate | `GET /organizations/:id`, `PATCH .../suspend`, `PATCH .../reactivate` |
| `/admin/plans` | `(platform)/admin/plans/page.tsx` | Table + create/edit dialogs + enable/disable | `GET /plans?includeInactive=true`, `POST /plans`, `PATCH /plans/:id`, `PATCH /plans/:id/{enable,disable}` |
| `/admin/transactions` | `(platform)/admin/transactions/page.tsx` | Platform-wide ledger; org/status/date filters | `GET /transactions/all` |

### Org Admin — `app/(org)` · role `ORG_ADMIN`

| Route | File | Purpose | API |
|---|---|---|---|
| `/org` | `(org)/org/page.tsx` | Org profile: view and edit name, contact email, billing email | `GET /organizations/me`, `PATCH /organizations/me` |
| `/org/members` | `(org)/org/members/page.tsx` | Members table; invite dialog; change role; remove | `GET /users`, `POST /users/invite`, `PATCH /users/:id/role`, `DELETE /users/:id` |
| `/org/subscription` | `(org)/org/subscription/page.tsx` | Current plan, renewal, status; upgrade/downgrade; cancel | `GET /subscriptions/me`, `GET /plans`, `POST /subscriptions/change-plan`, `POST /subscriptions/cancel` |
| `/org/billing` | `(org)/org/billing/page.tsx` | Payment history table with status filter | `GET /payments` |
| `/org/billing/[id]` | `(org)/org/billing/[id]/page.tsx` | Invoice detail: invoiceNumber, org, plan, period, amount | `GET /payments/:id` |
| `/org/transactions` | `(org)/org/transactions/page.tsx` | Own-org ledger with status filter | `GET /transactions` |

### Member — `app/(member)` · role `ORG_MEMBER`

| Route | File | Purpose | API |
|---|---|---|---|
| `/me` | `(member)/me/page.tsx` | Own profile; edit name/email; change password | `GET /users/me`, `PATCH /users/me`, `POST /auth/change-password` |
| `/me/organization` | `(member)/me/organization/page.tsx` | Read-only org name, plan, member count. No financials. | `GET /organizations/me/summary` |

**Note:** `/me` is reachable by every role — Org Admins and Platform Admins need
their own profile too. Link it from the sidebar footer for all roles.

---

## File tree

```
app/
├── layout.tsx                    # root: fonts, QueryProvider, Toaster
├── globals.css                   # design tokens
├── (public)/
│   ├── layout.tsx                # centred card shell, redirects if signed in
│   ├── page.tsx  login/  register/  forgot-password/
│   └── reset-password/  accept-invite/
├── checkout/
│   └── success/  cancel/  retry/
├── (platform)/
│   ├── layout.tsx                # requires PLATFORM_ADMIN
│   └── admin/
│       ├── page.tsx
│       ├── organizations/page.tsx   organizations/[id]/page.tsx
│       ├── plans/page.tsx
│       └── transactions/page.tsx
├── (org)/
│   ├── layout.tsx                # requires ORG_ADMIN + ACTIVE org
│   └── org/
│       ├── page.tsx  members/page.tsx  subscription/page.tsx
│       ├── billing/page.tsx  billing/[id]/page.tsx
│       └── transactions/page.tsx
└── (member)/
    ├── layout.tsx                # any authenticated role
    └── me/page.tsx  me/organization/page.tsx

components/
├── ui/                           # shadcn primitives
├── data-table.tsx                # ← ONE table, used by all 8 table pages
├── states.tsx                    # LoadingState / ErrorState / EmptyState / SkeletonRow
├── status-badge.tsx              # ← ONE badge, 12 status tokens
├── page-header.tsx               # title + optional action
├── app-shell.tsx                 # sidebar + content, collapses under md
├── sidebar-nav.tsx               # role-aware nav items
├── confirm-dialog.tsx            # destructive confirmations
└── form-field.tsx                # label + input + error, RHF-wired

lib/
├── api-client.ts                 # axios, withCredentials, single-flight refresh
├── query-provider.tsx
├── query-keys.ts                 # centralised keys so invalidation is reliable
├── format.ts                     # formatMoney / formatDate / formatRelative
└── schemas.ts                    # zod, mirroring the backend

hooks/
├── use-auth.ts                   # session, login, logout, role helpers
└── use-paginated-query.ts        # page/limit/filter state → query params
```

---

## Step-by-step build plan

Verify each step against the running backend before moving on. Commit after each.
Start the backend first: `cd ../orbitsuite-server && npm run seed && npm run dev`.

### Step 1 — Scaffolding (~45 min)
- `npx shadcn@latest init`; add button, input, label, table, dialog, select,
  badge, card, form, sonner, skeleton, dropdown-menu, sheet.
- Apply the `@theme` tokens from `DESIGN_SYSTEM.md` to `globals.css`.
- `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`.
- Build `lib/api-client.ts`, `lib/format.ts`, `lib/query-keys.ts`,
  `lib/query-provider.tsx`. Wire the provider and `<Toaster />` into the root layout.
- Update `metadata` in `layout.tsx` — it still says "Create Next App".

**Verify:** a throwaway call to `GET /plans` renders three plan names.

### Step 2 — Auth & guards (~1h 15m)
- `hooks/use-auth.ts` on `GET /auth/me`; access token in memory only.
- Pages: login, register, forgot-password, reset-password, accept-invite.
- Group layouts enforcing role; a `PENDING` org routes to `/checkout/retry`.
- 401 → single-flight refresh → retry → otherwise redirect to `/login`.

**Verify:** log in as each of the three roles; confirm each lands on its own home
and is redirected away from the other two areas.

### Step 3 — Shared components (~1h)
- `data-table.tsx`, `states.tsx`, `status-badge.tsx`, `page-header.tsx`,
  `app-shell.tsx`, `sidebar-nav.tsx`, `confirm-dialog.tsx`, `form-field.tsx`.

**Verify:** render `<DataTable>` once with fake rows in all four states —
loading, error, empty, populated. **Do not start pages until this is done.**

### Step 4 — Checkout (~1h)
- Register → `POST /checkout/session` → `window.location.href = checkoutUrl`.
- Success page polls `GET /checkout/status` every 2s, ~30s cap, showing
  "confirming your payment…", then routes to `/org`. Never trusts the redirect.
- Cancel and retry pages.

**Verify:** register a new org, pay with `4242 4242 4242 4242`, watch it flip
`PENDING → ACTIVE`. Requires `stripe listen` running against the backend.

### Step 5 — Org Admin pages (~1h 30m)
Profile, members, subscription, billing, invoice detail, transactions.

**Verify:** invite a member (the link appears in the server console), change a
role, then try removing the last admin — expect a 409 message, not a crash.

### Step 6 — Platform Admin pages (~1h 30m)
Stats, organizations list, org detail, plans, platform transactions.

**Verify:** create a plan and confirm a real `stripePriceId` comes back; suspend
an org and confirm that org can no longer log in.

### Step 7 — Member pages (~30 min)
Own profile, change password, read-only org info.

**Verify:** as a member, confirm billing, members, and subscription pages are
unreachable and the API returns 403 for each.

### Step 8 — Polish & ship (~30 min)
- Responsive pass at 375px: tables scroll, sidebar becomes a sheet.
- Audit every list page for the three states.
- `npm run lint && npm run build` clean. No `any`, no unused imports.

**Verify:** log in as Acme, then as Globex; confirm each sees only its own
members, payments, and transactions. **This is the tenant-isolation demo for the
walkthrough video — rehearse it here.**

---

## Where the time goes wrong

**The tables.** Eight pages need one; writing eight bespoke tables is the single
biggest risk to the timeline. Step 3 exists to prevent exactly that.

**Checkout polling.** It is tempting to show "success" straight off the redirect.
Don't — the redirect proves nothing, and the polling design is directly graded.

**Scope creep.** No dark-mode toggle, no notifications centre, no dashboard charts
beyond the numbers `/stats` already returns. The brief penalises extras.

**If hours run short, cut in this order:** invoice detail page (fold it into a
dialog) → plan editing (keep create and disable) → member panel polish → landing
page copy. **Never cut** the checkout polling or the role guards.
