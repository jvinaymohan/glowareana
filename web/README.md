# Glow Arena — web application

Next.js app: **public marketing**, **platform v2** (PostgreSQL, Prisma, multi-store ops), and optional **legacy** file-backed booking for `/book` and `/admin`. Mobile-first UI (touch targets, safe areas, beta banner).

**Repository:** [github.com/jvinaymohan/glowarena](https://github.com/jvinaymohan/glowarena)

---

## Product docs (GitHub)

| Doc | Description |
|-----|-------------|
| [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) | Full **PRD** (personas, functional requirements, launch criteria). |
| [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) | **Done vs remaining** vs PRD; production checklist. |
| [docs/DEMO_AND_LAUNCH.md](docs/DEMO_AND_LAUNCH.md) | Environment variables, demo URLs, rate limits / report caps. |
| [docs/RAZORPAY.md](docs/RAZORPAY.md) | **Razorpay:** keys, webhook, Checkout, troubleshooting. |
| [../README.md](../README.md) | **Repo overview** with persona × capability tables. |

---

## What the platform supports (by persona)

Summarizes **v2** + **legacy** routes. RBAC and store scoping are enforced on **`/api/v2/admin/*`** and **`/api/v2/customer/*`**.

### Guest / parent (not logged in)

- Marketing: `/`, `/games`, `/combos`, `/birthday`, `/corporate`, `/contact`, legal `/legal/*`.
- **Legacy** booking wizard: `/book` (JSON store + `POST /api/bookings`) unless `DISABLE_LEGACY_BOOKING=1`.
- **v2** public catalog: `GET /api/v2/public/stores`, `GET /api/v2/public/availability`.

### Customer (logged in, v2)

- **Portal:** `/platform/customer` — auth, load availability by date, create **reservation**, list/reservations with pagination, **loyalty** summary, optional **pay online** when `NEXT_PUBLIC_RAZORPAY_ENABLED=1`.
- **APIs:** `/api/v2/customer/auth/*`, `reservations`, `loyalty`, `payments/razorpay/order`, etc.

### Front desk, floor supervisor, cash / POS

- **Hub:** `/platform/admin` → operations, calendar, arena day.
- **Check-in/out**, walk-ins, record payments, move slot, block slots (per RBAC).
- **Time clock:** punch in/out; **shifts:** view coverage; managers/owners create or delete shifts.
- **Staff page:** `/platform/admin/staff` — time clock tab; schedule tab (assignments, “mine” filter).

### Store manager

- Everything front desk has, plus **store-scoped** reporting, coupons/promotions, **hire/update staff** (within role rules), **schedule shifts**, **payroll** lines, **arena games** edit (up to **5 active** games per store).

### Owner / HQ

- **Multi-store** access when linked; full **games** catalog control per arena; **team & payroll**; **executive** exports (PDF/XLSX); dashboard and reports.

### Finance / support (baseline)

- **Finance:** ledger visibility via admin APIs and exports; **salary** records and mark-paid in staff hub.
- **Support:** tickets/incidents/approvals APIs and POC surfaces; dangerous actions limited by role.

---

## Feature modules (v2)

| Module | Highlights |
|--------|------------|
| **Identity** | Platform admin JWT (`/api/v2/admin/auth/*`); customer JWT (`/api/v2/customer/auth/*`). |
| **Catalog** | Stores, venues, games, slots; slot modes; **max 5 active games** per store (admin games API). |
| **Reservations** | Conflict handling, reschedule, admin move-slot, walk-ins, booking types for reporting. |
| **Payments** | Ledger, manual methods, Razorpay order + webhook when configured. |
| **Loyalty** | Punches, tiers, reward coupons on check-out (idempotent). |
| **Workforce** | Staff CRUD (multi-store), shifts, time clock, payroll rows. |
| **Reporting** | Summary, CSV, PDF, XLSX (window/row limits documented in DEMO_AND_LAUNCH). |

---

## Quick start (PostgreSQL)

From **`web/`**:

```bash
docker compose up -d
cp .env.example .env.local # set DATABASE_URL, AUTH_SECRET, ADMIN_SECRET, etc.
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed          # optional: KORA store + demo users
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default **`npm run dev`** uses **webpack**; **`npm run dev:turbo`** uses Turbopack.

```bash
npm run build   # production build
npm run start   # serve on port 3000
```

**Node:** `>= 20.9.0`

---

## Data & persistence

| Layer | Location | Notes |
|-------|----------|--------|
| **Platform v2** | PostgreSQL via `DATABASE_URL` | Source of truth for reservations, catalog, loyalty, staff, shifts, ledger. |
| **Legacy booking** | `web/data/arena-store.json` (gitignored) | Used by `/book`, legacy `/admin`, and `POST /api/bookings` unless disabled. |

For production, use **Postgres only** for v2 and set **`DISABLE_LEGACY_BOOKING=1`** when legacy paths are retired.

---

## Environment

Create **`web/.env.local`**. Copy from **[`.env.example`](.env.example)**.

Important variables include: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_SECRET`, `DISABLE_LEGACY_BOOKING`, `NEXT_PUBLIC_SITE_URL`, optional `NEXT_PUBLIC_RAZORPAY_ENABLED` and Razorpay keys. Full tables: **[`.env.example`](.env.example)** and **[docs/DEMO_AND_LAUNCH.md](docs/DEMO_AND_LAUNCH.md)**.

---

## Legacy: customer accounts (`/login`, `/account`)

- **`/login`** — Sign in / create account; session cookie; `?next=/path`, `?mode=signup`.
- **`/register`** — Redirects to `/login?mode=signup`.
- **`/account`** — Bookings linked to account; reschedule via **`PATCH /api/bookings/[id]`** (legacy API).

---

## Legacy: public marketing + `/book`

| Route | Role |
|-------|------|
| `/` | Home |
| `/games`, `/combos`, `/birthday`, `/corporate`, `/contact` | Marketing + forms |
| `/book` | **BookingPrototype** — guest gate, game/kids/date/confirm; **`POST /api/bookings`** |

Coupons (legacy): e.g. `GLOW10`, `ARENA15` in `src/lib/coupons.ts`. **Payments:** simulated on legacy path (no gateway in that flow).

**Known limitations (legacy):** rare slot race (second POST **400**); rate limits on booking/birthday POSTs.

---

## Legacy: admin (`/admin`)

- **`/admin/login`** when `ADMIN_SECRET` set.
- Bookings, blocks, birthdays, stats, CSV export — backed by **`arena-store.json`**.

---

## API summary (legacy — file store)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/bookings/availability?game=&date=` | No | Slots + birthday hold flag |
| POST | `/api/bookings` | No | Create booking (rate-limited); disabled if `DISABLE_LEGACY_BOOKING=1` |
| GET | `/api/bookings?from=&to=&game=` | Admin if secret | List |
| GET/POST | `/api/blocks` | Admin | Blocks |
| DELETE | `/api/blocks?id=` | Admin | Remove block |
| GET | `/api/admin/stats?from=&to=` | Admin | Stats |
| POST | `/api/admin/login` | No | Admin session |
| POST | `/api/admin/logout` | No | Clear session |
| GET/POST/PATCH | `/api/birthday-requests` | Mixed | Birthday enquiries |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | No | Customer session |
| GET | `/api/auth/me` | No | Current user |
| GET | `/api/my/bookings` | Session | User bookings |
| PATCH | `/api/bookings/[id]` | Session | Reschedule |

**v2 APIs** are under **`/api/v2/public/*`**, **`/api/v2/customer/*`**, **`/api/v2/admin/*`**, **`/api/v2/payments/*`** — see PRD §7 and source under `src/app/api/v2/`.

---

## Suggested test checklist

1. **v2:** `docker compose up` → migrate → seed → `/platform/customer` book flow → `/platform/admin` check-in/out.
2. **Legacy booking:** `/book` guest flow → row in `/admin` (if legacy enabled).
3. **Razorpay:** only with keys + `NEXT_PUBLIC_RAZORPAY_ENABLED=1`.
4. **Beta banner:** dismiss persistence; `NEXT_PUBLIC_SHOW_BETA_BANNER=0`.

---

## Key source files

- **Platform:** `src/lib/platform/*`, `prisma/schema.prisma`, `src/app/api/v2/**`
- **Legacy:** `src/lib/arena-store.ts`, `src/lib/booking.ts`, `src/components/BookingPrototype.tsx`, `src/components/AdminDashboard.tsx`
- **Shared:** `src/lib/site.ts`, `src/components/SiteHeader.tsx`, `SiteFooter.tsx`, `SiteLogo.tsx`

---

## Brand assets

- Logo: `public/glow-arena-logo.png`
- Theme: `src/app/globals.css`
