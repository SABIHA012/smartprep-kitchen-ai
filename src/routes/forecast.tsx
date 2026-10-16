import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, SyntheticBadge, tooltipStyle } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { recommendedPrep } from "@/lib/model";
import { seo } from "@/lib/seo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/forecast")({
  head: () => seo("Demand Forecasting", "Estimate meal demand by centre, week, price, promotion and special events."),
  component: Forecast,
});

function Forecast() {
  const { data, model, buffer } = useStore();
  const meals = useMemo(() => [...new Map(data.map((r) => [r.meal_id, r])).values()], [data]);
  const centres = useMemo(() => [...new Map(data.map((r) => [r.centre_id, r.centre_name])).entries()], [data]);
  const maxWeek = Math.max(...data.map((r) => r.week));
  const [mealId, setMealId] = useState(meals[0]?.meal_id ?? 0);
  const [centreId, setCentreId] = useState(centres[0]?.[0] ?? 0);
  const [week, setWeek] = useState(maxWeek + 1);
  const [promo, setPromo] = useState(false);
  const [event, setEvent] = useState(false);
  const meal = meals.find((m) => m.meal_id === mealId) ?? meals[0];
  const [discount, setDiscount] = useState(0);
  const [price, setPrice] = useState(meal?.base_price ?? 0);

  const changeMeal = (id: number) => { setMealId(id); const m = meals.find((x) => x.meal_id === id); if (m) setPrice(Math.round(m.base_price * (1 - discount / 100))); };
  const changeDiscount = (d: number) => { setDiscount(d); setPrice(Math.round((meal?.base_price ?? 0) * (1 - d / 100))); };

  const predicted = model.predict({ meal_id: mealId, centre_id: centreId, week, promotion: promo ? 1 : 0, discount_pct: discount, selling_price: price, special_event: event ? 1 : 0 });
  const baseline = model.predict({ meal_id: mealId, centre_id: centreId, week, promotion: 0, discount_pct: 0, selling_price: meal?.base_price ?? price, special_event: 0 });

  const history = data.filter((r) => r.meal_id === mealId && r.centre_id === centreId).sort((a, b) => a.week - b.week)
    .map((r) => ({ week: r.week, actual: r.orders, demo: model.predict(r) }));
  const chart = [...history, { week, scenario: predicted }];
  const histWeek = history.find((h) => h.week === week);

  return (
    <>
      <PageHeader title="Demand forecasting" subtitle="Set the conditions for a meal and see the demo estimate of Orders. Inputs use only menu, centre, week, price, promotion and event data.">
        <SyntheticBadge label="Demo prediction" />
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Scenario">
          <div className="space-y-4">
            <Field label="Meal">
              <Select value={String(mealId)} onValueChange={(v) => changeMeal(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{meals.map((m) => <SelectItem key={m.meal_id} value={String(m.meal_id)}>{m.meal_name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Fulfilment centre">
              <Select value={String(centreId)} onValueChange={(v) => setCentreId(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{centres.map(([id, n]) => <SelectItem key={id} value={String(id)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={`Week (data covers 1–${maxWeek})`}><Input type="number" min={1} value={week} onChange={(e) => setWeek(Math.max(1, Number(e.target.value) || 1))} /></Field>
            <Field label={`Discount: ${discount}%`}><Slider value={[discount]} max={50} step={5} onValueChange={([v]) => changeDiscount(v ?? 0)} /></Field>
            <Field label={`Selling price (base ₹${meal?.base_price})`}><Input type="number" min={1} value={price} onChange={(e) => setPrice(Math.max(1, Number(e.target.value) || 1))} /></Field>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3"><Label htmlFor="promo">Promotion running</Label><Switch id="promo" checked={promo} onCheckedChange={setPromo} /></div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3"><Label htmlFor="event">Special event</Label><Switch id="event" checked={event} onCheckedChange={setEvent} /></div>
          </div>
        </Panel>
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-hero p-6 text-primary-foreground shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Demo predicted demand · week {week}</p>
            <p className="mt-2 font-display text-5xl font-semibold">{predicted} <span className="text-xl font-normal opacity-80">orders</span></p>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><p className="opacity-70">Normal-week baseline</p><p className="font-semibold">{baseline}</p></div>
              <div><p className="opacity-70">Change vs baseline</p><p className="font-semibold">{baseline ? `${predicted >= baseline ? "+" : ""}${Math.round((predicted / baseline - 1) * 100)}%` : "—"}</p></div>
              <div><p className="opacity-70">Prep with {buffer}% buffer</p><p className="font-semibold">{recommendedPrep(predicted, buffer)}</p></div>
            </div>
            {histWeek && <p className="mt-3 text-xs opacity-80">Synthetic actual Orders recorded for week {week}: {histWeek.actual}</p>}
          </div>
          <Panel title="Historical orders vs demo estimate">
            <div className="h-80">
              <ResponsiveContainer>
                <LineChart data={chart} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line dataKey="actual" name="Actual orders (synthetic)" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 2 }} />
                  <Line dataKey="demo" name="Demo estimate" stroke="var(--chart-3)" strokeDasharray="5 4" strokeWidth={2} dot={false} />
                  <Line dataKey="scenario" name="Your scenario" stroke="var(--chart-4)" strokeWidth={0} dot={{ r: 7 }} />
                  <ReferenceLine y={baseline} stroke="var(--muted-foreground)" strokeDasharray="2 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Demo engine: historical normal-week average for this meal and centre, scaled by the promotion uplift (×{model.factors.promotion.toFixed(2)}) and
              event uplift (×{model.factors.special_event.toFixed(2)}) seen in the data, and by price. This is not a trained ML model.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
