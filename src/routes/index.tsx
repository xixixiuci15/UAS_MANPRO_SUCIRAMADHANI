import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, MapPin, Target, TrendingDown, ListChecks } from "lucide-react";

import { Shell } from "@/components/Shell";
import {
  DATA,
  KECAMATAN,
  PERIODE,
  PROGRAM,
  aggregate,
  slugify,
  statusOf,
  type Periode,
  type Program,
} from "@/lib/simonev-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SIMONEV-KD" },
      { name: "description", content: "Dashboard monitoring target vs realisasi program prioritas per kecamatan Kota Depok." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [periode, setPeriode] = useState<Periode | "ALL">("Q2");
  const [wilayah, setWilayah] = useState<string>("ALL");
  const [program, setProgram] = useState<Program | "ALL">("ALL");

  const filtered = useMemo(
    () =>
      DATA.filter(
        (r) =>
          (periode === "ALL" || r.periode === periode) &&
          (wilayah === "ALL" || r.kecamatan === wilayah) &&
          (program === "ALL" || r.program === program),
      ),
    [periode, wilayah, program],
  );

  const perKec = useMemo(() => {
    return KECAMATAN.map((k) => {
      const rows = filtered.filter((r) => r.kecamatan === k);
      const agg = aggregate(rows);
      return { kecamatan: k, ...agg };
    });
  }, [filtered]);

  const avg =
    perKec.reduce((a, r) => a + (isFinite(r.pct) ? r.pct : 0), 0) /
    (perKec.length || 1);
  const dibawah = perKec.filter((r) => r.pct < 75).length;

  return (
    <Shell
      title="Dashboard Monitoring"
      subtitle="Capaian program prioritas per kecamatan — Kota Depok"
    >
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Wilayah" value="11" hint="Kecamatan terpantau" icon={<MapPin className="h-5 w-5" />} tone="primary" />
        <StatCard label="Rata-rata Capaian" value={`${avg.toFixed(1)}%`} hint="Seluruh wilayah pada filter aktif" icon={<Target className="h-5 w-5" />} tone="primary" />
        <StatCard label="Wilayah di Bawah Target" value={String(dibawah)} hint="Capaian < 75%" icon={<TrendingDown className="h-5 w-5" />} tone="accent" />
        <StatCard label="Program Prioritas" value={String(PROGRAM.length)} hint="Tematik termonitor" icon={<ListChecks className="h-5 w-5" />} tone="primary" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Periode" value={periode} onChange={(v) => setPeriode(v as Periode | "ALL")}
            options={[{ v: "ALL", l: "Semua Periode" }, ...PERIODE.map((p) => ({ v: p, l: p }))]} />
          <Select label="Wilayah" value={wilayah} onChange={setWilayah}
            options={[{ v: "ALL", l: "Semua Kecamatan" }, ...KECAMATAN.map((k) => ({ v: k, l: k }))]} />
          <Select label="Program Prioritas" value={program} onChange={(v) => setProgram(v as Program | "ALL")}
            options={[{ v: "ALL", l: "Semua Program" }, ...PROGRAM.map((p) => ({ v: p, l: p }))]} />
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Target vs Realisasi per Kecamatan</h2>
            <p className="text-xs text-muted-foreground">
              {program === "ALL" ? "Agregat semua program" : program} ·{" "}
              {periode === "ALL" ? "Semua periode" : periode}
            </p>
          </div>
          <Legend2 />
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <BarChart data={perKec.map((r) => ({ kec: r.kecamatan, Target: r.target, Realisasi: r.realisasi }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
              <XAxis dataKey="kec" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "oklch(0.95 0.01 250 / 0.6)" }} />
              <Bar dataKey="Target" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Realisasi" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-foreground">Perbandingan Target vs Realisasi</h2>
          <p className="text-xs text-muted-foreground">Status dihitung otomatis dari capaian (%).</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Kecamatan</Th>
                <Th>Program</Th>
                <Th className="text-right">Target</Th>
                <Th className="text-right">Realisasi</Th>
                <Th className="text-right">Gap</Th>
                <Th className="text-right">% Capaian</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">Tidak ada data untuk filter ini.</td></tr>
              )}
              {filtered.map((r, i) => {
                const pct = r.target === 0 ? 0 : (r.realisasi / r.target) * 100;
                const gap = r.target - r.realisasi;
                return (
                  <tr key={i} className="border-t hover:bg-muted/30">
                    <Td className="font-medium">{r.kecamatan}</Td>
                    <Td>{r.program}</Td>
                    <Td className="text-right tabular-nums">{r.target.toLocaleString("id-ID")}</Td>
                    <Td className="text-right tabular-nums">{r.realisasi.toLocaleString("id-ID")}</Td>
                    <Td className={`text-right tabular-nums ${gap > 0 ? "text-foreground" : "text-[var(--success)]"}`}>{gap.toLocaleString("id-ID")}</Td>
                    <Td className="text-right tabular-nums font-semibold">{pct.toFixed(1)}%</Td>
                    <Td><StatusBadge pct={pct} /></Td>
                    <Td>
                      <Link
                        to="/wilayah/$slug"
                        params={{ slug: slugify(r.kecamatan) }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Detail <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}

function StatCard({
  label, value, hint, icon, tone,
}: { label: string; value: string; hint: string; icon: React.ReactNode; tone: "primary" | "accent" }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div
          className={`grid h-10 w-10 place-items-center rounded-lg ${
            tone === "primary"
              ? "bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] text-primary"
              : "bg-[color-mix(in_oklch,var(--accent)_15%,transparent)] text-[var(--accent)]"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}

export function StatusBadge({ pct }: { pct: number }) {
  const s = statusOf(pct);
  const map = {
    tercapai: { label: "Tercapai", cls: "bg-[color-mix(in_oklch,var(--success)_15%,white)] text-[color-mix(in_oklch,var(--success)_80%,black)] ring-[color-mix(in_oklch,var(--success)_40%,transparent)]" },
    mendekati: { label: "Mendekati", cls: "bg-[color-mix(in_oklch,var(--accent)_15%,white)] text-[color-mix(in_oklch,var(--accent)_70%,black)] ring-[color-mix(in_oklch,var(--accent)_40%,transparent)]" },
    dibawah: { label: "Di Bawah Target", cls: "bg-[color-mix(in_oklch,var(--destructive)_12%,white)] text-[color-mix(in_oklch,var(--destructive)_75%,black)] ring-[color-mix(in_oklch,var(--destructive)_35%,transparent)]" },
  }[s];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${map.cls}`}>
      {map.label}
    </span>
  );
}

function Legend2() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-primary" /> Target</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[var(--accent)]" /> Realisasi</span>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-3 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 ${className}`}>{children}</td>;
}
