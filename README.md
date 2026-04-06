# Glow Arena

**Glow Arena** is a premium **indoor interactive game zone** concept (Koramangala, Bangalore). This repository is a **working prototype**: a neon-themed marketing site plus real booking-style flows, combo math, coupon checkout simulation, birthday party enquiries with venue scheduling rules, and an internal admin view — all wired to a simple file-backed data store so you can demo end-to-end behaviour on a laptop.

**Purpose of the prototype:** validate UX with stakeholders (families, party planners, ops), test slot logic and “birthday vs public booking” precedence, and show how admin tools could sit beside a future payment gateway and database.

**Repository (public):** [github.com/jvinaymohan/glowareana](https://github.com/jvinaymohan/glowareana) · `git clone https://github.com/jvinaymohan/glowareana.git`

**Detailed technical reference** (API tables, env vars, test checklist): [web/README.md](web/README.md)

---

## What’s implemented (prototype scope)

### Marketing & content pages

- **Home (`/`)** — Hero, brand tagline (“Light Up Your Play”), games preview grid, birthday / corporate callouts, “why us” list, placeholder reviews section, embedded map placeholder, neon visual system aligned with logo.
- **Games (`/games`)** — Full list of attractions with descriptions, durations, age notes, pricing copy, safety blurbs, and links into booking.
- **Combos (`/combos`)** — Interactive **combo builder**: choose pass size (2–5 games), tiered **percentage discounts** by size, pick distinct games, per-person and group totals, optional **coupon** on the group total, link to book (pricing is client-side; not saved as a “combo booking” on the server).
- **Birthday (`/birthday`)** — Package-style copy plus **Birthday Party Planner**: kid count bounds, combo size + game selection, optional **return gifts** (flat fee per child from config), contact fields, preferred date, notes; submits a **stored enquiry** via API.
- **Corporate (`/corporate`)** — Positioning copy and a **lead form** (UI only — shows success state; **no** server or email integration).
- **Contact (`/contact`)** — Same **lead form** pattern (prototype acknowledgement only).
- **Book (`/book`)** — Full **session booking wizard** (see below). Supports **`?game=<slug>`** to pre-select an attraction (e.g. `floor-is-lava`).

### Session booking flow (`/book`)

Multi-step flow backed by **live server state**:

1. **Choose game** — Each game has its own “lane,” **list price per person (INR)**, and **max kids per 15-minute session** (defined in `web/src/lib/site.ts`).
2. **Kids count** — Validated against that game’s session cap.
3. **Date & time** — Next **7 days**; slots generated from venue rules: **15 minutes play + 5 minutes reset**, start times from **10:00** through last start **19:40** (`web/src/lib/booking.ts`). Availability comes from **`GET /api/bookings/availability`** and reflects:
   - slots already **booked**,
   - **admin-created blocks** (per game / date / slot),
   - **full-day birthday hold** (when enabled for a date — all public slots show as unavailable for every game).
4. **Waiver + contact + coupon** — Parent/guardian name, phone, optional email; participation waiver checkbox (legal copy TBD). **Coupon codes** from a prototype table (`GLOW10`, `ARENA15`, `FLAT50`, `FLAT100`, `KIDSFUN20`) applied to subtotal; normalized uppercase.
5. **Confirm** — **`POST /api/bookings`** persists a **confirmed** booking with reference **`GA-XXXXXXXX`**, amounts, coupon code, and customer fields into **`web/data/arena-store.json`**.

**Payments:** Simulated only — no Razorpay or gateway.

### Combos & coupons (logic)

- **Tiered combo discounts** by number of games in the pass (`web/src/lib/combos.ts`, `combo-pricing.ts`).
- **Birthday planner** reuses the same combo pricing engine for estimates.
- **Coupons:** percentage off or fixed INR off, capped at subtotal (`web/src/lib/coupons.ts`); shown in booking and combo UIs.

### Birthday party requests

- **POST `/api/birthday-requests`** (public) creates a row with reference **`BP-XXXXXXXX`**, pricing breakdown, optional **preferred date**, and flags.
- **Venue hold (default on when date is set):** if the customer keeps “reserve venue for public booking,” the request sets **`blocksPublicSlots`** so **no public arena slots** are bookable on that **calendar day** (all games) until ops change it — **birthday precedence** over walk-in / online session booking.
- Admin can **toggle** that hold per request without deleting the enquiry.

### Admin dashboard (`/admin`)

Operations-style UI (client-side) talking to secured APIs when **`ADMIN_SECRET`** is set:

- **Load bookings, blocks, birthday requests** for a chosen date range.
- **Revenue / volume stats** for a stats range: total revenue (sum of `payableInr`), booking count, kids headcount, **breakdown by day** and **by game** (`GET /api/admin/stats`).
- **Manual slot blocks** — block a specific **game + date + slot** with a note; **delete** blocks.
- **Birthday table** — view enquiries; **enable/disable full-day public slot hold** per row (`PATCH`).
- **Bookings table** — filter **upcoming**; **export CSV** of slot bookings for the selected range.
- **Admin secret** — optional field saved to **localStorage** so the browser sends **`x-admin-secret`** on requests when the server requires it.

When **`ADMIN_SECRET`** is **not** set (typical local demo), admin list/write APIs are **open** — convenient for testing; **set the secret** before any real exposure.

### HTTP API (Next.js Route Handlers)

| Area | Behaviour |
|------|-----------|
| **Availability** | `GET /api/bookings/availability?game=&date=` — slot list, reasons when closed, `birthdayPartyHold` flag. |
| **Bookings** | `POST /api/bookings` — create (public). `GET /api/bookings?from=&to=&game=` — list (admin if secret set). |
| **Blocks** | `GET` / `POST /api/blocks`, `DELETE /api/blocks?id=` — admin when secret set. |
| **Stats** | `GET /api/admin/stats?from=&to=` — aggregates (admin when secret set). |
| **Birthdays** | `GET` (admin), `POST` (public), `PATCH` (admin) on `/api/birthday-requests`. |

### Brand, UI & UX

- **Logo** in header/footer (`web/public/glow-arena-logo.png`).
- **Neon / dark theme** — CSS variables and utilities for cyan, lime, magenta, gradients, glow-style cards and primary CTA (Montserrat + DM Sans).
- **Responsive** layout, sticky header with mobile nav, accessible landmarks and form labels where implemented.
- **SEO basics** — page titles and meta description in root layout; `/admin` marked **noindex**.

### Data layer

- Single JSON file **`web/data/arena-store.json`** (auto-created, **gitignored**): `bookings`, `blocks`, `birthdayRequests`.
- **No database** in this prototype — delete the file to reset all operational data.

---

## Not in scope (prototype limitations)

Worth spelling out so expectations stay clear:

- **No real payments**, emails, SMS, WhatsApp API, or CRM — lead forms are **mock**.
- **Pricing and copy** on marketing pages are **placeholders** unless you replace them.
- **Server trusts** booking line amounts from the client — **recalculate on the server** before production.
- **Concurrent booking races** are only handled by “second write fails” — no transactional DB.
- **Serverless deploys** (e.g. Vercel) often have **read-only or ephemeral disk** — JSON persistence may not survive; use a DB or KV for a hosted demo.
- **Combos page** does not create a server-side “combo ticket”; only **single-game session bookings** are stored in `arena-store.json`.

---

## Public links & live site

| What | Link |
|------|------|
| **GitHub (code + this README)** | [github.com/jvinaymohan/glowareana](https://github.com/jvinaymohan/glowareana) |
| **README anchor** | [github.com/jvinaymohan/glowareana#readme](https://github.com/jvinaymohan/glowareana#readme) |

**Live HTTPS URL for the running app:** not provided by GitHub itself. Deploy the **`web`** folder (e.g. Vercel with **Root Directory = `web`**) and add your production URL to this README after the first deploy.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjvinaymohan%2Fglowareana&root-directory=web)

---

## Run locally

```bash
git clone https://github.com/jvinaymohan/glowareana.git
cd glowareana/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). From the monorepo root, `npm run dev` also works via the root `package.json`.

```bash
npm run build && npm run start   # production on port 3000
```

**Node:** `>= 20.9.0`

**Optional:** `web/.env.local` → `ADMIN_SECRET=<string>` to lock admin APIs.

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **File-backed store** for bookings / blocks / birthdays
- **ESLint** (React Compiler–aware rules) — `npm run lint` in `web/`

---

## Repository layout

```
glowareana/
├── README.md                 ← full overview (this file)
├── package.json              ← delegates scripts into web/
└── web/
    ├── README.md             ← API/env/checklist deep dive
    ├── src/app/              ← routes, layouts, API routes
    ├── src/components/       ← booking, admin, combo, birthday, chrome
    ├── src/lib/              ← site config, booking math, store, coupons
    ├── public/               ← logo and static assets
    └── data/                 ← arena-store.json at runtime (gitignored)
```

---

## Contributing / next steps (ideas)

Wire **Razorpay** (or similar), **server-side price validation**, **email confirmations**, replace JSON with **Postgres** or **Planetscale**, and connect lead forms to **CRM** or **Resend**. Rename repo to fix typo **glowareana** → **glowarena** in GitHub settings if desired.

---

*Prototype — venue name, pricing, and legal text are for demonstration unless updated for production.*
