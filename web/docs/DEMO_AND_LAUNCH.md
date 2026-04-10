# Demo & launch checklist (Glow Arena web)

## Quick demo URLs (local: `npm run dev`)

| Area | URL | Notes |
|------|-----|--------|
| Marketing site | `/` | Public pages, book CTA |
| **Admin sign-in** | `/admin/login` | Platform (email/password) + optional legacy `ADMIN_SECRET` |
| **Platform admin** | `/platform/admin` | Operations POC (requires platform session) |
| **Reports** | `/platform/admin/reports` | Default range ~102 days; CSV for full extracts |
| **Customer portal** | `/platform/customer` | Loads store `KORA` from `/api/v2/public/stores` |
| Legacy file admin | `/admin` | If `ADMIN_SECRET` set |

## Environment (production / staging)

Set at minimum:

- `AUTH_SECRET` — JWT signing (required in production).
- `DATABASE_URL` — **PostgreSQL** (required). Local: `docker compose up -d` in `web/` then copy URL from `.env.example`.
- `DISABLE_LEGACY_BOOKING=1` — disables legacy `POST /api/bookings` (use v2 customer APIs only).
- `ADMIN_SECRET` — platform admin password in production; also gates legacy `/admin` + second form on `/admin/login`.
- `NEXT_PUBLIC_SITE_URL` — canonical site URL for SEO.

**Razorpay:** step-by-step Dashboard, webhook, env, and testing — **[RAZORPAY.md](./RAZORPAY.md)**.

## Stress / QA data

- `npm run prisma:seed` — roles, store **KORA**, demo users, sample games/slots.
- `npm run prisma:seed:stress` — **3,000** `RSV-ST-*` bookings (61 days).
- **Public booking** hides stress games (`gameId` prefix `stress-`). Internal QA: `GET /api/v2/public/availability?...&includeStress=1`.

## API safeguards (post–stress-test)

- **Admin reservations list:** paginated (`limit` default 100, max 500; `offset`). Default date window **today → +90 days** if `from`/`to` omitted.
- **Customer reservations:** paginated (default 50, max 200).
- **Reports summary:** max **120-day** window; occupancy table capped at **500** rows (use CSV for full data).
- **CSV export:** max **400-day** window.
- **Conflict model:** overlapping bookings allowed on **different** `gameSlotId` (parallel games); same slot or legacy no-slot still exclusive.

## Launch order

1. Migrate DB to Postgres; run `prisma migrate deploy`.
2. Configure secrets and Razorpay (test → live).
3. Register webhook: `https://<host>/api/v2/payments/razorpay/webhook`.
4. Smoke: admin login → reports → CSV; customer login → availability → book.
5. Remove or avoid running `prisma:seed:stress` on production (or keep stress IDs out of public availability as implemented).

## Demo accounts (after `prisma:seed`)

- Platform admin: `owner@glowarena.local` / `Password123!` (and other seeded roles; see `prisma/seed.ts`).
- Customer: `customer@glowarena.local` / `Password123!`.
- Additional owner: `adminglowarena@glowarena.local` / (password set in seed).

Rotate all passwords before any public exposure.
