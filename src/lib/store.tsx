import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { generateDataset, type OrderRecord } from "./data";
import { buildDemoModel, recommendedPrep } from "./model";

interface Ctx {
  data: OrderRecord[];
  source: string;
  setData: (d: OrderRecord[], source: string) => void;
  resetData: () => void;
  buffer: number;
  setBuffer: (n: number) => void;
  model: ReturnType<typeof buildDemoModel>;
}
const StoreCtx = createContext<Ctx | null>(null);
const SAMPLE = "SmartPrep AI sample dataset (synthetic, 720 records)";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setD] = useState<OrderRecord[]>(() => generateDataset());
  const [source, setSource] = useState(SAMPLE);
  const [buffer, setBuffer] = useState(10);
  const model = useMemo(() => buildDemoModel(data), [data]);
  const value = useMemo<Ctx>(() => ({
    data, source, buffer, setBuffer, model,
    setData: (d, s) => { setD(d); setSource(s); },
    resetData: () => { setD(generateDataset()); setSource(SAMPLE); },
  }), [data, source, buffer, model]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

export interface PlanRow {
  meal_id: number; meal_name: string; centre_id: number; centre_name: string;
  predicted: number; recommended: number; lastPrepared: number; histAvg: number; cv: number;
  surplusRisk: number; reasons: string[]; risk: "high" | "medium" | "low";
}

/** Next-week (week = max+1) plan per meal×centre with default conditions (no promo, no event, base price). */
export function buildPlan(data: OrderRecord[], model: Ctx["model"], buffer: number): PlanRow[] {
  const maxWeek = Math.max(...data.map((r) => r.week));
  const groups = new Map<string, OrderRecord[]>();
  for (const r of data) {
    const k = `${r.meal_id}-${r.centre_id}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  return [...groups.values()].map((rows) => {
    rows.sort((a, b) => a.week - b.week);
    const last = rows[rows.length - 1];
    const o = rows.map((r) => r.orders);
    const avg = o.reduce((s, v) => s + v, 0) / o.length;
    const sd = Math.sqrt(o.reduce((s, v) => s + (v - avg) ** 2, 0) / o.length);
    const predicted = model.predict({
      meal_id: last.meal_id, centre_id: last.centre_id, week: maxWeek + 1, promotion: 0,
      discount_pct: 0, selling_price: last.base_price, special_event: 0,
    });
    const recommended = recommendedPrep(predicted, buffer);
    const lastPrepared = last.sim_prepared;
    const surplusRisk = Math.max(0, lastPrepared - predicted);
    const reasons: string[] = [];
    if (lastPrepared > recommended * 1.1) reasons.push(`Last week's simulated prep (${lastPrepared}) is ${Math.round((lastPrepared / recommended - 1) * 100)}% above the recommended ${recommended}.`);
    if (last.promotion) reasons.push("A promotion ran last week; demand may fall back without it.");
    if (last.special_event) reasons.push("Last week was a special-event week; normal-week demand is usually lower.");
    if (sd / avg > 0.25) reasons.push(`Demand is volatile (variation ${Math.round((sd / avg) * 100)}%), so fixed prep levels often miss.`);
    if (buffer > 25) reasons.push(`The safety buffer (${buffer}%) is high and adds extra units.`);
    const ratio = surplusRisk / Math.max(1, predicted);
    const risk = ratio > 0.25 || reasons.length >= 3 ? "high" : ratio > 0.1 || reasons.length >= 1 ? "medium" : "low";
    return {
      meal_id: last.meal_id, meal_name: last.meal_name, centre_id: last.centre_id, centre_name: last.centre_name,
      predicted, recommended, lastPrepared, histAvg: Math.round(avg), cv: sd / avg, surplusRisk, reasons, risk,
    };
  });
}
