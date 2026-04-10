# Product Requirements Document (PRD)

| Field | Value |
|--------|--------|
| **Product** | Glow Arena — venue booking & operations platform |
| **Purpose** | Handoff for **build, deployment, and ongoing maintenance** |
| **Version** | 1.2 |
| **Last updated** | 2026-04-10 |
| **Audience** | Engineering, DevOps, Product, QA, vendor account management |

> **Related docs:** [Implementation status (vs this PRD)](./IMPLEMENTATION_STATUS.md) · [Web app README](../README.md) (setup & technical depth) · [Demo & launch checklist](./DEMO_AND_LAUNCH.md)

---

## Table of contents

| Section | Topics |
|---------|--------|
| [§1 Executive summary](#1-executive-summary) | Vision, goals, current baseline |
| [§2 Stakeholders & personas](#2-stakeholders--personas) | Guest, staff, manager, owner, finance, support |
| [§3 Scope](#3-scope) | In/out of scope, technical debt |
| [§4 User journeys](#4-user-journeys--workflows) | Guest, staff, manager, finance |
| [§5 Functional requirements](#5-functional-requirements) | Identity, catalog, reservations, payments, promos, loyalty, finance, operations, audit, tax |
| [§6 Non-functional requirements](#6-non-functional-requirements) | Performance, security, observability, accessibility |
| [§7 Technical architecture](#7-technical-architecture-expectations) | Stack, API surface |
| [§8 Integrations](#8-integrations) | Razorpay, email, SMS, analytics |
| [§9 Environments & deployment](#9-environments--deployment) | Local, staging, production |
| [§10 Maintenance & support](#10-maintenance--support-vendor) | SLA starter |
| [§11 Quality assurance](#11-quality-assurance--acceptance) | Tests, go-live criteria |
| [§12 Documentation deliverables](#12-documentation-deliverables-vendor) | Guides, runbooks |
| [§13 Assumptions](#13-assumptions--dependencies) | Client dependencies |
| [§14 Open decisions](#14-open-decisions-to-resolve-before-build-sign-off) | Hosting, legacy, loyalty, ops |
| [§15 Revision history](#15-revision-history) | Document versions |

---

## 1. Executive summary

### 1.1 Product vision

Glow Arena is a **multi-store–capable** indoor play / game-room business platform. It must support:

- **Guests:** discover the venue, check availability, book sessions, pay online, reschedule/cancel within policy, and receive confirmations.
- **Staff:** run the day — today’s schedule, check-in/out, walk-ins, slot blocking, payments and adjustments, promotions/coupons, and reporting.
- **Owners / finance:** store-scoped visibility, revenue and occupancy reporting, exports, and auditability.

### 1.2 Business goals

| Goal | Measurable indicator |
|------|----------------------|
| Reduce front-desk friction | Median check-in time; fewer manual spreadsheet steps |
| Accurate money tracking | Daily reconciliation (gateway vs ledger); &lt; 0.5% variance |
| Operational clarity | Single source of truth for reservations per store |
| Scalable rollout | Add a new store without schema redesign |

### 1.3 Current baseline (existing codebase)

A **Next.js** application exists with:

- Public marketing pages, legal pages (privacy, terms, refunds, safety), sitemap/SEO hooks, and a legacy file-based booking path (still present alongside v2).
- A **Prisma-backed “platform v2”** data model and APIs, including:
  - **Reservations:** full lifecycle (including **rescheduled** as a reservation status), customer self-service list/reschedule, admin check-in/out, **move to another slot** (capacity + conflict checks), bulk slot blocking.
  - **Payments:** ledger model, line items, Razorpay **webhook** route (partial end-to-end); manual payment recording from admin APIs.
  - **Catalog:** stores, venues, games, game slots (capacity, modes, blocked/closed).
  - **Promotions & coupons:** admin CRUD-style routes; **loyalty-issued** coupons tied to rewards (see §5.6).
  - **Loyalty:** per-user, per-store punch card, tier progression, automatic **10% coupon** on every 10th completed visit (after admin check-out), customer **GET** summary API and customer portal UI block (“Glow Rewards”).
  - **Operations:** **shifts** and **shift assignments** (duty roles), **support tickets** and comments, **incidents**, **time clock** entries, **approval requests** (discount/refund/pricing, etc.).
  - **Reporting:** summary and **CSV** export routes, plus **PDF** (executive summary) and **XLSX** export routes for richer reporting.
  - **Governance:** audit log model, RBAC roles (Owner through Admin Support), store-scoped admin users, platform **admin** and **customer** JWT sessions (HTTP-only cookies).
- **POC UIs:** `/platform/admin` (dashboard, calendar, operations hub, reports, settings/role matrix) and `/platform/customer` (login, reservations, booking from availability, loyalty display).
- **QA data:** Prisma seeds — baseline demo store/users (`prisma:seed`), large-volume stress calendar (`prisma:seed:stress`), and **loyalty + 60-day calendar scenario** with 100 synthetic customers (`prisma:seed:loyalty-scenario`).

**Vendor scope** remains: hardening, completing payment checkout end-to-end, consolidating booking sources, production hardening, deployment, and **maintenance** as defined in Section 10. The items above are **implemented baselines** to extend and harden, not shrink-wrapped production features until signed off.

---

## 2. Stakeholders & personas

| Persona | Needs |
|---------|--------|
| **Guest / parent** | Simple booking, clear pricing, safety/legal acknowledgement, payment receipt, reschedule/cancel rules; optional **account** to see history and **loyalty** (punch card, tier benefits, reward coupons) |
| **Front desk** | Fast lookup, check-in/out, walk-ins, incidentals, block bad slots; optional **time clock** and **shift** visibility where enabled |
| **Store manager** | Store-scoped bookings, reporting, promotions/coupons for their store |
| **Owner / HQ** | All stores, financial summaries, exports, user/role management |
| **Finance** | Payment history, refunds, GST/invoice references, exports |
| **Support** | Read-heavy access, ability to assist customers without dangerous deletes; **tickets** and **incidents** workflows in v2 APIs/UI stubs |

---

## 3. Scope

### 3.1 In scope (must deliver)

1. **Unified booking & payments** — one authoritative reservation model in production DB.  
2. **Razorpay** — order creation, hosted checkout or Razorpay Checkout JS, webhook-driven confirmation, refund handling (at least manual + webhook path).  
3. **Admin & customer web apps** — production-quality UI replacing POC pages where agreed.  
4. **Multi-store** — data isolation by `storeId`; role-based access.  
5. **Reporting** — dashboards + CSV exports already sketched; extend as per Section 5.  
6. **Deployment** — staging + production, secrets, backups, monitoring.  
7. **Documentation** — runbooks, env vars, API overview, deployment steps.  
8. **Maintenance window** — see Section 10.  
9. **Loyalty & repeat engagement** — punch card, tiers, and reward coupons aligned with completed visits (baseline implemented; rules and marketing copy subject to client sign-off).  
10. **Operations tooling** — staffing/shifts, tickets/incidents, approvals, time clock — baseline in API + POC admin UI; production UX and permissions to be hardened.

### 3.2 Out of scope (unless explicitly added)

- Native mobile apps (responsive web is in scope).  
- Full accounting ERP (export to CSV/accounting tool is sufficient for v1).  
- Hardware (turnstiles, QR scanners) beyond providing **check-in tokens/APIs**.  
- Non-INR currencies unless product adds stores abroad.

### 3.3 Explicit technical debt to resolve

- **Dual booking systems:** legacy file store vs Prisma v2 — **vendor must propose and execute** a single path for production (`DISABLE_LEGACY_BOOKING=1` enforces v2-only booking API).  
- **Production database:** this repository targets **PostgreSQL** (migrations + `docker-compose` in `web/`). Older SQLite demos are not the default path here.

---

## 4. User journeys & workflows

### 4.1 Guest: book and pay

1. Select **date** → see **games/slots** available for that date.  
2. Select slot, party size, age band, accept **safety + waiver** (and minor disclaimer where applicable).  
3. Review price (incl. GST breakdown as per Indian rules — see §5.10).  
4. Pay via Razorpay; receive **confirmation + reference/QR or link** for arrival.  
5. Optional: account login to **reschedule/cancel** per policy.  
6. When logged in with a linked store context, view **loyalty**: current **tier**, **punch progress** toward the next reward, **benefits copy** by tier, and **issued reward coupons** (codes and redemption state). Punches accrue on **completed visits** (reservation **checked out** by staff), not on booking alone.

**Acceptance:** End-to-end test in **Razorpay test mode** and repeat in **live mode** before launch. Loyalty acceptance: customer sees consistent summary after login and after booking/reschedule refresh; check-out produces at most **one punch per reservation** (idempotent).

### 4.2 Staff: day operations

1. Sign in via **single admin login** (email/password for platform; optional legacy secret-only path may be retired).  
2. View **today’s sessions** by time and game; visual status (scheduled / checked-in / checked-out / cancelled / rescheduled / no-show if added). Use **calendar** and **arena day** views where deployed.  
3. **Check-in / check-out** with validation (e.g. paid before check-in if business rule requires). **Check-out** for a reservation tied to a **customer user** triggers **loyalty** punch accrual (see §5.6).  
4. **Walk-in** booking against same slot capacity; **block** slots; **move** a booking to another open slot when policy allows (admin API).  
5. Record **cash/POS or manual** payments and adjustments with audit trail.  
6. Optional baseline: **shifts** (who is on duty), **time clock**, **support tickets**, **incidents**, and **approval requests** for sensitive actions — APIs and POC screens exist; production workflows need client rules.  

### 4.3 Manager / owner: reporting

1. Filter by store, date range.  
2. View occupancy (by day/time), revenue by category (standard/birthday/corporate), payments, coupon/promo usage.  
3. **Export CSV** for bookings, payments, promo usage; baseline also includes **PDF** (e.g. executive summary) and **XLSX** exports via v2 report routes.  
4. Optional: scheduled email report (nice-to-have; flag as P2 if not in v1).

### 4.4 Finance / refunds

1. Refund initiated from admin or Razorpay dashboard updates **ledger** (payment row + reservation balance).  
2. Reports reflect refunds consistently.

---

## 5. Functional requirements

### 5.1 Identity & access

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A1 | Platform **admin** auth: email + password; HTTP-only session cookie; logout invalidates server-side expectation | P0 |
| FR-A2 | Platform **customer** auth: register/login/logout; users see only own reservations | P0 |
| FR-A3 | **RBAC:** Owner, Store Manager, Employee, Floor Supervisor, Cash/POS, Admin/Support — permissions enforced in **API** (not UI-only) | P0 |
| FR-A4 | Store scoping: non-owners only access assigned stores | P0 |
| FR-A5 | Optional: **MFA** for Owner/HQ (P2) | P2 |

### 5.2 Catalog & inventory

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C1 | **Venue** per store: capacity, opening hours | P0 |
| FR-C2 | **Game:** duration, min/max age, max per slot, base price | P0 |
| FR-C3 | **GameSlot:** date, time, capacity remaining, status (open/blocked/closed), mode (online-only / walk-in-only / mixed) | P0 |
| FR-C4 | Unique constraint **(gameId, date, time)** on slots | P0 |
| FR-C5 | Slot generation from rules (recurring schedule) — may be **admin tool** or **cron** (vendor to propose) | P1 |

### 5.3 Reservations

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-R1 | Create reservation with participants; conflict detection for overlapping bookings per store rules | P0 |
| FR-R2 | Lifecycle: `created` → `paid` → `checked_in` → `checked_out` (with **cancelled** terminal state); reservation **status** may include **rescheduled** when the slot/time was moved | P0 |
| FR-R3 | Reschedule/cancel with business rules (cut-off times, fees — **configurable** or documented constants); customer self-reschedule and admin **move-slot** both in baseline | P0 |
| FR-R4 | Walk-in bookings decrement same slot capacity as online | P0 |
| FR-R5 | **Booking type** for reporting: standard / birthday / corporate | P1 |

### 5.4 Payments

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-P1 | **Razorpay Orders API** from backend; never expose **key secret** to browser | P0 |
| FR-P2 | Razorpay Checkout (or equivalent) on client; success/failure UX | P0 |
| FR-P3 | Webhook: verify signature; **idempotent** processing; map to reservation | P0 |
| FR-P4 | `reservationId` (or immutable public id) carried in order/payment **notes** for webhook correlation | P0 |
| FR-P5 | Manual payments (cash, POS) and refunds; balance and `paymentStatus` consistent | P0 |
| FR-P6 | GST: store **rate and amount** per booking; **invoice reference** generation rules documented | P1 |

### 5.5 Promotions & coupons

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-O1 | Admin creates coupons (code, type, limits, expiry, store scope) | P1 |
| FR-O2 | Admin creates promotions (window, rules); usage tracked | P1 |
| FR-O3 | Invalid/expired coupon rejected at booking | P1 |
| FR-O4 | **Loyalty-issued** coupons: unique code, store-scoped, usage limit and expiry set by engine; visible to the owning customer in portal | P1 |

### 5.6 Loyalty & repeat engagement

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-LY1 | **Per customer, per store:** track `lifetimeCheckouts` (completed visits), **punch card** progress (default **10** punches per reward cycle), and **tier** derived from lifetime visits (e.g. Bronze → Silver → Gold → Platinum thresholds) | P1 |
| FR-LY2 | On **check-out**, if the reservation has a **userId**, record **at most one** loyalty event per reservation (idempotent); increment punch; reset card and issue **reward coupon** when the cycle completes | P1 |
| FR-LY3 | **Customer API:** authenticated `GET` with `storeId` returns loyalty summary, tier benefits copy, punch progress, and recent reward coupons | P1 |
| FR-LY4 | **Customer UI:** when logged in, show loyalty panel after login and refresh after booking/reschedule (store-scoped) | P2 |
| FR-LY5 | Tier benefit bullets are **product copy** for engagement; any **commercial promise** (discounts beyond issued coupons) must be validated legally and operationally before marketing | P1 |

*Implementation note (baseline): reward coupon is **percentage** discount (10%), single use, capped **max discount** amount, ~90-day expiry; engine tags coupons for traceability.*

### 5.7 Finance (extended)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-F1 | Expenses per store/category with GST where applicable | P2 |
| FR-F2 | Salary records (schema exists); UI/reporting | P2 |

### 5.8 Operations & workforce (baseline)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-OP1 | **Shifts:** store-scoped shift windows with **assignments** linking admin users; duty role per assignment (floor, cash/POS, manager on duty, etc.) | P2 |
| FR-OP2 | **Time clock:** entries associated with admin user and store for attendance-style reporting | P2 |
| FR-OP3 | **Support tickets** and **incidents:** create/update/list with store scope; ties to reservations optional | P2 |
| FR-OP4 | **Approval requests:** typed requests (discount, refund, pricing change, etc.) with pending/approved/rejected and actor audit | P2 |
| FR-OP5 | **Settings / role matrix** UI or API for viewing role capabilities — baseline exists; production RBAC matrix must match client policy | P1 |

### 5.9 Audit & compliance

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-X1 | Audit log for material changes (who/when/what) — retain policy defined with client | P1 |
| FR-X2 | Legal pages: production copy reviewed by client’s counsel; baseline routes include **privacy**, **terms**, **refunds**, **safety** under `/legal/*` | P0 (content), P1 (implementation) |
| FR-X3 | Privacy: data minimization, retention, export/delete process documented (DPDP-aware where applicable) | P1 |

### 5.10 Localization & tax

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-L1 | Primary market: **India**; currency **INR**; timezone per store (e.g. `Asia/Kolkata`) | P0 |
| FR-L2 | GST display and calculation rules validated with client accountant | P1 |

---

## 6. Non-functional requirements

### 6.1 Performance & reliability

| ID | Requirement |
|----|-------------|
| NFR-1 | Core APIs p95 &lt; 500 ms under nominal load (define RPS with vendor). |
| NFR-2 | Graceful degradation if payment gateway slow; no double-charging (idempotency). |
| NFR-3 | Database backups: daily minimum; restore test quarterly. |

### 6.2 Security

| ID | Requirement |
|----|-------------|
| NFR-S1 | Secrets only in env / secret manager; never in repo. |
| NFR-S2 | HTTPS everywhere in production. |
| NFR-S3 | Rate limiting on auth and booking endpoints. |
| NFR-S4 | Webhook signature verification mandatory in production. |
| NFR-S5 | Dependency updates and CVE response per maintenance SLA. |

### 6.3 Observability

| ID | Requirement |
|----|-------------|
| NFR-O1 | Structured logging; correlation id for payment flows. |
| NFR-O2 | Error tracking (e.g. Sentry) for production. |
| NFR-O3 | Uptime monitoring for app + webhook endpoint. |

### 6.4 Accessibility & UX

| ID | Requirement |
|----|-------------|
| NFR-U1 | Admin flows usable on tablet at front desk. |
| NFR-U2 | WCAG 2.1 Level AA target for customer-facing flows (vendor plan). |

---

## 7. Technical architecture expectations

| Area | Expectation |
|------|-------------|
| **Frontend** | Next.js App Router; shared design system for admin vs marketing. |
| **Backend** | Next.js Route Handlers and/or extracted services; **business logic not only in UI** (e.g. `src/lib/platform/services/*`). |
| **ORM** | Prisma; migrations versioned; `schema.prisma` includes loyalty, shifts, tickets, incidents, time clock, approvals, payment line items, check-in/out events. |
| **DB** | **PostgreSQL** (managed or Docker); connection pooling; indexes on hot paths. This repo ships **Postgres migrations** and a **`pg` adapter** in application code. |
| **Auth** | JWT in HTTP-only cookies; rotation policy documented. |
| **Payments** | Razorpay as primary PSP for India launch. |
| **Reporting libs** | Baseline uses **pdf-lib** and **exceljs** for PDF/XLSX exports (v2 admin report routes). |

**API surface (v2, illustrative):** `/api/v2/public/*` (stores, availability), `/api/v2/customer/*` (auth, reservations, reschedule, **loyalty**), `/api/v2/admin/*` (auth, dashboard, calendar, arena-day, reservations CRUD, check-in/out, move-slot, payments, coupons, promotions, shifts, team, tickets, incidents, time clock, approvals, settings/role-matrix, reports: summary, CSV export, executive PDF, XLSX), `/api/v2/payments/razorpay/webhook`.

**Vendor deliverable:** Architecture Decision Record (ADR) for any deviation.

---

## 8. Integrations

| System | Purpose | Requirement |
|--------|---------|-------------|
| **Razorpay** | Orders, payments, webhooks, refunds | Test + live keys; webhook URL registered |
| **Email** (e.g. Resend) | Confirmations, receipts | Production sender domain verified |
| **SMS** (e.g. Twilio) | Optional reminders | Client account or vendor-managed |
| **Analytics** (e.g. GA4) | Marketing funnel | `NEXT_PUBLIC_GA_ID` or equivalent |

---

## 9. Environments & deployment

| Environment | Purpose |
|-------------|---------|
| **Local** | Developer machines; **Docker Postgres** (`web/docker-compose.yml`) or hosted URL via `DATABASE_URL` |
| **Staging** | Client UAT; Razorpay **test** keys; production-like DB |
| **Production** | Live traffic; Razorpay **live** keys; backups + monitoring |

**Vendor deliverables:**

1. Infrastructure as code or documented manual steps (Vercel/AWS/GCP — client to confirm host).  
2. CI: lint, test, build on PR; optional preview deploys.  
3. Runbook: deploy, rollback, env var checklist, incident response.  
4. **DR:** RTO/RPO targets agreed with client (starter: RPO 24h, RTO 4h for v1).

---

## 10. Maintenance & support (vendor)

Define in **Statement of Work (SOW)**; suggested starter:

| Item | Suggested SLA |
|------|----------------|
| **Severity 1** (payments down, data loss risk) | Response &lt; 1 business hour; workaround &lt; 4h |
| **Severity 2** (major feature broken, no workaround) | Response &lt; 4 business hours |
| **Severity 3** (minor / cosmetic) | Response &lt; 2 business days |
| **Patches** | Security patches within vendor policy; dependency updates monthly |
| **Office hours** | IST (or as agreed) |

**Included:** bug fixes for agreed scope; **excluded:** new major modules unless change order.

---

## 11. Quality assurance & acceptance

### 11.1 Test types

- **Unit:** services (pricing, conflicts, RBAC, **loyalty** idempotency and tier math).  
- **Integration:** API + DB; webhook replay idempotency.  
- **E2E:** book → pay (test mode) → webhook → check-in → check-out → **loyalty punch** (for logged-in customer reservation) → export CSV / spot-check PDF or XLSX.  
- **Data scenarios (local/staging):** run `npm run prisma:seed` for demo store and roles; `npm run prisma:seed:stress` for high-volume calendar stress; `npm run prisma:seed:loyalty-scenario` for **100 synthetic customers**, **60 days** of **2–10 bookings/day**, mixed booking types, cancellations/reschedules, shifts, and loyalty check-outs (requires DB schema in sync, e.g. `prisma db push` or migrate).  
- **UAT:** client sign-off on staging.

### 11.2 Exit criteria for “go-live”

- [ ] Production DB migrated; no SQLite in prod.  
- [ ] Razorpay live smoke test with real ₹ minimal transaction (or client-approved test).  
- [ ] Webhook logs show successful processing; reconciliation sheet signed off.  
- [ ] Legal pages live with client-approved text.  
- [ ] Backup restore drill completed once.  
- [ ] Runbook handed over.

---

## 12. Documentation deliverables (vendor)

1. **Product & ops:** admin user guide, front-desk checklist, refund/cancel policy implementation, **loyalty rules** (punches per reward, tier thresholds, coupon terms) and how staff actions affect punches.  
2. **Technical:** README, env reference, architecture diagram, API list (OpenAPI optional); document **seed scripts** and cleanup prefixes for stress/loyalty scenario data.  
3. **Deployment:** staging + prod setup, secrets, domain, webhook URLs.  
4. **Maintenance:** on-call procedure, where logs live, how to rotate keys.

---

## 13. Assumptions & dependencies

- Client provides: Razorpay business account, domain DNS, legal copy, GST/accounting rules, store list and operating hours.  
- Client assigns a **single product owner** for decisions within 48h during build.  
- Third-party outages (Razorpay, host) are handled per vendor SLA with incident communication.

---

## 14. Open decisions (to resolve before build sign-off)

1. **Hosting:** Vercel vs AWS vs other — affects cron, websockets, file uploads.  
2. **Retire legacy file booking:** yes/no and cutover date.  
3. **Minimum viable reporting** for day 1 vs phase 2 (CSV vs PDF/XLSX bundles, scheduled reports).  
4. **Refund policy** automation vs manual-only in v1.  
5. **Per-participant digital waiver** storage (full audit) vs booking-level acknowledgement only.  
6. **Loyalty:** finalize punch count per reward, tier thresholds, coupon % / cap / expiry, and whether **walk-ins without accounts** can accrue punches (current baseline: **account-linked reservations only**).  
7. **Operations modules:** which of shifts, time clock, tickets, incidents, and approvals are **customer-facing v1** vs internal-only.

---

## 15. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | — | Client / Glow Arena | Initial PRD for vendor handoff |
| 1.1 | 2026-04-07 | Client / Glow Arena | Baseline refresh: **loyalty** (punch card, tiers, reward coupons, customer API/UI); **operations** (shifts, time clock, tickets, incidents, approvals); **reporting** (PDF/XLSX); reservation **reschedule/move-slot**; **legal** pages; **Prisma seeds** (stress + loyalty scenario); v2 **API inventory** in architecture; new FR tables **5.6–5.10** and open decisions **6–7**. |
| 1.2 | 2026-04-10 | Engineering / Client | **GitHub-friendly** layout (metadata table, table of contents); production path **PostgreSQL**; link to [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md). |


---

*This PRD is intended to align scope between Glow Arena and a development partner. Detailed estimates, timelines, and pricing belong in a separate SOW or contract.*
