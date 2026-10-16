import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, PageHeader, Panel, SyntheticBadge, tooltipStyle } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import type { OrderRecord } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/analytics")({
  head: () => seo("Data Analytics", "Compare demand across meals, centres, weeks, promotions and special events."),
  component: Analytics,
});

function avgBy(rows: OrderRecord[], key: (r: OrderRecord) => string | number) {
  const m = new Map<string | number, { total: number; n: number }>();
  for (const r of rows) { const k = key(r); const e = m.get(k) ?? { total: 0, n: 0 }; e.total += r.orders; e.n++; m.set(k, e); }
  return [...m.entries()].map(([name, e]) => ({ name, total: e.total, avg: Math.round(e.total / e.n) }));
}

function Analytics() {
  const { data } = useStore();
  const [meal, setMeal] = useState("all");
  const meals = useMemo(() => [...new Map(data.map((r) => [r.meal_id, r.meal_name])).entries()], [data]);
  const rows = useMemo(() => data.filter((r) => meal === "all" || String(r.meal_id) === meal), [data, meal]);
  const byMeal = avgBy(data, (r) => r.meal_name).sort((a, b) => b.total - a.total);
  const byCentre = avgBy(rows, (r) => r.centre_name);
  const byWeek = useMemo(() => {
    const m = new Map<number, { week: number; orders: number; waste: number }>();
    for (const r of rows) { const e = m.get(r.week) ?? { week: r.week, orders: 0, waste: 0 }; e.orders += r.orders; e.waste += r.sim_overproduction; m.set(r.week, e); }
    return [...m.values()].sort((a, b) => a.week - b.week);
  }, [rows]);
  const promo = avgBy(rows, (r) => (r.promotion ? "With promotion" : "No promotion"));
  const event = avgBy(rows, (r) => (r.special_event ? "Special event" : "Normal week"));

  return (
    <>
      <PageHeader title="Data analytics" subtitle={`Exploring ${data.length} records. Values are synthetic Orders and simulated overproduction.`}>
        <div className="flex items-center gap-2">
          <SyntheticBadge />
          <Select value={meal} onValueChange={setMeal}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All meals</SelectItem>{meals.map(([id, n]) => <SelectItem key={id} value={String(id)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Total orders by meal" className="lg:col-span-2">
          <div className="h-72"><ResponsiveContainer>
            <BarChart data={byMeal} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="total" name="Orders" radius={[4, 4, 0, 0]}>{byMeal.map((m, i) => <Cell key={m.name} fill={String(m.name) === meals.find(([id]) => String(id) === meal)?.[1] || meal === "all" ? CHART[i % 2] : "var(--muted)"} />)}</Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Weekly orders vs simulated overproduction" className="lg:col-span-2">
          <div className="h-72"><ResponsiveContainer>
            <AreaChart data={byWeek} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Area dataKey="orders" name="Orders" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} />
              <Area dataKey="waste" name="Overproduction (simulated)" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Average orders by centre">
          <div className="h-64"><ResponsiveContainer>
            <BarChart data={byCentre} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip contentStyle={tooltipStyle} /><Bar dataKey="avg" name="Avg orders" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <div className="grid gap-6 sm:grid-cols-2">
          <Compare title="Promotion effect" data={promo} />
          <Compare title="Special-event effect" data={event} />
        </div>
      </div>
    </>
  );
}

function Compare({ title, data }: { title: string; data: { name: string | number; avg: number; total: number }[] }) {
  return (
    <Panel title={title}>
      <div className="h-40"><ResponsiveContainer>
        <PieChart><Pie data={data} dataKey="avg" nameKey="name" innerRadius={35} outerRadius={60}>{data.map((d, i) => <Cell key={d.name} fill={CHART[i === 0 ? 0 : 2]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
      </ResponsiveContainer></div>
      <ul className="mt-2 space-y-1 text-xs">{data.map((d) => <li key={d.name} className="flex justify-between"><span className="text-muted-foreground">{d.name}</span><span className="font-semibold">{d.avg} avg</span></li>)}</ul>
    </Panel>
  );
}
