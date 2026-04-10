"use client";

import { useMemo, useState } from "react";
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from "@/components/admin/SimpleCharts";

type SummaryResponse = {
  kpis?: Record<string, number>;
  occupancyByDayTime?: Array<{ bucket: string; sessions: number; participants: number }>;
  occupancyTruncated?: boolean;
  revenueByBookingType?: Record<string, number>;
  exportHint?: string;
  error?: string;
};

export default function PlatformAdminReportsPage() {
  const [storeId, setStoreId] = useState("");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 95);
    return d.toISOString().slice(0, 10);
  });
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    const q = new URLSearchParams({ from, to });
    if (storeId.trim()) q.set("storeId", storeId.trim());
    return q.toString();
  }, [from, to, storeId]);

  async function runReport() {
    const r = await fetch(`/api/v2/admin/reports/summary?${qs}`, { credentials: "include" });
    const j = (await r.json().catch(() => ({}))) as SummaryResponse;
    if (!r.ok) {
      setError(j.error ?? "Failed to fetch reports");
      return;
    }
    setData(j);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-white">
      <h1 className="text-2xl font-bold">Admin Reports</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Occupancy, revenue segmentation, and CSV exports for bookings/payments/promotions.
      </p>

      <div className="mt-6 grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-4">
        <input className="rounded bg-black/40 px-3 py-2" value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="storeId (optional for Owner)" />
        <input className="rounded bg-black/40 px-3 py-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="rounded bg-black/40 px-3 py-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="rounded bg-emerald-600 px-3 py-2" onClick={() => void runReport()}>Run report</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <a className="rounded bg-white/10 px-3 py-2 hover:bg-white/20" href={`/api/v2/admin/reports/export?type=bookings&${qs}`} target="_blank" rel="noreferrer">Export bookings CSV</a>
        <a className="rounded bg-white/10 px-3 py-2 hover:bg-white/20" href={`/api/v2/admin/reports/export?type=payments&${qs}`} target="_blank" rel="noreferrer">Export payments CSV</a>
        <a className="rounded bg-white/10 px-3 py-2 hover:bg-white/20" href={`/api/v2/admin/reports/export?type=promo&${qs}`} target="_blank" rel="noreferrer">Export promo usage CSV</a>
        <a className="rounded bg-cyan-900/40 px-3 py-2 hover:bg-cyan-900/60" href={`/api/v2/admin/reports/executive-pdf?${qs}`} target="_blank" rel="noreferrer">Executive PDF</a>
        <a className="rounded bg-violet-900/40 px-3 py-2 hover:bg-violet-900/60" href={`/api/v2/admin/reports/export-xlsx?${qs}`} target="_blank" rel="noreferrer">Excel workbook (.xlsx)</a>
      </div>

      {data?.kpis ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {Object.entries(data.kpis).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase text-zinc-400">{k}</p>
              <p className="mt-1 text-xl font-semibold">{v}</p>
            </div>
          ))}
        </div>
      ) : null}

      {data?.revenueByBookingType ? (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Revenue by category</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <SimplePieChart
              title="Mix by booking type"
              slices={Object.entries(data.revenueByBookingType)
                .filter(([, v]) => v > 0)
                .map(([label, value]) => ({ label, value }))}
            />
            <SimpleBarChart
              title="Gross booking value by type"
              items={Object.entries(data.revenueByBookingType).map(([label, value]) => ({
                label,
                value,
              }))}
            />
          </div>
        </div>
      ) : null}

      {data?.occupancyByDayTime && data.occupancyByDayTime.length > 0 ? (
        <div className="mt-6">
          <SimpleLineChart
            title="Sessions by time bucket (sample)"
            points={data.occupancyByDayTime.slice(-24).map((o) => ({
              label: o.bucket.slice(5, 16),
              value: o.sessions,
            }))}
          />
        </div>
      ) : null}

      {data?.occupancyTruncated ? (
        <p className="mt-2 text-xs text-amber-200/90">
          Occupancy table capped at 500 rows — use CSV export for full detail.
        </p>
      ) : null}

      {data?.occupancyByDayTime?.length ? (
        <div className="mt-6 rounded-xl border border-white/10 p-4">
          <h2 className="text-lg font-semibold">Occupancy by day/time</h2>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-zinc-400">
                <tr>
                  <th className="px-2 py-1">Bucket</th>
                  <th className="px-2 py-1">Sessions</th>
                  <th className="px-2 py-1">Participants</th>
                </tr>
              </thead>
              <tbody>
                {data.occupancyByDayTime.map((r) => (
                  <tr key={r.bucket} className="border-t border-white/10">
                    <td className="px-2 py-1">{r.bucket}</td>
                    <td className="px-2 py-1">{r.sessions}</td>
                    <td className="px-2 py-1">{r.participants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
