// SYNTHETIC SmartPrep AI dataset — 720 records (10 meals x 4 centres x 18 weeks).
// Not real restaurant measurements. Generated deterministically so every visit shows the same data.

export interface Meal { id: number; name: string; category: string; basePrice: number; baseDemand: number }
export interface Centre { id: number; name: string; city: string; scale: number }

export interface OrderRecord {
  record_id: number;
  week: number;
  centre_id: number;
  centre_name: string;
  meal_id: number;
  meal_name: string;
  category: string;
  base_price: number;
  selling_price: number;
  discount_pct: number;
  promotion: number; // 0/1
  special_event: number; // 0/1
  orders: number; // prediction TARGET
  // Simulated columns — never used as prediction inputs
  sim_prepared: number;
  sim_overproduction: number;
  sim_shortage: number;
  sim_suggested_prep: number;
}

/** Columns allowed as model inputs. Simulated prep/waste columns are deliberately excluded. */
export const FEATURE_COLUMNS = [
  "week", "centre_id", "meal_id", "base_price", "selling_price", "discount_pct", "promotion", "special_event",
] as const;
export const TARGET_COLUMN = "orders";
export const SIMULATED_COLUMNS = ["sim_prepared", "sim_overproduction", "sim_shortage", "sim_suggested_prep"];

export const MEALS: Meal[] = [
  { id: 101, name: "Paneer Butter Masala", category: "Main", basePrice: 260, baseDemand: 120 },
  { id: 102, name: "Chicken Biryani", category: "Rice", basePrice: 300, baseDemand: 160 },
  { id: 103, name: "Veg Fried Rice", category: "Rice", basePrice: 180, baseDemand: 95 },
  { id: 104, name: "Masala Dosa", category: "Breakfast", basePrice: 120, baseDemand: 140 },
  { id: 105, name: "Grilled Sandwich", category: "Snack", basePrice: 140, baseDemand: 80 },
  { id: 106, name: "Margherita Pizza", category: "Main", basePrice: 320, baseDemand: 70 },
  { id: 107, name: "Caesar Salad", category: "Salad", basePrice: 220, baseDemand: 45 },
  { id: 108, name: "Dal Tadka Thali", category: "Thali", basePrice: 200, baseDemand: 110 },
  { id: 109, name: "Hakka Noodles", category: "Main", basePrice: 190, baseDemand: 90 },
  { id: 110, name: "Gulab Jamun", category: "Dessert", basePrice: 90, baseDemand: 60 },
];

export const CENTRES: Centre[] = [
  { id: 1, name: "Central Kitchen A", city: "Mumbai", scale: 1.3 },
  { id: 2, name: "Riverside Centre", city: "Pune", scale: 1.0 },
  { id: 3, name: "Tech Park Outlet", city: "Bengaluru", scale: 1.15 },
  { id: 4, name: "Old Town Kitchen", city: "Jaipur", scale: 0.8 },
];

export const WEEKS = 18;

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDataset(): OrderRecord[] {
  const rand = mulberry32(42);
  const rows: OrderRecord[] = [];
  let id = 1;
  for (let week = 1; week <= WEEKS; week++) {
    const special = week % 6 === 0 ? 1 : 0; // festival/event weeks
    for (const c of CENTRES) {
      for (const m of MEALS) {
        const promotion = rand() < 0.25 ? 1 : 0;
        const discount = promotion ? [10, 15, 20, 25][Math.floor(rand() * 4)] : rand() < 0.15 ? 5 : 0;
        const price = Math.round(m.basePrice * (1 - discount / 100));
        const seasonal = 1 + 0.08 * Math.sin((week / WEEKS) * Math.PI * 2);
        const noise = 0.82 + rand() * 0.36;
        const orders = Math.max(5, Math.round(
          m.baseDemand * c.scale * seasonal * (promotion ? 1.28 : 1) * (special ? 1.35 : 1) *
          Math.pow(m.basePrice / price, 1.1) * noise,
        ));
        // Simulated kitchen behaviour: staff guess with a rough rule of thumb
        const prepared = Math.round(m.baseDemand * c.scale * (special ? 1.2 : 1.05) * (1 + rand() * 0.3));
        rows.push({
          record_id: id++, week, centre_id: c.id, centre_name: c.name, meal_id: m.id, meal_name: m.name,
          category: m.category, base_price: m.basePrice, selling_price: price, discount_pct: discount,
          promotion, special_event: special, orders,
          sim_prepared: prepared,
          sim_overproduction: Math.max(0, prepared - orders),
          sim_shortage: Math.max(0, orders - prepared),
          sim_suggested_prep: Math.ceil(orders * 1.1),
        });
      }
    }
  }
  return rows;
}

export const REQUIRED_COLUMNS = ["week", "centre_id", "meal_id", "selling_price", "base_price", "discount_pct", "promotion", "special_event", "orders"];

/** Minimal CSV parser supporting quoted fields. */
export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const out: string[][] = [];
  let row: string[] = []; let field = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) out.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) out.push(row);
  const [headers = [], ...rows] = out;
  return { headers: headers.map((h) => h.trim()), rows };
}

export function toCSV(rows: OrderRecord[]): string {
  const headers = Object.keys(rows[0]) as (keyof OrderRecord)[];
  return [headers.join(","), ...rows.map((r) => headers.map((h) => {
    const v = String(r[h]); return v.includes(",") ? `"${v}"` : v;
  }).join(","))].join("\n");
}

/** Convert uploaded CSV into records when it has the needed columns. */
export function recordsFromCSV(headers: string[], rows: string[][]): OrderRecord[] | null {
  const idx = (k: string) => headers.indexOf(k);
  if (!REQUIRED_COLUMNS.every((k) => idx(k) >= 0)) return null;
  const num = (r: string[], k: string) => (idx(k) >= 0 ? Number(r[idx(k)]) || 0 : 0);
  const str = (r: string[], k: string, fb: string) => (idx(k) >= 0 && r[idx(k)] ? r[idx(k)] : fb);
  return rows.map((r, i) => {
    const orders = num(r, "orders");
    const prepared = num(r, "sim_prepared");
    return {
      record_id: num(r, "record_id") || i + 1,
      week: num(r, "week"), centre_id: num(r, "centre_id"),
      centre_name: str(r, "centre_name", `Centre ${num(r, "centre_id")}`),
      meal_id: num(r, "meal_id"), meal_name: str(r, "meal_name", `Meal ${num(r, "meal_id")}`),
      category: str(r, "category", "—"), base_price: num(r, "base_price"), selling_price: num(r, "selling_price"),
      discount_pct: num(r, "discount_pct"), promotion: num(r, "promotion"), special_event: num(r, "special_event"),
      orders, sim_prepared: prepared, sim_overproduction: num(r, "sim_overproduction"),
      sim_shortage: num(r, "sim_shortage"), sim_suggested_prep: num(r, "sim_suggested_prep"),
    };
  });
}
