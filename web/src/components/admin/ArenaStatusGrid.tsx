"use client";

export type ArenaDayRow = {
  gameId: string;
  name: string;
  arenaLabel: string;
  slotsToday: number;
  blocked: number;
  booked: number;
  available: number;
  inUse: number;
};

function CardTone(row: ArenaDayRow): "idle" | "blocked" | "live" | "open" {
  if (row.slotsToday === 0) return "idle";
  if (row.blocked > 0 && row.booked === 0 && row.available === 0) return "blocked";
  if (row.inUse > 0) return "live";
  return "open";
}

const toneStyles: Record<
  ReturnType<typeof CardTone>,
  { border: string; badge: string; label: string }
> = {
  idle: {
    border: "border-zinc-600/50",
    badge: "bg-zinc-700 text-zinc-300",
    label: "No sessions today",
  },
  blocked: {
    border: "border-rose-500/40",
    badge: "bg-rose-900/60 text-rose-200",
    label: "Blocked / closed",
  },
  live: {
    border: "border-amber-400/50",
    badge: "bg-amber-900/50 text-amber-200",
    label: "In use",
  },
  open: {
    border: "border-emerald-500/35",
    badge: "bg-emerald-900/40 text-emerald-200",
    label: "Available slots",
  },
};

export function ArenaStatusGrid({
  arenas,
  title = "Arena layout (today)",
}: {
  arenas: ArenaDayRow[];
  title?: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Color key: emerald = open capacity, amber = checked-in / live, rose = blocked, zinc = no schedule.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {arenas.map((row) => {
          const tone = CardTone(row);
          const st = toneStyles[tone];
          return (
            <div
              key={row.gameId}
              className={`flex flex-col rounded-xl border ${st.border} bg-black/30 p-3 shadow-inner`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    {row.arenaLabel}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{row.name}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${st.badge}`}>
                  {st.label}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-zinc-400">
                <dt>Slots</dt>
                <dd className="text-right tabular-nums text-zinc-200">{row.slotsToday}</dd>
                <dt>Available</dt>
                <dd className="text-right tabular-nums text-emerald-300">{row.available}</dd>
                <dt>Booked</dt>
                <dd className="text-right tabular-nums text-cyan-200">{row.booked}</dd>
                <dt>Blocked</dt>
                <dd className="text-right tabular-nums text-rose-300">{row.blocked}</dd>
                {row.inUse > 0 ? (
                  <>
                    <dt>In use</dt>
                    <dd className="text-right tabular-nums text-amber-200">{row.inUse}</dd>
                  </>
                ) : null}
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}
