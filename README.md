# Glow Arena

Neon-themed marketing site and **interactive operations prototype** for **Glow Arena** — indoor game zone (Koramangala, Bangalore). Includes live slot booking (file-backed store), combo pricing, coupons, birthday planner with optional full-day venue hold, and an admin dashboard.

---

## Public links

| What | Link |
|------|------|
| **Source code (GitHub)** | **[github.com/jvinaymohan/glowareana](https://github.com/jvinaymohan/glowareana)** |
| **Clone** | `git clone https://github.com/jvinaymohan/glowareana.git` |

Anyone can open the GitHub URL above to browse the repo, read this README, and clone the project — no login required for a public repository.

**Live website:** GitHub does not host the running Next.js app. To get a shareable **https://…** link for the site itself, deploy (see below). After your first deploy, add your production URL here (e.g. `https://glow-arena.vercel.app`).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjvinaymohan%2Fglowareana&root-directory=web)

When importing on Vercel, set **Root Directory** to **`web`** (if the button does not set it automatically). Booking data uses a local JSON file; on serverless hosts writes may not persist — use a database or Vercel KV for a serious public demo.

---

## Run locally

```bash
git clone https://github.com/jvinaymohan/glowareana.git
cd glowareana/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). From the repo root you can also run `npm run dev` (see root `package.json`).

```bash
npm run build
npm run start   # production server on port 3000
```

**Node:** `>= 20.9.0`

---

## Documentation

Full prototype reference (routes, APIs, environment variables, test checklist): **[web/README.md](web/README.md)**

---

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Runtime data: `web/data/arena-store.json` (gitignored; created on first use)
- Optional: `ADMIN_SECRET` in `web/.env.local` to lock admin APIs

---

## Repo layout

```
glowareana/
├── README.md          ← you are here (GitHub landing page)
├── package.json       ← scripts that delegate into web/
└── web/               ← Next.js application
    ├── README.md      ← detailed prototype reference
    ├── src/
    └── public/        ← includes brand logo
```

---

## License / prototype notice

Copy, pricing, and venue details are placeholders for stakeholder testing unless you replace them with production content.
