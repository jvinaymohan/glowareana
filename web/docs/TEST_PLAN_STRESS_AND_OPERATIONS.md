# Test plan: stress load, operations, and staffing (owner review)

**Purpose:** Validate the Glow Arena platform under realistic **volume**, **staffing**, and **edge-case** behaviour before go-live.  
**Owner goals:** ~**3,000 bookings** across **~2 calendar months**, **5–100 bookings per day**, plus **birthday / corporate** events and **lifecycle** scenarios (book / cancel / reschedule / pay).  
**Audience:** Product owner, QA, engineering, venue GM.

---

## 1. Scope & assumptions

| Item | Assumption |
|------|------------|
| **Window** | **61 consecutive calendar days** (~2 months); adjust start date to your UAT window |
| **Total bookings** | **3,000** reservation records in the **platform DB** (Prisma / v2), not legacy JSON store |
| **Daily bounds** | Each day: **≥5** and **≤100** bookings (hard constraints for generator) |
| **Store** | Single primary store (e.g. `KORA`) unless multi-store test is explicitly enabled |
| **Timezone** | `Asia/Kolkata`; all `startAt` / `endAt` / reports use store timezone |
| **DB note** | **SQLite** (current POC) has **single-writer** limits; for true concurrency stress use **PostgreSQL** on staging |

---

## 2. Volume design: 3,000 bookings in ~61 days

### 2.1 Feasibility check

- **Minimum** load if every day had 5: `61 × 5 = 305`  
- **Maximum** if every day had 100: `61 × 100 = 6,100`  
- **Target** 3,000 lies in range; average **~49.2 bookings/day**.

### 2.2 Recommended daily distribution (realistic + stress)

Use a **weighted daily count** so weekends peak and weekdays dip, then **normalize** to sum exactly **3,000** while clamping each day to **[5, 100]**.

**Algorithm (reproducible):**

1. Fix random seed `S` (e.g. `42`) for repeatability.  
2. For each day `d = 0 … 60`:  
   - `base = 35`  
   - `weekendBoost = 25` if Sat/Sun else `0`  
   - `noise = uniform(-8, 8)` from RNG  
   - `raw[d] = base + weekendBoost + noise`  
3. Scale: `count[d] = round(3000 * raw[d] / sum(raw))`.  
4. **Clamp** each `count[d]` to `[5, 100]`.  
5. If `sum(count) ≠ 3000`, adjust: add/subtract 1 from days with headroom (never break min/max) until exact.

**Document in test report:** final per-day histogram (min/median/max daily count).

### 2.3 Slot / time spread

- Spread bookings across **operating hours** (e.g. 10:00–21:30) in **15- or 30-minute** steps.  
- Enforce **no illegal overlaps** per your product rules (e.g. one active reservation per lane/game if that’s the rule).  
- If the current conflict rule is **store-wide overlap**, high daily counts may force **many short slots or multiple games** — generator must create enough **GameSlot** rows or relax test to “multiple parallel games.”

**Action for engineering:** Before generating 3,000 rows, confirm **capacity model** (per game vs per store) and seed enough slots/games so generation doesn’t fail.

---

## 3. Special bookings: birthday & corporate

### 3.1 Counts and mix

| Type | Count | Headcount rule | Notes |
|------|-------|----------------|--------|
| **Birthday** | **4** events | **5–30** participants each (random per event) | `bookingType = BIRTHDAY`; higher `participantCount`; optional premium `subtotalAmount` |
| **Corporate** | **4** events | **5–30** participants each (random) | `bookingType = CORPORATE`; weekday bias optional (e.g. 70% Tue–Thu) |
| **Standard** | Remainder of 3,000 | Typical **2–8** participants | `bookingType = STANDARD` |

**Placement:** scatter across the 61 days (not all on same day). Ensure at least **one** birthday and **one** corporate fall on a **high-volume day** (e.g. Saturday) to test reporting and desk load.

### 3.2 Data fields to validate

- `participantCount`, `adults` / `children`, `ageRange`  
- `bookingChannel`: mix `online` vs `walkin` for a subset  
- `lifecycle` / `paymentStatus`: see Section 5 for intentional variety  

---

## 4. Five employees: recommended schedule model

Treat **5 FTEs** as **floor + desk + float**. Operating example: **10:00–22:00** (12 h), **7 days/week** for the venue (adjust if you close Mondays).

### 4.1 Roles (map to your RBAC)

| Code | Role | Primary duties |
|------|------|----------------|
| **E1** | Floor lead / Owner proxy | Exceptions, refunds approval, escalations |
| **E2** | Front desk | Check-in/out, payments, phone |
| **E3** | Floor supervisor | Queue, safety, room turnover |
| **E4** | Games host | Session start, rules, crowd |
| **E5** | Cash / POS | Walk-ins, Razorpay issues, till |

### 4.2 Weekly shift pattern (example — adjust to labour law / contracts)

**Overlap rule:** at least **3 people on floor** during **peak** (12:00–20:00); **2 people** in first/last hour.

| Day | 10:00–14:00 | 14:00–18:00 | 18:00–22:00 |
|-----|-------------|-------------|-------------|
| Mon | E2, E5 | E2, E3, E4 | E3, E4, E5 |
| Tue | E2, E3 | E2, E3, E5 | E3, E4, E5 |
| Wed | E2, E4 | E2, E3, E5 | E3, E4, E5 |
| Thu | E2, E5 | E2, E3, E4 | E3, E4, E5 |
| Fri | E2, E3, E4 | E2, E3, E4, E5 | E3, E4, E5 |
| Sat | E2, E3, E4, E5 | E1, E2, E3, E4, E5 | E1, E3, E4, E5 |
| Sun | E2, E3, E5 | E1, E2, E3, E4 | E1, E3, E4, E5 |

- **E1 (owner/manager)** concentrated on **Fri–Sun** and **incident windows**.  
- **E5 (cash)** always present at **open** and **close** plus Fri–Sun peak.

### 4.3 How this ties to testing

- **Peak day (e.g. 80–100 bookings):** run a **simulated** hour where E2–E5 execute only **check-in** in the app for 20 consecutive reservations — measure UI latency and error rate.  
- **Corporate event day:** assign **E1 + E3** as dedicated party liaisons; verify **single large booking** doesn’t block unrelated small slots if architecture allows parallel games.

---

## 5. Functional & special-case scenarios (matrix)

Execute these **after** (or **during**) bulk load. Mark **Pass/Fail** and attach screenshots/logs.

### 5.1 Booking lifecycle

| ID | Scenario | Steps | Expected |
|----|----------|--------|----------|
| L1 | Happy path book + pay | Create reservation → record payment → `lifecycle` **PAID** | Balance **0**; check-in allowed if rules say paid-first |
| L2 | Book → **cancel** before pay | Customer/admin cancel | Status **CANCELLED**; slot capacity restored if applicable |
| L3 | Book → **partial pay** → pay rest | Two payments | `PARTIAL` then **PAID** |
| L4 | **Reschedule** once | Move to new slot | No double-book conflict; audit entry |
| L5 | Reschedule **blocked** | Try after check-out or cancel | Clear error |
| L6 | **Walk-in** vs online same slot | Walk-in reduces `availableSlots` | Online can’t overbook past capacity |
| L7 | **Block slot** | Admin blocks `GameSlot` | New bookings rejected; existing handled per policy |

### 5.2 Payments & gateway (when Razorpay E2E exists)

| ID | Scenario | Expected |
|----|----------|----------|
| P1 | Order created with `notes.reservationId` | Webhook creates **one** `Payment` |
| P2 | Duplicate webhook | Idempotent; no double `Payment` |
| P3 | Failed payment | Reservation stays unpaid; customer messaging correct |

### 5.3 RBAC (sample)

| ID | Actor | Action | Expected |
|----|-------|--------|----------|
| R1 | Floor supervisor | Check-in only | OK |
| R2 | Floor supervisor | Block slot | **403** if policy denies |
| R3 | Owner | Delete / sensitive ops | OK |

### 5.4 Reporting & exports

| ID | Check | Expected |
|----|--------|----------|
| X1 | Dashboard date range includes load window | KPIs non-zero, performance acceptable |
| X2 | CSV export **bookings** | 3,000 rows + headers; open in Excel |
| X3 | CSV **payments** | Matches paid subset |
| X4 | Occupancy buckets | Weekend peaks visible |

### 5.5 Failure / chaos (staging only)

| ID | Scenario | Expected |
|----|----------|----------|
| C1 | Kill DB mid-batch insert | Partial data documented; recovery procedure |
| C2 | Invalid JWT on admin | Redirect to `/admin/login` |
| C3 | 100 rapid API calls same slot | Rate limit or consistent errors; no corrupt state |

---

## 6. Execution phases (recommended order)

| Phase | Duration | Activity |
|-------|----------|----------|
| **P0** | 0.5 d | Confirm DB (Postgres for real stress), backup, feature flags |
| **P1** | 1 d | Generate **slots** + **3,000** bookings (script); validate counts |
| **P2** | 1 d | Manual + automated **scenario matrix** (Section 5) |
| **P3** | 0.5 d | **Peak hour** desk simulation; record p95 latency |
| **P4** | 0.5 d | Reporting & CSV validation; spot-audit 20 random bookings |
| **P5** | 0.5 d | Sign-off meeting; file defects |

---

## 7. Observability & pass criteria

### 7.1 Metrics to capture

- API **p50/p95** for: list reservations, dashboard, check-in, export CSV  
- DB size, slow queries (if Postgres: `pg_stat_statements`)  
- Error rate from app logs; failed webhooks count  
- **Time to generate** 3,000 rows (batch insert target: minutes, not hours)

### 7.2 Pass / fail gates (suggested)

| Gate | Criterion |
|------|-----------|
| **G1** | Exactly **3,000** reservations; daily counts all in **[5, 100]** |
| **G2** | **8** special events (4 birthday + 4 corporate), headcount 5–30 |
| **G3** | **Zero** unexplained duplicate `reference` / payment for same webhook id |
| **G4** | Critical scenarios **L1–L7** all **Pass** |
| **G5** | CSV export completes &lt; **120 s** on staging hardware (tune to your SLA) |

---

## 8. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| SQLite locks / slow writes | Use **Postgres** for stress; or batch transactions |
| Conflict rules reject bulk insert | Pre-create slots; stagger `startAt`; or relax test to multi-game |
| Generator bugs skew counts | Use **fixed RNG seed**; checksum `sum(daily)` = 3000 |
| UAT noise | Separate **staging** DB from demo seed |

---

## 9. Deliverables from engineering

1. **Stress seed (implemented):** from `web/` run `npm run prisma:seed:stress` — creates **3,000** `RSV-ST-*` reservations, 61 days, **5–100/day**, 4 birthday + 4 corporate (5–30 pax), parallel arenas. Requires `npm run prisma:seed` once for store `KORA`.  
2. **Runbook:** one command + env vars + expected runtime.  
3. **Test report:** CSV of daily counts, scenario matrix filled, metrics from §7.1.

---

## 10. Owner sign-off checklist

- [ ] 2-month window and **3,000** total confirmed in script output  
- [ ] Daily **min 5 / max 100** verified  
- [ ] **4 birthday + 4 corporate** present with 5–30 pax  
- [ ] **5-employee** schedule reviewed with GM (Section 4)  
- [ ] Cancel / reschedule / pay / block scenarios exercised  
- [ ] Reporting & exports sanity-checked  
- [ ] Decision recorded: SQLite vs Postgres for this test  

---

## Appendix A — Quick count reference

| Metric | Value |
|--------|--------|
| Days | 61 |
| Total bookings | 3,000 |
| Avg / day | ~49.2 |
| Birthday events | 4 |
| Corporate events | 4 |
| Staff (example roster) | 5 |

---

*Document version: 1.0 — for owner review; adjust dates, hours, and gates to match your venue contract and staging environment.*
