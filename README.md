# Glow Arena — platform monorepo

**Glow Arena** is a **multi-store venue booking and operations platform** for indoor play and game-room businesses: marketing site, real-time slot catalog, customer accounts, staff tooling, payments ledger, loyalty, and reporting. The canonical product definition lives in the **[Product Requirements Document (PRD)](web/docs/PRODUCT_REQUIREMENTS.md)**. Build status vs that PRD: **[Implementation status](web/docs/IMPLEMENTATION_STATUS.md)**.

**Repository:** [github.com/jvinaymohan/glowarena](https://github.com/jvinaymohan/glowarena)

---

## Platform capabilities by persona

What the codebase is **designed to support** today (v2 platform + legacy marketing flows). Some areas are POC-grade UI until production sign-off; see the PRD and implementation status doc.

| Persona | What they can do in the product |
|---------|----------------------------------|
| **Guest / parent** | Discover venue on marketing pages; **legacy** session booking on `/book` (file-backed, optional); **v2** booking via **`/platform/customer`** with availability, safety/waiver consent, and reservation reference. Legal pages: `/legal/*`. |
| **Customer (logged in)** | Register / sign in; list and paginate **reservations**; **reschedule**; view **Glow Rewards** (punch card, tier, reward coupons) when linked to a store; optional **Razorpay order** flow when `NEXT_PUBLIC_RAZORPAY_ENABLED=1`. Legacy account area: `/account`, `/login`. |
| **Front desk / floor / POS** | Platform admin session; **operations** hub: check-in/out, walk-ins, payments, slot moves, blocks; **time clock** punch in/out; **shift** visibility; role-limited edits. Entry: **`/platform/admin`**. |
| **Store manager** | Store-scoped **calendar**, **arena day**, reservations, coupons/promotions, **staff** hire/update (within RBAC), **shifts** (create/coverage), **payroll** lines, reports and exports for their arenas. |
| **Owner / HQ** | All stores assigned to the user; full **RBAC**; **arena games** (up to **5 active games** per store, pricing/parameters); team and payroll; executive **PDF** / **XLSX** / **CSV** reporting. |
| **Finance** | Payment history and ledger via admin APIs and exports; **salary** rows and mark-paid; GST/invoice depth **P1** per PRD. |
| **Support** | Read-heavy patterns; **tickets** and **incidents** APIs and stubs; scoped by role policy. |

---

## Feature areas (segmented)

| Area | Capabilities |
|------|----------------|
| **Catalog & inventory** | Stores, venues, **games** (duration, ages, capacity, price), **game slots** (open/blocked/closed, online/walk-in/mixed). |
| **Reservations** | Create with conflict checks; lifecycle and **rescheduled** status; customer reschedule; admin **move-slot**; walk-ins share slot capacity. |
| **Payments** | Ledger + manual cash/card/UPI/Razorpay recording in ops; **Razorpay** Orders API + **webhook** (enable for full online pay); customer UI gated by env. |
| **Promotions & coupons** | Admin-managed codes and promotions; validation at booking; **loyalty-issued** coupons after completed visits. |
| **Loyalty** | Per customer, per store: punches, tiers, automatic reward coupon on cycle completion (after check-out); customer API + portal block. |
| **Workforce & ops** | **Shifts** and assignments (duty roles); **time clock**; **staff** accounts with multi-store assignment; **payroll** line items; tickets, incidents, approvals (baseline). |
| **Reporting** | Summary dashboards, **CSV** export, executive **PDF**, **XLSX**; date/window limits per API. |
| **Governance** | Audit log model; JWT sessions (HTTP-only cookies); API-enforced **RBAC**. |
| **Marketing & legacy** | Home, games, combos, birthday, corporate, contact; **legacy** JSON store for `/book` and legacy admin **`/admin`** unless disabled. Set `DISABLE_LEGACY_BOOKING=1` to turn off legacy booking API in production. |

---

## Documentation map (GitHub)

| Document | Use |
|----------|-----|
| [web/docs/PRODUCT_REQUIREMENTS.md](web/docs/PRODUCT_REQUIREMENTS.md) | Full PRD: personas, FR/NFR, journeys, launch criteria. |
| [web/docs/IMPLEMENTATION_STATUS.md](web/docs/IMPLEMENTATION_STATUS.md) | What is done vs remaining; production checklist. |
| [web/docs/DEMO_AND_LAUNCH.md](web/docs/DEMO_AND_LAUNCH.md) | Env vars, demo URLs, safeguards after stress testing. |
| [web/docs/RAZORPAY.md](web/docs/RAZORPAY.md) | Razorpay keys, webhook, Checkout, go-live checklist. |
| [web/README.md](web/README.md) | Local setup, legacy booking deep dive, API tables. |

---

## Run locally

**Database:** PostgreSQL (required for v2). From `web/`:

```bash
docker compose up -d
cp .env.example .env.local # set DATABASE_URL, AUTH_SECRET, etc.
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed           # optional demo store + users
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). **Node:** `>= 20.9.0`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjvinaymohan%2Fglowarena&root-directory=web)

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **PostgreSQL** + **Prisma** (migrations, seeds)
- **Vitest** + **ESLint**; CI: lint, test, build against Postgres

---

## Repository layout

```
glowarena/
├── README.md                      ← platform overview (this file)
├── package.json
└── web/
    ├── README.md                  ← technical / legacy API reference
    ├── docs/
    │   ├── PRODUCT_REQUIREMENTS.md
    │   ├── IMPLEMENTATION_STATUS.md
    │   └── DEMO_AND_LAUNCH.md
    ├── prisma/
    ├── docker-compose.yml
    ├── src/app/                   ← routes + /api/*
    └── ...
```

---

*Venue names, pricing, and legal copy are placeholders until replaced for production. For scope and sign-off, use the PRD.*
