import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, TrendingUp, ChefHat, AlertTriangle, BarChart3, Upload, Leaf } from "lucide-react";
import { useStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/forecast", label: "Demand Forecasting", icon: TrendingUp },
  { to: "/planner", label: "Preparation Planner", icon: ChefHat },
  { to: "/alerts", label: "Waste Risk Alerts", icon: AlertTriangle },
  { to: "/analytics", label: "Data Analytics", icon: BarChart3 },
  { to: "/upload", label: "Dataset Upload", icon: Upload },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { source } = useStore();
  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground lg:flex lg:sticky lg:top-0 lg:h-screen">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium opacity-80 transition hover:bg-sidebar-accent hover:opacity-100 data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground data-[status=active]:opacity-100">
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-sidebar-accent p-3 text-xs leading-relaxed">
          <p className="font-semibold">Active data</p>
          <p className="opacity-80">{source}</p>
        </div>
      </aside>
      <header className="sticky top-0 z-20 bg-sidebar text-sidebar-foreground lg:hidden">
        <div className="px-4 pt-3"><Brand /></div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
              className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium opacity-80 data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground data-[status=active]:opacity-100">
              <Icon className="h-3.5 w-3.5" />{label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Leaf className="h-5 w-5" /></span>
      <div>
        <p className="font-display text-lg font-semibold leading-none">SmartPrep AI</p>
        <p className="text-[11px] opacity-70">Food waste prevention</p>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className = "", action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 shadow-card ${className}`}>
      {title && <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export function SyntheticBadge({ label = "Synthetic data" }: { label?: string }) {
  return <span className="inline-flex items-center rounded-full bg-warning/25 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warning-foreground">{label}</span>;
}

export function Stat({ label, value, hint, tone = "default" }: { label: string; value: string | number; hint?: string; tone?: "default" | "warn" | "danger" }) {
  const toneCls = tone === "danger" ? "text-destructive" : tone === "warn" ? "text-warning-foreground" : "text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${toneCls}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const CHART = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
export const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 };
