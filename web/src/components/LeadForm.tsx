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

  const fieldInput =
    "mt-1.5 min-h-[48px] w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-base text-white outline-none focus:border-[var(--ga-blue)] sm:min-h-0 sm:py-2 sm:text-sm";

  if (sent) {
    return (
      <div className="rounded-xl border border-[var(--ga-blue)]/40 bg-[var(--ga-blue)]/10 p-5 text-center sm:p-6">
        <p className="font-medium text-white">Thanks — prototype only</p>
        <p className="mt-2 text-sm text-zinc-400">
          No data was sent. Wire this form to your CRM or email in production.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 min-h-[44px] text-sm text-[var(--ga-blue)] touch-manipulation hover:underline"
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
          <input required name="name" className={fieldInput} placeholder="Your name" />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Phone</span>
          <input
            required
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={fieldInput}
            placeholder="+91 …"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-zinc-400">Email</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={fieldInput}
          placeholder="you@example.com"
        />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-400">Message</span>
        <textarea
          required
          name="message"
          rows={4}
          className={`${fieldInput} min-h-[120px] resize-y py-3`}
          placeholder="Dates, headcount, package interest…"
        />
      </label>
      <button
        type="submit"
        className="w-full min-h-[48px] rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] py-3.5 text-base font-semibold text-[#0b0b12] touch-manipulation active:brightness-95 sm:w-auto sm:px-8 sm:text-sm"
      >
        {submitLabel}
      </button>
    </form>
  );
}
