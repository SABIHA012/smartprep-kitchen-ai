import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, Stat, SyntheticBadge, tooltipStyle } from "@/components/AppShell";
import { buildPlan, useStore } from "@/lib/store";
import { MODEL_METRICS } from "@/lib/model";
import { seo } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => seo("Dashboard", "Predicted orders, recommended preparation and surplus risk for restaurant kitchens."),
  component: Dashboard,
});

function Dashboard() {
  const { data, model, buffer } = useStore();
  const plan = useMemo(() => buildPlan(data, model, buffer), [data, model, buffer]);
  const nextWeek = Math.max(...data.map((r) => r.week)) + 1;
  const totPred = plan.reduce((s, p) => s + p.predicted, 0);
  const totRec = plan.reduce((s, p) => s + p.recommended, 0);
  const high = plan.filter((p) => p.risk === "high");
  const surplus = plan.reduce((s, p) => s + p.surplusRisk, 0);
  const byMeal = useMemo(() => {
    const m = new Map<string, { meal: string; predicted: number; recommended: number; lastPrepared: number }>();
    for (const p of plan) {
      const e = m.get(p.meal_name) ?? { meal: p.meal_name, predicted: 0, recommended: 0, lastPrepared: 0 };
      e.predicted += p.predicted; e.recommended += p.recommended; e.lastPrepared += p.lastPrepared;
      m.set(p.meal_name, e);
    }
    return [...m.values()];
  }, [plan]);

  return (
    <>
      <PageHeader title="Kitchen dashboard" subtitle={`Demo outlook for week ${nextWeek} across all centres, assuming no promotion, no special event and standard prices.`}>
        <div className="flex flex-wrap gap-2"><SyntheticBadge /><SyntheticBadge label="Demo predictions" /></div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Predicted orders" value={totPred.toLocaleString()} hint={`Week ${nextWeek}, ${plan.length} meal–centre pairs`} />
        <Stat label="Recommended prep" value={totRec.toLocaleString()} hint={`Includes ${buffer}% safety buffer`} />
        <Stat label="High surplus-risk items" value={high.length} tone={high.length ? "danger" : "default"} hint="Meal–centre pairs to review" />
        <Stat label="Est. surplus if unchanged" value={`${surplus.toLocaleString()} units`} tone="warn" hint="Simulated: last week's prep minus prediction" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Prediction vs preparation by meal" className="xl:col-span-2">
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={byMeal} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="meal" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="predicted" name="Predicted (demo)" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recommended" name="Recommended prep" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lastPrepared" name="Last week prepared (simulated)" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Highest surplus risk" action={<Button asChild size="sm" variant="outline"><Link to="/alerts">View all</Link></Button>}>
          <ul className="space-y-3">
            {[...plan].sort((a, b) => b.surplusRisk - a.surplusRisk).slice(0, 6).map((p) => (
              <li key={`${p.meal_id}-${p.centre_id}`} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.meal_name}</p><p className="truncate text-xs text-muted-foreground">{p.centre_name}</p></div>
                <span className="shrink-0 text-sm font-semibold text-destructive">+{p.surplusRisk}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="How forecasting reduces over-preparation">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Kitchens often prepare by habit or gut feel. A demand forecast estimates how many Orders to expect for each meal and centre,
            given price, promotions and events. Preparing close to that forecast — plus a small, deliberate safety buffer — cuts the
            gap between food cooked and food sold, which is where avoidable waste and cost come from.
          </p>
          <p className="mt-3 rounded-lg bg-warning/20 p-3 text-xs text-warning-foreground">
            All figures here come from a synthetic dataset and simulated waste estimates. Actual waste reduction must be measured using real restaurant data.
          </p>
        </Panel>
        <Panel title="Model performance">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="MAE" value={MODEL_METRICS.mae} />
            <Metric label="RMSE" value={MODEL_METRICS.rmse} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Current engine: <strong>{model.name}</strong>. No trained model is connected, so no scores are shown. Train Linear Regression or
            Random Forest in Orange on Orders and add its test MAE/RMSE here.
          </p>
        </Panel>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-4 text-center">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value ?? "—"}</p>
      <p className="text-[11px] text-muted-foreground">{value === null ? "Awaiting trained model" : "From Orange"}</p>
    </div>
  );
}
