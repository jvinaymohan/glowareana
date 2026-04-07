import { Resend } from "resend";
import twilio from "twilio";
import type { StoredBooking } from "@/lib/arena-store";

export type BookingNotificationResult = {
  emailSent: boolean;
  smsSent: boolean;
  emailMessage?: string;
  smsMessage?: string;
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSmsBody(b: StoredBooking): string {
  const line = `Glow Arena: ${b.reference} — ${b.gameTitle} on ${b.date} ${b.slotLabel}. Est. ₹${b.payableInr.toLocaleString("en-IN")}.`;
  return line.length > 1600 ? `${line.slice(0, 1597)}…` : line;
}

function buildEmailHtml(b: StoredBooking): string {
  const ref = escHtml(b.reference);
  const title = escHtml(b.gameTitle);
  const when = `${escHtml(b.date)} · ${escHtml(b.slotLabel)}`;
  const name = escHtml(b.customerName);
  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0b0b12;color:#e4e4e7;padding:24px;margin:0;">
  <div style="max-width:480px;margin:0 auto;">
    <h1 style="font-size:20px;color:#f97316;margin:0 0 8px;">Booking confirmed</h1>
    <p style="font-size:22px;font-weight:700;color:#38bdf8;margin:0 0 16px;">${ref}</p>
    <p style="margin:0 0 8px;">Hi ${name},</p>
    <p style="margin:0 0 8px;">${title}</p>
    <p style="margin:0 0 8px;">${when}</p>
    <p style="margin:0 0 8px;">${b.kidCount} kid(s) · Est. total ₹${b.payableInr.toLocaleString("en-IN")}</p>
    <p style="color:#a1a1aa;font-size:14px;margin:24px 0 0;">Thank you for choosing Glow Arena.</p>
  </div>
</body>
</html>`;
}

export async function deliverBookingNotifications(
  booking: StoredBooking,
  opts: { email: boolean; sms: boolean },
): Promise<BookingNotificationResult> {
  const out: BookingNotificationResult = {
    emailSent: false,
    smsSent: false,
  };

  if (opts.email) {
    const addr = booking.email.trim();
    if (!addr) {
      out.emailMessage = "No email on booking";
    } else {
      const key = process.env.RESEND_API_KEY;
      if (!key) {
        out.emailMessage =
          "Email not configured (set RESEND_API_KEY and BOOKING_FROM_EMAIL)";
      } else {
        try {
          const resend = new Resend(key);
          const from =
            process.env.BOOKING_FROM_EMAIL?.trim() ||
            "Glow Arena <onboarding@resend.dev>";
          await resend.emails.send({
            from,
            to: addr,
            subject: `Booking confirmed — ${booking.reference}`,
            html: buildEmailHtml(booking),
          });
          out.emailSent = true;
        } catch (e) {
          out.emailMessage =
            e instanceof Error ? e.message : "Email send failed";
        }
      }
    }
  }

  if (opts.sms) {
    const to = booking.phone.trim();
    if (!to) {
      out.smsMessage = "No phone on booking";
    } else {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const fromNum = process.env.TWILIO_FROM_NUMBER;
      if (!sid || !token || !fromNum) {
        out.smsMessage =
          "SMS not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)";
      } else {
        try {
          const client = twilio(sid, token);
          await client.messages.create({
            body: buildSmsBody(booking),
            from: fromNum,
            to,
          });
          out.smsSent = true;
        } catch (e) {
          out.smsMessage =
            e instanceof Error ? e.message : "SMS send failed";
        }
      }
    }
  }

  return out;
}
