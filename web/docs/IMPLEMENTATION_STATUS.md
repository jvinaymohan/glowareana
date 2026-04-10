# Implementation status vs PRD (Glow Arena web)

**Purpose:** Map [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) to the codebase **as of 2026-04-10**, call out **new** capabilities since the PRD baseline, and list **production / wide-launch** gaps.

**How to read:** “Done” = implemented in code with API and/or UI at POC+ level unless noted. “Partial” = exists but not production-signed-off. “Open” = not done or needs client/vendor decision.

---

## 1. PRD scope summary

| PRD reference | Theme | Status | Notes |
|---------------|--------|--------|--------|
| §1.3, §3.1, §7 | Unified booking in Prisma v2 | **Done** | Customer + admin reservation flows; conflict handling in services. |
| §3.3, §11.2 | Legacy file booking vs v2 | **Partial** | `DISABLE_LEGACY_BOOKING=1` turns off legacy `POST /api/bookings`; marketing/book pages may still reference legacy paths—verify cutover. |
| §3.3, §7, §11.2 | PostgreSQL in production | **Done (path)** | Schema + migrations target **PostgreSQL**; `docker-compose.yml` for local DB; CI runs `migrate deploy` against Postgres. PRD “SQLite demo” superseded for this repo branch—use Postgres locally too. |
| §3.1 (2), §4.1, §5.4 | Razorpay end-to-end | **Partial** | Orders API + webhook processing exist; **Checkout JS / hosted UX** not wired in customer UI; pay column gated behind `NEXT_PUBLIC_RAZORPAY_ENABLED=1`. Refunds: manual/admin path; auto reconciliation from dashboard **TBD**. |
| §3.1 (3) | Production-quality admin/customer UI | **Partial** | `/platform/admin`, `/platform/customer` are **POC-grade**; usable for UAT, not full design system parity. |
| §3.1 (4) | Multi-store + RBAC | **Done** | `storeId` scoping; roles Owner → Admin Support; API guards (not UI-only). |
| §3.1 (5) | Reporting | **Done (baseline)** | Summary, CSV, executive PDF, XLSX routes per PRD; limits/window caps as documented in DEMO_AND_LAUNCH. |
| §3.1 (6) | Deployment, secrets, backups | **Partial** | Env template, CI, Postgres compose; **hosting choice, backups, monitoring, runbook** still vendor/client actions. |
| §3.1 (7) | Documentation | **Partial** | README, DEMO_AND_LAUNCH, env example; **OpenAPI, formal runbook** optional per PRD. |
| §3.1 (9) | Loyalty | **Done (baseline)** | Punch card, tiers, reward coupons, customer GET + portal block; idempotent check-out punch—**rules/thresholds** still open per §14.6. |
| §3.1 (10) | Operations tooling | **Done+** | Shifts, time clock, tickets, incidents, approvals in APIs + admin POC; **staff hire, schedules, payroll rows** extended in UI/API (see §3 below). |
| §4.1 | Guest journey (book → pay → loyalty) | **Partial** | Book + loyalty **yes**; **pay via Razorpay** not launch-ready without enabling env + Checkout integration; GST display **P1** validation open. |
| §4.2 | Staff day operations | **Partial** | Calendar/arena-day/operations exist; **paid-before-check-in** and other rules need client policy in code. |
| §4.3 | Manager/owner reporting | **Done (baseline)** | Filters/exports; scheduled email reports **P2 / open**. |
| §4.4 | Finance/refunds | **Partial** | Ledger + manual payments; **refund automation** open per §14.4. |
| §5.1 | Identity & access FR-A1–A4 | **Done** | Platform admin + customer JWT cookies; RBAC enforced on v2 admin routes. FR-A5 MFA **open (P2)**. |
| §5.2 | Catalog FR-C1–C4 | **Done** | Venues, games, slots, modes, constraints. FR-C5 slot generation **P1 / open** (cron vs admin tool). |
| §5.2 | **Max 5 active games per arena** | **Done** | **New:** `MAX_ARENA_GAMES = 5`, admin games API PATCH enforces cap; seed uses `sortOrder` 1–5. |
| §5.3 | Reservations FR-R1–R4 | **Done** | Includes walk-in capacity, reschedule, move-slot. FR-R5 booking types **baseline in model/reporting**—confirm product usage. |
| §5.4 | Payments FR-P1–P5 | **Partial** | P1–P3 partial (no full checkout UX); P4 correlation in service layer—verify all edge paths; P5 manual **yes**. FR-P6 GST/invoice **P1 / open**. |
| §5.5 | Promotions & coupons | **Done (baseline)** | Admin routes + validation at booking. |
| §5.6 | Loyalty FR-LY1–LY5 | **Done (baseline)** | Copy/legal for commercial promises **client**. |
| §5.7 | Expenses / salary | **Partial** | Schema + **salary rows API + payroll tab** (mark paid); expense reporting depth **P2**; link payroll to `Expense` **optional**. |
| §5.8 | Operations FR-OP1–OP5 | **Partial→Done** | OP1–OP4 APIs + UI stubs/hubs; **OP5** role matrix baseline—align with **new** staff capabilities (who can hire, schedule, payroll). |
| §5.9 | Audit & legal | **Partial** | Audit model + usage in flows; legal **routes** exist—**copy** must be client-approved (FR-X2). |
| §5.10 | INR / timezone | **Done** | Store timezone + INR in model. |
| §6 | Non-functional (perf, security, observability, a11y) | **Open / partial** | Rate limits on **some** auth/booking routes; **Sentry, structured logs, uptime, p95 tests, WCAG AA, backup drills** not done as a bundle. |

---

## 2. New features & functionality (enabled now, not fully spelled out in PRD §1.3)

These are **in addition** to the PRD baseline bullets.

| Capability | Where / how |
|------------|-------------|
| **Arena game cap (5)** | `src/lib/platform/arena-games.ts`, `GET/PATCH /api/v2/admin/games*`. |
| **Staff lifecycle** | `GET/POST /api/v2/admin/staff`, `PATCH /api/v2/admin/staff/[id]` — hire, roles, **multi-store `storeIds`**, password reset. |
| **Payroll / salary tracking** | `GET/POST /api/v2/admin/salaries`, `PATCH .../[id]` (e.g. mark paid); UI tab under `/platform/admin/staff`. |
| **Schedule coverage UI** | Shifts list/create/delete (owner/manager); assignments; “mine” filter; aligned with existing `Shift` / `ShiftAssignment` models. |
| **Persona-aware staff hub** | `/platform/admin/staff` tabs (games, team, schedule, time clock, payroll) gated by role; navigation updated for **Staff & schedule**. |
| **Razorpay UI kill-switch** | Customer portal: **Pay online** hidden unless `NEXT_PUBLIC_RAZORPAY_ENABLED=1` (safe launch without PSP). |
| **Legacy booking kill-switch** | `DISABLE_LEGACY_BOOKING=1` rejects legacy `POST /api/bookings`. |
| **Postgres-first dev & CI** | `web/docker-compose.yml`, GitHub Actions Postgres service + `prisma migrate deploy`. |
| **Prisma 7 + `pg` adapter** | `src/lib/platform/prisma.ts` uses `@prisma/adapter-pg` (no SQLite in this branch). |

---

## 3. Remaining for production and wide launch

| Area | Priority | What’s missing |
|------|----------|----------------|
| **Razorpay live** | P0 for “pay online” launch | Enable env flags; embed **Checkout** (or hosted flow); register webhook URL; live smoke test; reconciliation process. |
| **Cut legacy booking** | P0 | Set `DISABLE_LEGACY_BOOKING=1` in prod; remove or redirect any UI still calling `/api/bookings`; confirm `arena-store.json` not relied on. |
| **Hosting & DB** | P0 | Managed Postgres (Neon/RDS/etc.), connection pooling, `DATABASE_URL` in secret manager; **daily backups + restore test** (NFR-3, §11.2). |
| **Secrets** | P0 | `AUTH_SECRET`, `ADMIN_SECRET`, `NEXT_PUBLIC_SITE_URL`; Razorpay secrets when enabled. |
| **Observability** | P1 | Structured logging, error tracking (e.g. Sentry), uptime on app + webhook (§6.3). |
| **Security hardening** | P1 | Review rate limits on **all** sensitive POSTs; webhook signature mandatory when Razorpay on (already implemented when secret set). |
| **Legal & compliance** | P0 (content) | Client counsel sign-off on `/legal/*`; privacy/retention narrative (FR-X3). |
| **GST / invoice** | P1 | Accountant-validated rules and UI copy (FR-P6). |
| **Operational policy in code** | P1 | Check-in requires paid? Cancel/reschedule cutoffs; refund automation vs manual (§14). |
| **Staff/RBAC polish** | P1 | Final **role matrix** vs hire/schedule/payroll (OP5); staff spanning many arenas—**data model supports**; scale testing. |
| **Slot generation** | P1 | Cron or admin bulk tool (FR-C5). |
| **QA & UAT** | P0 | Full E2E: book → (pay test) → webhook → check-in → check-out → loyalty → export (§11.1). |
| **Documentation** | P1 | Runbook: deploy, rollback, key rotation; admin guide (§12). |

---

## 4. Suggested “go-live” checklist (merged from PRD §11.2 + engineering)

Use this as a launch gate; tick with owner sign-off.

| # | Item | Owner |
|---|------|--------|
| 1 | Production Postgres; `prisma migrate deploy` applied; no SQLite in prod | Eng / DevOps |
| 2 | `DISABLE_LEGACY_BOOKING=1`; no critical path on file store | Eng |
| 3 | `AUTH_SECRET`, `ADMIN_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` set | DevOps |
| 4 | Razorpay: **either** fully off (no `NEXT_PUBLIC_RAZORPAY_ENABLED`) **or** live keys + webhook + E2E smoke | Product / Finance |
| 5 | Legal pages reviewed and published | Legal |
| 6 | Backup + one restore drill | DevOps |
| 7 | Runbook + on-call / log locations | Eng |
| 8 | Client UAT on staging | Product |

---

## 5. Revision history (this document)

| Date | Change |
|------|--------|
| 2026-04-10 | Initial snapshot: PRD crosswalk, new staff/payroll/games/Postgres/Razorpay-gating features, launch gaps. |
