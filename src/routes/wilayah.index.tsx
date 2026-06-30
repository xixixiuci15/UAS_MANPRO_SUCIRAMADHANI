import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { DATA, KECAMATAN, PERIODE, aggregate, slugify } from "@/lib/simonev-data";
import { StatusBadge } from "./index";

export const Route = createFileRoute("/wilayah/")({
  head: () => ({ meta: [{ title: "Detail Wilayah — SIMONEV-KD" }] }),
  component: WilayahIndex,
});

function WilayahIndex() {
  const cards = KECAMATAN.map((k) => {
    const rows = DATA.filter((r) => r.kecamatan === k && r.periode !== "Q4");
    const agg = aggregate(rows);
    const konsistenBawah = PERIODE.filter((p) => p !== "Q4").every((p) => {
      const sub = DATA.filter((r) => r.kecamatan === k && r.periode === p);
      return aggregate(sub).pct < 75;
    });
    return { kecamatan: k, ...agg, konsistenBawah };
  });

  return (
    <Shell title="Detail Wilayah" subtitle="Pilih kecamatan untuk melihat tren capaian Q1–Q3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.kecamatan}
            to="/wilayah/$slug"
            params={{ slug: slugify(c.kecamatan) }}
            className="group rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{c.kecamatan}</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{c.pct.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Rata-rata capaian Q1–Q3</p>
            <div className="mt-3 flex items-center justify-between">
              <StatusBadge pct={c.pct} />
              {c.konsistenBawah && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)]">
                  <AlertTriangle className="h-3 w-3" /> Konsisten di bawah target
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}