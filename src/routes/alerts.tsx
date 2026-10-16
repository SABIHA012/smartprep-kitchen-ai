import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader, Panel, SyntheticBadge } from "@/components/AppShell";
import { buildPlan, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/alerts")({
  head: () => seo("Waste Risk Alerts", "Meals at risk of overproduction and why their preparation should be reviewed."),
  component: Alerts,
});

const LEVELS = ["high", "medium", "low"] as const;

function Alerts() {
  const { data, model, buffer } = useStore();
  const plan = useMemo(() => buildPlan(data, model, buffer), [data, model, buffer]);
  const [level, setLevel] = useState<(typeof LEVELS)[number] | "all">("high");
  const rows = plan.filter((p) => (level === "all" ? p.risk !== "low" : p.risk === level)).sort((a, b) => b.surplusRisk - a.surplusRisk);
  const counts = Object.fromEntries(LEVELS.map((l) => [l, plan.filter((p) => p.risk === l).length]));

  return (
    <>
      <PageHeader title="Waste risk alerts" subtitle="Items where the kitchen's recent (simulated) preparation is well above the demo forecast, or where conditions suggest demand will drop.">
        <SyntheticBadge label="Simulated waste estimates" />
      </PageHeader>
      <div className="mb-6 flex flex-wrap gap-2">
        {(["high", "medium", "low", "all"] as const).map((l) => (
          <Button key={l} size="sm" variant={level === l ? "default" : "outline"} onClick={() => setLevel(l)} className="capitalize">
            {l === "all" ? "All flagged" : `${l} (${counts[l]})`}
          </Button>
        ))}
      </div>
      {rows.length === 0 ? (
        <Panel><p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" />No items at this level.</p></Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <article key={`${r.meal_id}-${r.centre_id}`} className={`rounded-2xl border bg-card p-5 shadow-card ${r.risk === "high" ? "border-destructive/40" : "border-border"}`}>
              <div className="flex items-start justify-between gap-2">
                <div><h3 className="text-lg font-semibold">{r.meal_name}</h3><p className="text-xs text-muted-foreground">{r.centre_name}</p></div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${r.risk === "high" ? "bg-destructive/15 text-destructive" : r.risk === "medium" ? "bg-warning/25 text-warning-foreground" : "bg-secondary text-secondary-foreground"}`}>{r.risk}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini label="Forecast" v={r.predicted} /><Mini label="Recommend" v={r.recommended} /><Mini label="Last prep" v={r.lastPrepared} />
              </div>
              <p className="mt-3 text-sm font-semibold text-destructive">Possible surplus: {r.surplusRisk} units</p>
              <ul className="mt-2 space-y-1.5">
                {(r.reasons.length ? r.reasons : ["Small gap between simulated prep and forecast."]).map((x) => (
                  <li key={x} className="flex gap-2 text-xs text-muted-foreground"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />{x}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Why review? Preparing above expected demand turns directly into leftover food and cost. Use the <Link to="/planner" className="font-semibold text-primary underline">planner</Link> to set
        quantities closer to the forecast. These alerts rely on synthetic data — real waste reduction must be measured with real restaurant records.
      </p>
    </>
  );
}

function Mini({ label, v }: { label: string; v: number }) {
  return <div className="rounded-lg bg-muted p-2"><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="font-semibold">{v}</p></div>;
}
