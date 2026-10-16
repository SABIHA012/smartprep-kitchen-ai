import { describe, it, expect } from "vitest";
import { recommendedPrep } from "@/lib/model";
import { generateDataset, FEATURE_COLUMNS } from "@/lib/data";

describe("SmartPrep rules", () => {
  it("adds the safety buffer and rounds up", () => {
    expect(recommendedPrep(100, 10)).toBe(110);
    expect(recommendedPrep(101, 10)).toBe(112);
  });
  it("sample dataset has 720 records", () => {
    expect(generateDataset()).toHaveLength(720);
  });
  it("never uses simulated or target columns as inputs", () => {
    for (const c of FEATURE_COLUMNS) expect(c.startsWith("sim_") || c === "orders").toBe(false);
  });
});
