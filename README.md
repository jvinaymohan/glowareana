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

## Publish to GitHub

Your project is committed on branch `main`. GitHub CLI (`gh`) is the fastest path:

```bash
cd /Users/vinayhome/Documents/Sandeep/GlowArena
gh auth login          # follow prompts (browser or device code)
gh repo create glow-arena --public --source=. --remote=origin --push
```

Pick any unused repo name instead of `glow-arena` if you prefer. After `--push`, share the URL GitHub prints (e.g. `https://github.com/YOUR_USER/glow-arena`).

**Without `gh`:** create an empty repo on [github.com/new](https://github.com/new), then:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```
