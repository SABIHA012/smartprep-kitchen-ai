import type { OrderRecord } from "./data";

export interface PredictionInput {
  meal_id: number; centre_id: number; week: number; promotion: number;
  discount_pct: number; selling_price: number; special_event: number;
}

/**
 * Pluggable model interface. Replace DemoHeuristicModel with an Orange-trained
 * Linear Regression / Random Forest (e.g. exported coefficients or an API call).
 */
export interface DemandModel {
  name: string;
  isDemo: boolean;
  predict(input: PredictionInput): number;
}

/** Performance metrics are only shown once a real trained model reports them. */
export interface ModelMetrics { mae: number | null; rmse: number | null; source: string | null }
export const MODEL_METRICS: ModelMetrics = { mae: null, rmse: null, source: null };

const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

/**
 * DEMO ONLY — a transparent rule-based estimator, NOT a trained ML model.
 * It uses historical average Orders per meal×centre and multiplies by uplift ratios
 * observed in the data for promotions, special events and price. Uses feature columns only.
 */
export function buildDemoModel(data: OrderRecord[]): DemandModel & { factors: { promotion: number; special_event: number; elasticity: number } } {
  const base = new Map<string, number[]>();
  const basePrice = new Map<number, number>();
  for (const r of data) {
    if (r.promotion || r.special_event) continue;
    const k = `${r.meal_id}-${r.centre_id}`;
    (base.get(k) ?? base.set(k, []).get(k)!).push(r.orders * Math.pow(r.selling_price / (r.base_price || 1), 1.1));
    basePrice.set(r.meal_id, r.base_price);
  }
  const ratio = (f: (r: OrderRecord) => boolean, g: (r: OrderRecord) => boolean) => {
    const a = mean(data.filter(f).map((r) => r.orders)); const b = mean(data.filter(g).map((r) => r.orders));
    return a && b ? a / b : 1;
  };
  const promoF = ratio((r) => r.promotion === 1 && !r.special_event, (r) => r.promotion === 0 && !r.special_event);
  const eventF = ratio((r) => r.special_event === 1 && !r.promotion, (r) => r.special_event === 0 && !r.promotion);
  const overall = mean(data.map((r) => r.orders));
  return {
    name: "Demo rule-based estimator (not a trained model)",
    isDemo: true,
    factors: { promotion: promoF, special_event: eventF, elasticity: 1.1 },
    predict(i) {
      const b = mean(base.get(`${i.meal_id}-${i.centre_id}`) ?? []) || overall;
      const bp = basePrice.get(i.meal_id) ?? i.selling_price;
      const priceF = Math.pow(bp / Math.max(1, i.selling_price), 1.1);
      return Math.max(0, Math.round(b * (i.promotion ? promoF : 1) * (i.special_event ? eventF : 1) * priceF));
    },
  };
}

/** Recommended preparation units = predicted demand plus safety buffer, rounded up. */
export function recommendedPrep(predicted: number, bufferPct: number): number {
  return Math.ceil(Math.round(predicted * (100 + Math.max(0, bufferPct)) * 1e6) / 1e8);
}
