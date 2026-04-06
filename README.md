# Glow Arena

Marketing site and booking prototype for **Glow Arena** — indoor game zone (Koramangala, Bangalore).

## Run locally

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). From the repo root you can also run `npm run dev` (see root `package.json`).

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- File-backed store: `web/data/arena-store.json` (gitignored; created at runtime)
- Optional admin lock: set `ADMIN_SECRET` in `web/.env.local`

## Routes

- `/` — Home
- `/games`, `/combos`, `/birthday`, `/corporate`, `/book`, `/contact`
- `/admin` — Bookings, blocks, birthday requests, revenue summary

## Deploy

Build: `cd web && npm run build`. Use a host with a writable filesystem if you keep the JSON store, or swap the store for a database for production.
