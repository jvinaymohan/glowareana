/** Shared limits for API payloads (production hardening). */
export const LIMITS = {
  customerNameMax: 120,
  customerNameMin: 2,
  phoneMax: 32,
  phoneMin: 8,
  emailMax: 254,
  notesMax: 2000,
  blockNoteMax: 500,
} as const;

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function sanitizeName(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = raw.trim().replace(/\s+/g, " ");
  if (v.length < LIMITS.customerNameMin) {
    return { ok: false, error: "Please enter a valid name" };
  }
  if (v.length > LIMITS.customerNameMax) {
    return { ok: false, error: "Name is too long" };
  }
  return { ok: true, value: v };
}

/** Keep digits and leading +; min length after strip. */
export function sanitizePhone(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  const normalized = trimmed.replace(/[\s().-]/g, "");
  if (normalized.length < LIMITS.phoneMin || normalized.length > LIMITS.phoneMax) {
    return { ok: false, error: "Please enter a valid phone number" };
  }
  if (!/^\+?[0-9]{7,20}$/.test(normalized)) {
    return { ok: false, error: "Please enter a valid phone number" };
  }
  return { ok: true, value: trimmed.slice(0, LIMITS.phoneMax) };
}

export function sanitizeEmail(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = raw.trim();
  if (!v) return { ok: true, value: "" };
  if (v.length > LIMITS.emailMax) {
    return { ok: false, error: "Email is too long" };
  }
  if (!EMAIL_RE.test(v)) {
    return { ok: false, error: "Please enter a valid email address" };
  }
  return { ok: true, value: v };
}

export function sanitizeNotes(raw: string, max: number): string {
  return raw.trim().slice(0, max);
}
