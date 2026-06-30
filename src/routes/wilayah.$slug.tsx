import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Shell } from "@/components/Shell";
import { DATA, PERIODE, PROGRAM, aggregate, unslug } from "@/lib/simonev-data";
import { StatusBadge } from "./index";

export const Route = createFileRoute("/wilayah/$slug")({
  loader: ({ params }) => {
    const kec = unslug(params.slug);
    if (!kec) throw notFound();
    return { kec };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.kec ?? "Wilayah"} — SIMONEV-KD` }],
  }),
  component: WilayahDetail,
});

function WilayahDetail() {
  const { kec } = Route.useLoaderData();
  const periods = PERIODE.filter((p) => p !== "Q4");

  const trend = periods.map((p) => {
    const sub = DATA.filter((r) => r.kecamatan === kec && r.periode === p);
    const overall = aggregate(sub);
    const row: Record<string, string | number> = { periode: p, "Rata-rata": Number(overall.pct.toFixed(1)) };
    for (const prog of PROGRAM) {
      const ps = sub.filter((r) => r.program === prog);
      row[prog] = Number(aggregate(ps).pct.toFixed(1));
    }
    return row;
  });

  const breakdown = periods.flatMap((p) =>
    PROGRAM.map((prog) => {
      const rows = DATA.filter((r) => r.kecamatan === kec && r.periode === p && r.program === prog);
      const a = aggregate(rows);
      return { periode: p, program: prog, ...a };
    }),
  );

  const konsistenBawah = periods.every((p) => {
    const sub = DATA.filter((r) => r.kecamatan === kec && r.periode === p);
    return aggregate(sub).pct < 75;
  });

  const colors = ["var(--primary)", "var(--accent)", "var(--success)", "var(--destructive)"];

  return (
    <Shell title={`Kecamatan ${kec}`} subtitle="Tren capaian Q1–Q3 dan breakdown per program">
      <Link to="/wilayah" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar wilayah
      </Link>

      {konsistenBawah && (
        <div className="flex items-start gap-3 rounded-lg border border-[color-mix(in_oklch,var(--accent)_50%,transparent)] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="font-medium text-foreground">Perlu perhatian</p>
            <p className="text-sm text-muted-foreground">
              {kec} konsisten berada di bawah target (&lt;75%) sepanjang Q1–Q3. Rekomendasi: tinjau intervensi program prioritas.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground">Tren Capaian (%)</h2>
        <p className="mb-4 text-xs text-muted-foreground">Persentase realisasi terhadap target per periode.</p>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
              <XAxis dataKey="periode" />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Rata-rata" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
              {PROGRAM.map((p, i) => (
                <Line key={p} type="monotone" dataKey={p} stroke={colors[i]} strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-foreground">Breakdown per Periode</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Periode</th>
                <th className="px-5 py-3 text-left">Program</th>
                <th className="px-5 py-3 text-right">Target</th>
                <th className="px-5 py-3 text-right">Realisasi</th>
                <th className="px-5 py-3 text-right">% Capaian</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{r.periode}</td>
                  <td className="px-5 py-3">{r.program}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.target.toLocaleString("id-ID")}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.realisasi.toLocaleString("id-ID")}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">{r.pct.toFixed(1)}%</td>
                  <td className="px-5 py-3"><StatusBadge pct={r.pct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}