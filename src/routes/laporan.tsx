import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Shell } from "@/components/Shell";
import { DATA, KECAMATAN, PERIODE, PROGRAM, aggregate, type Periode, type Program } from "@/lib/simonev-data";
import { Select, StatusBadge } from "./index";

export const Route = createFileRoute("/laporan")({
  head: () => ({ meta: [{ title: "Laporan — SIMONEV-KD" }] }),
  component: LaporanPage,
});

function LaporanPage() {
  const [periode, setPeriode] = useState<Periode | "ALL">("ALL");
  const [program, setProgram] = useState<Program | "ALL">("ALL");

  const matrix = useMemo(() => {
    return KECAMATAN.map((k) => {
      const rows = DATA.filter(
        (r) =>
          r.kecamatan === k &&
          (periode === "ALL" || r.periode === periode) &&
          (program === "ALL" || r.program === program),
      );
      return { kecamatan: k, ...aggregate(rows) };
    });
  }, [periode, program]);

  const totals = matrix.reduce(
    (a, r) => ({ target: a.target + r.target, realisasi: a.realisasi + r.realisasi }),
    { target: 0, realisasi: 0 },
  );
  const totalPct = totals.target === 0 ? 0 : (totals.realisasi / totals.target) * 100;

  function exportCsv() {
    const header = ["Kecamatan", "Target", "Realisasi", "Gap", "% Capaian"];
    const rows = matrix.map((r) => [r.kecamatan, r.target, r.realisasi, r.gap, r.pct.toFixed(2)]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simonev-kd-laporan-${periode}-${program}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell title="Laporan" subtitle="Rekap capaian per kecamatan, siap diekspor">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Periode" value={periode} onChange={(v) => setPeriode(v as Periode | "ALL")}
            options={[{ v: "ALL", l: "Semua Periode" }, ...PERIODE.map((p) => ({ v: p, l: p }))]} />
          <Select label="Program Prioritas" value={program} onChange={(v) => setProgram(v as Program | "ALL")}
            options={[{ v: "ALL", l: "Semua Program" }, ...PROGRAM.map((p) => ({ v: p, l: p }))]} />
          <div className="flex items-end gap-2">
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-dark)]">
              <Download className="h-4 w-4" /> Ekspor CSV
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              <Printer className="h-4 w-4" /> Cetak
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-baseline justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Rekap Capaian per Kecamatan</h2>
            <p className="text-xs text-muted-foreground">
              {periode === "ALL" ? "Semua periode" : periode} · {program === "ALL" ? "Semua program" : program}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total capaian agregat</div>
            <div className="text-2xl font-semibold tabular-nums">{totalPct.toFixed(1)}%</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Kecamatan</th>
                <th className="px-5 py-3 text-right">Target</th>
                <th className="px-5 py-3 text-right">Realisasi</th>
                <th className="px-5 py-3 text-right">Gap</th>
                <th className="px-5 py-3 text-right">% Capaian</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((r) => (
                <tr key={r.kecamatan} className="border-t hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{r.kecamatan}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.target.toLocaleString("id-ID")}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.realisasi.toLocaleString("id-ID")}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.gap.toLocaleString("id-ID")}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">{r.pct.toFixed(1)}%</td>
                  <td className="px-5 py-3"><StatusBadge pct={r.pct} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/40 font-semibold">
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3 text-right tabular-nums">{totals.target.toLocaleString("id-ID")}</td>
                <td className="px-5 py-3 text-right tabular-nums">{totals.realisasi.toLocaleString("id-ID")}</td>
                <td className="px-5 py-3 text-right tabular-nums">{(totals.target - totals.realisasi).toLocaleString("id-ID")}</td>
                <td className="px-5 py-3 text-right tabular-nums">{totalPct.toFixed(1)}%</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Shell>
  );
}