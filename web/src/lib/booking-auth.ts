/** Path used when auth should return the user to the booking flow. */
export const BOOK_PATH = "/book";

/** Single `/login` entry — use `signup` to open the create-account tab. */
export function bookingAuthHref(opts?: { signup?: boolean }): string {
  const q = new URLSearchParams();
  q.set("next", BOOK_PATH);
  if (opts?.signup) q.set("mode", "signup");
  return `/login?${q.toString()}`;
}
