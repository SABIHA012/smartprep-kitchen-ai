import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, Stat, SyntheticBadge } from "@/components/AppShell";
import { buildPlan, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/planner")({
  head: () => seo("Preparation Planner", "Recommended preparation quantities from predicted demand and an adjustable safety buffer."),
  component: Planner,
});

function Planner() {
  const { data, model, buffer, setBuffer } = useStore();
  const [centre, setCentre] = useState("all");
  const plan = useMemo(() => buildPlan(data, model, buffer), [data, model, buffer]);
  const centres = [...new Map(plan.map((p) => [p.centre_id, p.centre_name])).entries()];
  const rows = plan.filter((p) => centre === "all" || String(p.centre_id) === centre);
  const pred = rows.reduce((s, r) => s + r.predicted, 0);
  const rec = rows.reduce((s, r) => s + r.recommended, 0);
  const last = rows.reduce((s, r) => s + r.lastPrepared, 0);

  return (
    <>
      <PageHeader title="Preparation planner" subtitle="Recommended units = demo predicted demand × (1 + safety buffer), rounded up. Adjust the buffer to balance waste against running out.">
        <SyntheticBadge label="Demo predictions" />
      </PageHeader>
      <Panel>
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="mb-3 flex items-baseline justify-between"><p className="text-sm font-semibold">Safety buffer</p><p className="font-display text-3xl text-primary">{buffer}%</p></div>
            <Slider value={[buffer]} max={50} step={1} onValueChange={([v]) => setBuffer(v)} />
            <div className="mt-3 flex flex-wrap gap-2">
              {[0, 5, 10, 15, 20].map((b) => <Button key={b} size="sm" variant={b === buffer ? "default" : "outline"} onClick={() => setBuffer(b)}>{b}%</Button>)}
            </div>
          </div>
          <Select value={centre} onValueChange={setCentre}>
            <SelectTrigger className="w-full md:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All centres</SelectItem>
              {centres.map(([id, n]) => <SelectItem key={id} value={String(id)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Panel>
      <div className="my-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Predicted demand" value={pred.toLocaleString()} />
        <Stat label="Recommended prep" value={rec.toLocaleString()} hint={`+${rec - pred} buffer units`} />
        <Stat label="vs last week's simulated prep" value={`${rec - last >= 0 ? "+" : ""}${(rec - last).toLocaleString()}`} tone={rec < last ? "default" : "warn"} hint={`Simulated prep was ${last.toLocaleString()} units`} />
      </div>
      <Panel title="Plan by meal and centre">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Meal</TableHead><TableHead>Centre</TableHead><TableHead className="text-right">Hist. avg</TableHead>
              <TableHead className="text-right">Predicted</TableHead><TableHead className="text-right">Prepare</TableHead><TableHead className="text-right">Last prep (sim.)</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.meal_id}-${r.centre_id}`}>
                  <TableCell className="font-medium">{r.meal_name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.centre_name}</TableCell>
                  <TableCell className="text-right">{r.histAvg}</TableCell>
                  <TableCell className="text-right">{r.predicted}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{r.recommended}</TableCell>
                  <TableCell className={`text-right ${r.lastPrepared > r.recommended ? "text-destructive" : ""}`}>{r.lastPrepared}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </>
  );
}
