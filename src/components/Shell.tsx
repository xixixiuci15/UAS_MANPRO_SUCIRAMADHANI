import logoBappeda from "@/assets/logo-bappeda.jpg";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, MapPin, FileBarChart2, BarChart3, CheckCircle2 } from "lucide-react";
import { LAST_SYNC } from "@/lib/simonev-data";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/wilayah", label: "Detail Wilayah", icon: MapPin, exact: false },
  { to: "/laporan", label: "Laporan", icon: FileBarChart2, exact: true },
];

export function Shell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-white overflow-hidden">
          <img 
            src={logoBappeda} 
            alt="Logo BAPPEDA Kota Depok" 
            className="h-8 w-8 object-contain"
          />
        </div>  
          <div>
            <div className="text-[11px] uppercase tracking-wider opacity-80">BAPPEDA Kota Depok</div>
            <div className="font-semibold leading-tight">SIMONEV-KD</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                    : "hover:bg-sidebar-accent text-sidebar-foreground/90"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-xs opacity-70 border-t border-sidebar-border">
          Modul Monitoring Target vs Realisasi per Wilayah
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-card px-6 py-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <SyncBadge />
        </header>
        <main className="flex-1 p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}

function SyncBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--success)_40%,transparent)] bg-[color-mix(in_oklch,var(--success)_12%,transparent)] px-3 py-1.5 text-xs font-medium text-[color-mix(in_oklch,var(--success)_85%,black)]">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
      </span>
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span>Tersinkronisasi dgn Modul 2 & 3</span>
      <span className="opacity-70">· {LAST_SYNC}</span>
    </div>
  );
}