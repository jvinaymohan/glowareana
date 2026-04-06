"use client";

import { useState } from "react";

type LeadFormProps = {
  context: string;
  submitLabel?: string;
};

export function LeadForm({ context, submitLabel = "Send enquiry" }: LeadFormProps) {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-[var(--ga-blue)]/40 bg-[var(--ga-blue)]/10 p-6 text-center">
        <p className="font-medium text-white">Thanks — prototype only</p>
        <p className="mt-2 text-sm text-zinc-400">
          No data was sent. Wire this form to your CRM or email in production.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-sm text-[var(--ga-blue)] hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {context}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-400">Name</span>
          <input
            required
            name="name"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
            placeholder="Your name"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Phone</span>
          <input
            required
            name="phone"
            type="tel"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
            placeholder="+91 …"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-zinc-400">Email</span>
        <input
          name="email"
          type="email"
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
          placeholder="you@example.com"
        />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-400">Message</span>
        <textarea
          required
          name="message"
          rows={4}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
          placeholder="Dates, headcount, package interest…"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] py-3 text-sm font-semibold text-[#0b0b12] sm:w-auto sm:px-8"
      >
        {submitLabel}
      </button>
    </form>
  );
}
