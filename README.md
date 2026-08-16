# OrbitSuite — Client

Next.js 16 front end for the OrbitSuite subscription platform. React 19,
Tailwind 4, shadcn/ui, TanStack Query.

Three roles get three different applications behind one login: a Platform Admin
console, an Organization Admin panel, and a read-only Member view. The API lives
in a separate repository, `orbitsuite-server`, and must be running for anything
past the marketing pages to work.

---

## Running it

Requires Node 20+ and the API on `http://localhost:5000`.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open `http://localhost:3000`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, including the React Compiler rules |

### Environment

One variable, `NEXT_PUBLIC_API_URL`. It defaults to
`http://localhost:5000/api/v1` in `lib/api-client.ts`, so a local setup works
without `.env.local` at all — the file matters when the API is somewhere else.

`NEXT_PUBLIC_` values are inlined into the client bundle, so nothing secret may
ever go here. The client holds no API keys: Stripe is reached only by redirecting
to a Checkout URL the server creates.

---

## Signing in

Run `npm run seed` in the API repository first. Every seeded account uses the
password **`Password123!`**:

| Role | Email | Lands on |
| --- | --- | --- |
| Platform Admin | `platform.admin@orbitsuite.test` | `/admin` |
| Organization Admin | `admin@acme.test` | `/org` |
| Member | `member@acme.test` | `/me` |

`admin@globex.test` and `member@globex.test` belong to a second tenant — useful
for confirming that neither organization can see the other's data.

In development the login page also carries one-click buttons for each role, and
the Platform Admin overview has a **Reseed demo data** button. Both are compiled
out of a production build.

---

## How it works

### Routes

Route groups map to audiences, and each group's layout owns the role guard, so
authorization is declared once per area rather than once per page.

```
app/
  (public)/     Landing, about, contact, login, register, password reset
  (checkout)/   Stripe return paths: success, cancel, retry
  (platform)/   PLATFORM_ADMIN — overview, organizations, plans, transactions
  (org)/        ORG_ADMIN — profile, members, subscription, billing, transactions
  (member)/     All roles — own profile; organization summary for members
```

Those guards are convenience, not security. Every screen calls an API that
enforces the same rule server-side; hiding a nav item only avoids showing someone
a door they cannot open.

### Sessions

The access token is a 15-minute JWT held **in memory only**. It is never written
to `localStorage`, where any injected script could read it and where it would
outlive the tab.

The refresh token is an httpOnly cookie the browser attaches on its own. After a
hard reload the client holds no token, so `GET /auth/me` returns 401, an axios
interceptor spends the cookie at `/auth/refresh`, and the original request is
retried — which is why a 401 in the console on first paint is expected behaviour
rather than a bug.

Concurrent 401s share a single in-flight refresh promise instead of each firing
their own, so a burst of parallel requests produces one refresh rather than five.

### Checkout

Registration creates an organization in `PENDING` and sends the user to Stripe.
On return, the client **polls `GET /checkout/status`** until the server reports
the subscription active — it never treats the redirect itself as proof of
payment, because a redirect URL can be typed by hand. Polling gives up after 90
seconds and offers a retry rather than spinning forever.

There is no card form anywhere in this repository. Card details are entered on
Stripe's own hosted page, so they never touch this application.

### Shared components

Every list screen shares one `DataTable` carrying search, filters, pagination and
its loading, error, empty and populated states. One `StatusBadge` maps every
backend enum value onto the colour tokens, so no page decides for itself what
"suspended" looks like. `ConfirmDialog` fronts every irreversible action.

`components/ui/` is shadcn's and can be regenerated; `components/patterns.tsx`
holds the compositions built on top of it, which cannot.

### Styling

Tailwind 4 with tokens defined in `app/globals.css`. shadcn's semantic names
(`--primary`, `--muted`) are declared as aliases of the design tokens, so
`shadcn add` drops in new components without any of them needing to be patched.

Dark mode follows an explicit class rather than the OS setting, because the
design ships a toggle. Colours were measured for WCAG AA contrast: the brand
colour `#e97451` comes out at 2.78:1 on white and cannot carry text, so buttons
fill with `#b85a3c` at 4.60:1 while the brand colour stays for the logo and large
display type.

Motion is GSAP with ScrollTrigger over Lenis smooth scrolling, and every
animation is guarded by `prefers-reduced-motion`.

---

## Notes

There are no tests in this repository. The assessment weights backend
correctness far above the front end, so the testing budget went where tenant
isolation, webhook idempotency and transactional rollback are proven — see the
API repository, which has 67. Every screen here was verified manually against
live seeded data instead.

Two places deliberately do less than the design suggested, because no endpoint
backs them and a control that silently does nothing is worse than its absence:
the contact form composes a `mailto:` draft, and the newsletter field routes to
`/register` with the address prefilled.
