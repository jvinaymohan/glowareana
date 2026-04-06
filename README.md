# Glow Arena

Marketing site and **interactive prototype** for **Glow Arena** — indoor game zone (Koramangala, Bangalore): live booking UX, combos, coupons, birthday planner with venue hold, and admin ops.

## Run

```bash
cd web
npm install
npm run dev
```

From the repo root, `npm run dev` runs the same (see root `package.json`).

## Documentation

**Full prototype reference (routes, APIs, env, test checklist):** [web/README.md](web/README.md)

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Data: `web/data/arena-store.json` (created at runtime, gitignored)

## Deploy note

`npm run build` / host with a **writable** filesystem if you keep the JSON store, or migrate to a database for production.
