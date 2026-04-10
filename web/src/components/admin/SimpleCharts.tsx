"use client";

import type React from "react";

type BarItem = { label: string; value: number; color?: string };

export function SimpleBarChart({
  title,
  items,
  valuePrefix = "",
}: {
  title: string;
  items: BarItem[];
  valuePrefix?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4" role="img" aria-label={title}>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate text-zinc-400" title={row.label}>
              {row.label}
            </span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${(row.value / max) * 100}%`,
                  backgroundColor: row.color ?? "#34d399",
                }}
              />
            </div>
            <span className="w-20 shrink-0 text-right tabular-nums text-zinc-300">
              {valuePrefix}
              {row.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SimpleLineChart({
  title,
  points,
}: {
  title: string;
  points: Array<{ label: string; value: number }>;
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <p className="mt-3 text-xs text-zinc-500">No time-series data in this range.</p>
      </div>
    );
  }
  const max = Math.max(1, ...points.map((p) => p.value));
  const w = 320;
  const h = 120;
  const pad = 8;
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - (p.value / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${coords.join(" L ")}`;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4" role="img" aria-label={title}>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-3 w-full max-w-full text-cyan-400"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{title}</title>
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => {
          const x = pad + i * step;
          const y = h - pad - (p.value / max) * (h - pad * 2);
          return <circle key={p.label} cx={x} cy={y} r="3" fill="currentColor" />;
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-zinc-500">
        {points.slice(0, 8).map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
        {points.length > 8 ? <span>…</span> : null}
      </div>
    </div>
  );
}

const PIE_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#fb923c"];

export function SimplePieChart({
  title,
  slices,
}: {
  title: string;
  slices: Array<{ label: string; value: number }>;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <p className="mt-3 text-xs text-zinc-500">No segmented revenue in this range.</p>
      </div>
    );
  }
  const r = 52;
  const cx = 60;
  const cy = 60;
  let angle = -Math.PI / 2;
  const arcs: React.ReactNode[] = [];
  slices.forEach((sl, i) => {
    const frac = sl.value / total;
    const a0 = angle;
    const a1 = angle + frac * Math.PI * 2;
    angle = a1;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = frac > 0.5 ? 1 : 0;
    const color = PIE_COLORS[i % PIE_COLORS.length];
    arcs.push(
      <path
        key={sl.label}
        d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`}
        fill={color}
        opacity={0.9}
      />,
    );
  });

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4" role="img" aria-label={title}>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <div className="mt-3 flex flex-wrap items-start gap-4">
        <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0">
          <title>{title}</title>
          {arcs}
        </svg>
        <ul className="min-w-0 flex-1 space-y-1 text-xs">
          {slices.map((sl, i) => (
            <li key={sl.label} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="truncate text-zinc-400">{sl.label}</span>
              <span className="ml-auto tabular-nums text-zinc-200">
                {Math.round((sl.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
