export const KECAMATAN = [
  "Beji",
  "Bojongsari",
  "Cilodong",
  "Cimanggis",
  "Cinere",
  "Cipayung",
  "Limo",
  "Pancoran Mas",
  "Sawangan",
  "Sukmajaya",
  "Tapos",
] as const;

export type Kecamatan = (typeof KECAMATAN)[number];

export const PROGRAM = [
  "Penurunan Stunting",
  "Penanggulangan Kemiskinan",
  "Infrastruktur Jalan",
  "Pelayanan Kesehatan",
] as const;
export type Program = (typeof PROGRAM)[number];

export const PERIODE = ["Q1", "Q2", "Q3", "Q4"] as const;
export type Periode = (typeof PERIODE)[number];

export type Row = {
  kecamatan: Kecamatan;
  program: Program;
  periode: Periode;
  target: number;
  realisasi: number;
};

export const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
export const unslug = (slug: string): Kecamatan | undefined =>
  KECAMATAN.find((k) => slugify(k) === slug);

// Deterministic pseudo-random
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function gen(): Row[] {
  const rnd = seeded(42);
  const rows: Row[] = [];
  for (const kec of KECAMATAN) {
    for (const prog of PROGRAM) {
      // Each kec/program has a base "performance bias" between 0.55 and 1.15
      const bias = 0.6 + rnd() * 0.6;
      for (const per of PERIODE) {
        const target =
          prog === "Infrastruktur Jalan"
            ? Math.round(20 + rnd() * 30) // km
            : prog === "Penurunan Stunting"
              ? Math.round(80 + rnd() * 60) // kasus tertangani
              : prog === "Penanggulangan Kemiskinan"
                ? Math.round(150 + rnd() * 200) // KK
                : Math.round(500 + rnd() * 800); // layanan
        // Q4 belum berjalan -> realisasi 0
        const drift = 0.85 + rnd() * 0.35;
        const realisasi =
          per === "Q4" ? 0 : Math.round(target * bias * drift);
        rows.push({ kecamatan: kec, program: prog, periode: per, target, realisasi });
      }
    }
  }
  return rows;
}

export const DATA: Row[] = gen();

export function aggregate(rows: Row[]) {
  const target = rows.reduce((a, r) => a + r.target, 0);
  const realisasi = rows.reduce((a, r) => a + r.realisasi, 0);
  const pct = target === 0 ? 0 : (realisasi / target) * 100;
  return { target, realisasi, gap: target - realisasi, pct };
}

export type Status = "tercapai" | "mendekati" | "dibawah";
export function statusOf(pct: number): Status {
  if (pct >= 95) return "tercapai";
  if (pct >= 75) return "mendekati";
  return "dibawah";
}

export const LAST_SYNC = "30 Jun 2026, 09:42 WIB";