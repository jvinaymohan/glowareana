# Glow Arena — prototype reference

Next.js app for marketing, **live slot booking** (file-backed), **combo pricing**, **coupons**, **birthday enquiries** with optional **full-day venue hold**, and an **admin dashboard**. Use this doc when testing with stakeholders.

**Repository:** [github.com/jvinaymohan/glowarena](https://github.com/jvinaymohan/glowarena)

## Quick start

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Dev server uses webpack (`npm run dev`) for stable HMR.

```bash
npm run build   # production build
npm run start   # serve on port 3000 (after build)
```

**Node:** `>= 20.9.0`

---

## Data & persistence

| Item | Location |
|------|----------|
| Bookings, blocks, birthday requests | `web/data/arena-store.json` |
| Created automatically | On first read/write |

The file is **gitignored** so local test data is not committed. Delete it anytime to reset.

**Serverless / read-only FS:** JSON writes will fail. For production, replace the store with a database or hosted KV.

---

## Environment

Create `web/.env.local` (optional):

| Variable | Effect |
|----------|--------|
| `ADMIN_SECRET` | If set, admin **GET/POST/PATCH/DELETE** APIs require header `x-admin-secret: <same value>` (or `Authorization: Bearer …`). If **unset**, admin APIs are **open** (fine for local demos). |

The `/admin` UI stores the secret in **localStorage** (`glowArenaAdminSecret`) after you type it and save — handy when `ADMIN_SECRET` is set.

---

## Public pages (marketing + flows)

| Route | What it does |
|-------|----------------|
| `/` | Home, games teaser, birthday/corporate CTAs, map placeholder |
| `/games` | All games, detail copy, link to book |
| `/combos` | **ComboBuilder** — pick 2–5 games, tiered % discount, optional coupon, link to book (no server save) |
| `/birthday` | Packages + **BirthdayPartyPlanner** — POSTs to API, optional **reserve full day** for public booking |
| `/corporate` | Positioning + **LeadForm** (client-only; does not POST) |
| `/contact` | **LeadForm** (client-only) |
| `/book` | **BookingPrototype** — 4-step flow, live availability, coupons, POST booking |
| `/book?game=floor-is-lava` | Same flow with game pre-selected (any valid `games[].slug`) |

**Lead forms:** Submit shows a thank-you state only — **no email/CRM** wired (stated in UI).

---

## Booking flow (`/book`)

1. **Game** — one lane per game; each game has `maxKidsPerSession` (see `src/lib/site.ts`).
2. **Kids** — count clamped to game limit.
3. **Date & time** — next 7 days; slots from `src/lib/booking.ts` (15 min play + 5 min reset, 10:00–last start 19:40). Fetches **`GET /api/bookings/availability`**. Unavailable reasons: **booked**, **admin blocked**, **birthday hold** (whole day).
4. **Waiver + details + coupon** — optional coupon; **Confirm** → **`POST /api/bookings`** → reference like `GA-XXXXXXXX`.

**Coupons** (prototype table in `src/lib/coupons.ts`): `GLOW10`, `ARENA15`, `FLAT50`, `FLAT100`, `KIDSFUN20` (shown in UI). Codes are normalized to uppercase.

**Payments:** Simulated only — no gateway.

**Known limitations (acceptable for prototype):**

- Server trusts **subtotal / discount / payable** from the client — recalc on server before production.
- No optimistic locking — two users could rarely race on the same slot; second POST gets an error.

---

## Birthday flow (`/birthday`)

- Builds a **combo** (size + games) + optional **return gifts** (fee per kid in `src/lib/birthday-config.ts`).
- **`POST /api/birthday-requests`** (public, no admin secret).
- If **preferred date** is valid (`YYYY-MM-DD`) and **“Reserve venue”** is on (default), `blocksPublicSlots` is true → **all public slot booking** for that calendar day returns **birthday hold** (all games).

Admin can toggle hold per request via dashboard (PATCH).

---

## Admin (`/admin`)

After load (and secret if required):

- **Date range** — filters bookings, blocks, birthday list.
- **Stats** — separate from/to for revenue summary (`GET /api/admin/stats`).
- **Slot blocks** — block one game + date + slot (`POST /api/blocks`), remove (`DELETE /api/blocks?id=`).
- **Birthday requests** — table + **Venue hold** toggle (`PATCH /api/birthday-requests`).
- **Bookings table** — upcoming filter, **Export CSV**.

---

## API summary

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/bookings/availability?game=&date=` | No | Slot list + `birthdayPartyHold` |
| POST | `/api/bookings` | No | Create booking |
| GET | `/api/bookings?from=&to=&game=` | Admin if secret set | List bookings |
| GET/POST | `/api/blocks` | Admin if secret set | List / add blocks |
| DELETE | `/api/blocks?id=` | Admin if secret set | Remove block |
| GET | `/api/admin/stats?from=&to=` | Admin if secret set | Revenue / counts |
| GET/POST | `/api/birthday-requests` | GET: admin; POST: public | List / create |
| PATCH | `/api/birthday-requests` | Admin | Toggle `blocksPublicSlots` |

---

## Suggested test checklist

1. **Booking:** Complete `/book` → confirm **reference** → see row in `/admin`.
2. **Slot conflict:** Book a slot twice (two browsers) → second should **400** with friendly error.
3. **Admin block:** Block a slot → it disappears from availability for that game/date.
4. **Birthday hold:** Submit birthday with date + reserve on → `/book` that day shows **full-day hold**; toggle off in admin → slots return.
5. **Coupon:** Apply `GLOW10` on `/book` → totals and stored booking discount look right.
6. **Combos:** `/combos` pricing matches birthday combo logic for same selection (same `combo-pricing` module).
7. **Secret:** Set `ADMIN_SECRET`, restart dev → `/admin` fails until secret saved → then works.

---

## Key source files

- `src/lib/site.ts` — venue copy, **games**, prices, `maxKidsPerSession`
- `src/lib/booking.ts` — slot generation, schedule rules
- `src/lib/arena-store.ts` — JSON read/write, booking/block/birthday rules, stats
- `src/lib/combos.ts`, `combo-pricing.ts` — combo discounts
- `src/lib/coupons.ts` — coupon definitions
- `src/lib/admin-auth.ts` — admin gate
- `src/components/BookingPrototype.tsx`, `BirthdayPartyPlanner.tsx`, `ComboBuilder.tsx`, `AdminDashboard.tsx`

---

## Brand assets

- Logo: `public/glow-arena-logo.png`
- Neon theme tokens: `src/app/globals.css` (`:root` + `.ga-*` utilities)
