import { redirect } from "next/navigation";

/** Legacy URL — registration lives on `/login` (Create account tab). */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  q.set("mode", "signup");
  if (sp.next) q.set("next", sp.next);
  redirect(`/login?${q.toString()}`);
}
