# Razorpay integration guide (Glow Arena)

This app uses **Razorpay Orders API** (server), **Razorpay Checkout** (browser), and a **webhook** to record captured payments against reservations. Amounts are always taken from the **database** on the server, never from the client.

---

## 1. What is implemented

| Piece | Location / behavior |
|-------|---------------------|
| **Create order** | `POST /api/v2/customer/payments/razorpay/order` — body `{ reservationId }`. Requires logged-in customer; order amount = **open balance** in INR × 100 (paise). Order `notes` include `reservationId` and `reference`. |
| **Checkout UI** | `/platform/customer` — **Pay with Razorpay** opens Checkout when `NEXT_PUBLIC_RAZORPAY_ENABLED=1`. |
| **Webhook** | `POST /api/v2/payments/razorpay/webhook` — verifies `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET`, processes **`payment.captured`** (and captured status), writes `Payment`, updates reservation balances idempotently. |
| **Kill switch** | Omit `NEXT_PUBLIC_RAZORPAY_ENABLED` or set to `0` to hide pay buttons in the customer portal (orders API still requires key/secret if called directly). |

---

## 2. Razorpay Dashboard setup

### 2.1 Account and mode

1. Sign in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Use **Test Mode** for development (toggle in dashboard). Use **Live Mode** only after compliance and bank KYC for production.

### 2.2 API keys (Orders + Checkout)

1. Go to **Account & Settings** → **API Keys** (or **Developers** → **API Keys**, depending on dashboard version).
2. Generate **Key Id** and **Key Secret** for the active mode (test or live).
3. Set in your environment (never commit secrets):

   - `RAZORPAY_KEY_ID` — e.g. `rzp_test_...` or `rzp_live_...`
   - `RAZORPAY_KEY_SECRET` — server-only

### 2.3 Webhook secret

1. Go to **Account & Settings** → **Webhooks** → **Add New Webhook**.
2. **Webhook URL** (production example):

   `https://<your-domain>/api/v2/payments/razorpay/webhook`

3. Create a **secret** for signing (store as `RAZORPAY_WEBHOOK_SECRET`). The app uses this to verify `X-Razorpay-Signature` on the **raw** request body.
4. **Active events** — enable at minimum:

   - **`payment.captured`**

   (Orders use automatic capture; captured is the event that confirms money for the integration path used here.)

5. Save the webhook. Razorpay will send a **signing secret** — that value is `RAZORPAY_WEBHOOK_SECRET`.

### 2.4 Local / staging webhook URL

Razorpay must reach a **public HTTPS** URL. For local dev, use a tunnel:

- [ngrok](https://ngrok.com/): `ngrok http 3000` → use `https://xxxx.ngrok-free.app/api/v2/payments/razorpay/webhook`
- Register that URL in **Test Mode** webhooks and use test keys in `.env.local`.

---

## 3. Application environment variables

Add to **`web/.env.local`** (or your host’s secret manager).

| Variable | Required | Description |
|----------|----------|-------------|
| `RAZORPAY_KEY_ID` | Yes (for payments) | From dashboard API keys. |
| `RAZORPAY_KEY_SECRET` | Yes (for payments) | Server-only; creates orders. |
| `RAZORPAY_WEBHOOK_SECRET` | Yes (for webhook) | From webhook configuration; signature verification. Without it, webhook returns **401 Invalid signature** (by design). |
| `NEXT_PUBLIC_RAZORPAY_ENABLED` | For UI | Set to **`1`** to show **Pay with Razorpay** on `/platform/customer`. |
| `NEXT_PUBLIC_RAZORPAY_DISPLAY_NAME` | Optional | Business name shown in Checkout (default: `Glow Arena`). |

**Production:** set the same variables on Vercel / your host for the **`web`** project. Use **live** keys and a **live** webhook URL when going live.

---

## 4. Enable integration (checklist)

1. **Database** running and migrated (`npx prisma migrate deploy`).
2. **Customer account** linked to reservations (`userId` on reservation) — only the owning user can create an order for that reservation.
3. Set **`RAZORPAY_KEY_ID`**, **`RAZORPAY_KEY_SECRET`**, **`RAZORPAY_WEBHOOK_SECRET`**.
4. Register webhook URL; confirm **`payment.captured`** is enabled.
5. Set **`NEXT_PUBLIC_RAZORPAY_ENABLED=1`** (and optional display name).
6. Restart **`npm run dev`** or redeploy so env is picked up.
7. Test: `/platform/customer` → login → **Load my reservations** → **Pay with Razorpay** on a row with balance → complete test payment → refresh list; **payment status** should move toward paid after webhook delivery.

---

## 5. End-to-end test (test mode)

1. Use Razorpay **test** cards from [Payments test data](https://razorpay.com/docs/payments/payments/test-card-details/) (e.g. success card for your region).
2. Create a booking with an outstanding **balance** (customer v2 reservation).
3. Pay via Checkout.
4. In Razorpay Dashboard → **Payments**, confirm payment is **captured**.
5. In your DB (or admin UI), confirm **`Payment`** row and updated **`Reservation.paidAmount` / `balanceAmount` / `paymentStatus`**.
6. In **Webhooks** → **Logs**, confirm delivery **200** to your endpoint. If not, check tunnel URL, secret, and server logs.

---

## 6. Security notes

- **Key secret** and **webhook secret** must only exist on the **server** / hosting env — never in client bundles (do not prefix with `NEXT_PUBLIC_` except the enable flag and display name).
- Order **amount** is computed server-side from **`balanceAmount`**; the client cannot choose a lower amount.
- Webhook handler is **idempotent**: duplicate `eventId` or duplicate `razorpayPaymentId` is handled safely.
- For stricter hardening later, add **server-side verification** of `razorpay_signature` in the Checkout `handler` using Razorpay’s documented HMAC (optional; webhook remains the accounting source of truth here).

---

## 7. Troubleshooting

| Symptom | What to check |
|---------|----------------|
| “Razorpay is not configured” | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` missing or wrong deploy. |
| Pay button hidden | `NEXT_PUBLIC_RAZORPAY_ENABLED=1` not set; rebuild Next.js after changing. |
| Webhook **401** | `RAZORPAY_WEBHOOK_SECRET` mismatch; body altered by proxy (must be raw body). |
| Webhook **400** Malformed | Payment payload missing `notes.reservationId`. Order creation sets notes; Checkout passes `notes` again client-side. If still missing, inspect webhook JSON in Razorpay logs. |
| Payment succeeds but booking not updated | Webhook not reaching app (localhost without tunnel); wrong URL; event not subscribed; check `PaymentWebhookEvent` / server logs. |
| “Could not load Razorpay Checkout” | Network/ad-block; `https://checkout.razorpay.com/v1/checkout.js` blocked. |

---

## 8. Related files

- `src/lib/platform/services/razorpay-orders.ts` — Orders API
- `src/lib/platform/services/payments.ts` — Webhook verify + ledger update
- `src/app/api/v2/payments/razorpay/webhook/route.ts` — Webhook route
- `src/app/api/v2/customer/payments/razorpay/order/route.ts` — Customer order API
- `src/lib/razorpay-client.ts` — Checkout.js loader
- `src/app/platform/customer/page.tsx` — Checkout trigger

---

## 9. Going live

1. Complete Razorpay **live** activation and KYC.
2. Create **live** API keys and **live** webhook with your **production** HTTPS URL.
3. Run a **small real transaction** and reconcile with the dashboard and your reports.
4. Document refund and chargeback handling with ops (ledger updates may be manual or extended in a later change).
